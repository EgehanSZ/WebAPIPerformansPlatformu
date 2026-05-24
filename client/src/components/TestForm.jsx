// client/src/components/TestForm.jsx
// Kullanıcının URL ve istek sayısını girip test başlattığı form.

import { useState } from 'react';

export default function TestForm({ onSubmit, isRunning }) {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [requestCount, setRequestCount] = useState(50);
  const [method, setMethod] = useState('GET');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Basit istemci tarafı validasyon — backend yine de doğrulayacak.
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) {
        throw new Error('URL http(s) ile başlamalı.');
      }
    } catch {
      setError('Lütfen geçerli bir URL girin (örn. https://example.com).');
      return;
    }
    const count = Number(requestCount);
    if (!Number.isInteger(count) || count < 1 || count > 200) {
      setError('İstek sayısı 1 ile 200 arasında bir tam sayı olmalıdır.');
      return;
    }

    onSubmit({ url, requestCount: count, method });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Yeni Test</h2>
        <p className="text-sm text-slate-500">
          Bir API uç noktasına seri istek göndererek performansını ölç.
        </p>
      </div>

      <div>
        <label htmlFor="url" className="label">Test Edilecek API URL'si</label>
        <input
          id="url"
          type="url"
          className="input"
          placeholder="https://api.example.com/endpoint"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isRunning}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="count" className="label">İstek Sayısı (1–200)</label>
          <input
            id="count"
            type="number"
            min="1"
            max="200"
            className="input"
            value={requestCount}
            onChange={(e) => setRequestCount(e.target.value)}
            disabled={isRunning}
            required
          />
        </div>
        <div>
          <label htmlFor="method" className="label">HTTP Metodu</label>
          <select
            id="method"
            className="input"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={isRunning}
          >
            <option value="GET">GET</option>
            <option value="HEAD">HEAD</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={isRunning}>
        {isRunning ? 'Test çalışıyor…' : 'Testi Başlat'}
      </button>
    </form>
  );
}
