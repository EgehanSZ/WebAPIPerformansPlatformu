// client/src/services/api.js
// Backend ile haberleşen ince istemci katmanı.
// Her public metot isteğe bağlı bir `token` parametresi alır;
// varsa Authorization: Bearer <token> başlığı olarak taşınır.

const BASE = '';

async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
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
   * @param {{ url: string, requestCount: number, method?: string }} payload
   * @param {string|null} token  Clerk JWT
   */
  runTest(payload, token) {
    return request(
      '/api/test',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    );
  },

  /**
   * Kullanıcıya ait geçmiş test sonuçlarını getirir.
   * @param {number} [limit=20]
   * @param {string|null} token  Clerk JWT
   */
  getHistory(limit = 20, token) {
    return request(`/api/history?limit=${limit}`, {}, token);
  },
};
