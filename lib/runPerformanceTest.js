// lib/runPerformanceTest.js
// Hedef URL'ye N adet istek atan ve metrik hesaplayan saf fonksiyon.
// Veritabanı bilmez — sadece HTTP testi yapar ve istatistik döner.

import axios from 'axios';

/**
 * Percentile hesaplar.
 * @param {number[]} sorted - Küçükten büyüğe sıralı dizi
 * @param {number} p - 0–1 arası (0.95 = p95)
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

/**
 * Concurrency'li worker pool — N görevi, eşzamanlı en fazla `concurrency`
 * kadar slot üzerinden çalıştırır.
 */
async function runWithConcurrency(total, concurrency, taskFn) {
  const results = new Array(total);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
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
 * Performans testi — hedef URL'ye `requestCount` adet HTTP isteği atar.
 *
 * @param {object} opts
 * @param {string} opts.url
 * @param {number} opts.requestCount
 * @param {number} [opts.concurrency]
 * @param {number} [opts.timeoutMs]
 * @param {'GET'|'HEAD'} [opts.method]
 */
export async function runPerformanceTest({
  url,
  requestCount,
  concurrency = Number(process.env.CONCURRENCY) || 10,
  timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS) || 15000,
  method = 'GET',
}) {
  const records = [];
  const testStart = Date.now();

  await runWithConcurrency(requestCount, concurrency, async (i) => {
    const reqStart = performance.now();
    try {
      const res = await axios.request({
        url,
        method,
        timeout: timeoutMs,
        // Tüm HTTP status kodlarını hata fırlatmadan kabul et.
        validateStatus: () => true,
        // Büyük response body'lerini sınırla (bant genişliği koruma).
        // GET için 512 KB yeterli; HEAD'de body zaten gelmez.
        maxContentLength: 512 * 1024,
        maxBodyLength: 512 * 1024,
        // Zaman ölçümünü bozmamak için decompress kapat.
        decompress: false,
      });

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
  const sum = latencies.reduce((a, b) => a + b, 0);
  const averageLatency = latencies.length ? sum / latencies.length : 0;

  // Veritabanı şişmesin diye sadece ilk 50 sample sakla.
  const samples = [...records]
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
    p95Latency: Math.round(percentile(sorted, 0.95) * 100) / 100,
    successCount,
    errorCount: records.length - successCount,
    successRate:
      records.length === 0
        ? 0
        : Math.round((successCount / records.length) * 10000) / 100,
    totalDurationMs,
    samples,
  };
}
