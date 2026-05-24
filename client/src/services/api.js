// client/src/services/api.js
// Backend ile haberleşen ince istemci katmanı.
// Bileşenler doğrudan fetch çağırmaz; bu dosyayı kullanır.

const BASE = ''; // aynı origin (Vercel + Vite proxy ile aynı domain)

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const msg = data?.error || `İstek başarısız (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  /**
   * Yeni bir performans testi başlatır.
   * @param {{ url: string, requestCount: number, method?: 'GET'|'HEAD' }} payload
   */
  runTest(payload) {
    return request('/api/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Geçmiş test sonuçlarını getirir.
   * @param {number} [limit=20]
   */
  getHistory(limit = 20) {
    return request(`/api/history?limit=${limit}`);
  },
};
