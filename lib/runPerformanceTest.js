// lib/runPerformanceTest.js
// Hedef bir URL'ye N adet istek atan ve metrik hesaplayan saf fonksiyon.
// Veritabanı bilmez — sadece HTTP testi yapar ve istatistik döner.
// Bu sayede unit test edilmesi ve farklı endpoint'lerden çağrılması kolaydır.

import axios from 'axios';

/**
 * Bir sayı dizisinin verilen yüzdelik dilimini hesaplar (örn. p95).
 * @param {number[]} sorted - Küçükten büyüğe sıralı dizi
 * @param {number} p - 0 ile 1 arasında yüzdelik (0.95 = p95)
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.floor(p * sorted.length)
  );
  return sorted[idx];
}

/**
 * Concurrency'li worker pool — N adet "indeks"i, eşzamanlı en fazla
 * `concurrency` kadar tüketerek `taskFn(index)` çalıştırır.
 *
 * Promise.all ile hepsini aynı anda fırlatmak da mümkün ama bu durumda
 * 1000 isteğin tamamı aynı anda açılır ve hem hedef sunucuyu hem de
 * Vercel lambda kaynaklarını ezeriz. Worker pool deterministic davranır.
 */
async function runWithConcurrency(total, concurrency, taskFn) {
  const results = new Array(total);
  let nextIndex = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= total) return;
      results[i] = await taskFn(i);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Asıl performans testi.
 *
 * @param {object} opts
 * @param {string} opts.url           - Test edilecek hedef URL
 * @param {number} opts.requestCount  - Gönderilecek toplam istek sayısı
 * @param {number} [opts.concurrency] - Eşzamanlı istek sayısı (varsayılan env'den)
 * @param {number} [opts.timeoutMs]   - Her istek için timeout (ms)
 * @param {'GET'|'HEAD'} [opts.method]
 * @returns {Promise<object>} - Aggregate metrikler + sample request log'u
 */
export async function runPerformanceTest({
  url,
  requestCount,
  concurrency = Number(process.env.CONCURRENCY) || 10,
  timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS) || 15000,
  method = 'GET',
}) {
  // Her istek için bir kayıt
  const records = [];

  const testStart = Date.now();

  await runWithConcurrency(requestCount, concurrency, async (i) => {
    const reqStart = performance.now();
    try {
      const res = await axios.request({
        url,
        method,
        timeout: timeoutMs,
        // 5xx dahil tüm statuslar resolve olsun ki kendimiz değerlendirelim.
        validateStatus: () => true,
        // Body'i tutmaya gerek yok — sadece header/status lazım.
        responseType: 'stream',
      });

      // Stream'i drain etmeden socket'i serbest bırakmamak için tüketelim.
      if (res.data && typeof res.data.resume === 'function') {
        res.data.resume();
      }

      const latencyMs = performance.now() - reqStart;
      records.push({
        index: i,
        status: res.status,
        latencyMs: Math.round(latencyMs * 100) / 100,
        ok: res.status >= 200 && res.status < 400,
        error: null,
      });
    } catch (err) {
      const latencyMs = performance.now() - reqStart;
      records.push({
        index: i,
        status: 0,
        latencyMs: Math.round(latencyMs * 100) / 100,
        ok: false,
        error: err.code || err.message || 'unknown_error',
      });
    }
  });

  const totalDurationMs = Date.now() - testStart;

  // ---- Aggregate metrikler ----
  const latencies = records.map((r) => r.latencyMs);
  const sorted = [...latencies].sort((a, b) => a - b);

  const successCount = records.filter((r) => r.ok).length;
  const errorCount = records.length - successCount;

  const sum = latencies.reduce((a, b) => a + b, 0);
  const averageLatency = latencies.length ? sum / latencies.length : 0;

  // Veritabanı şişmesin diye sadece ilk 50 sample sakla.
  const samples = records
    .sort((a, b) => a.index - b.index)
    .slice(0, 50);

  return {
    url,
    method,
    requestCount,
    concurrency,

    averageLatency: Math.round(averageLatency * 100) / 100,
    minLatency: sorted[0] ?? 0,
    maxLatency: sorted[sorted.length - 1] ?? 0,
    p95Latency: percentile(sorted, 0.95),

    successCount,
    errorCount,
    successRate:
      records.length === 0
        ? 0
        : Math.round((successCount / records.length) * 10000) / 100, // 2 ondalık

    totalDurationMs,
    samples,
  };
}
