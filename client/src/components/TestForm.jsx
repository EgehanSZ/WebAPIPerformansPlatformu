// client/src/components/TestForm.jsx
// Premium SaaS tarzı test formu.
// Framer Motion ile kart açılış animasyonu, focus-ring inputlar, ikon süslemeleri.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Hash, ArrowRight, Loader2, Info } from 'lucide-react';

// İzin verilen metot seçenekleri
const METHODS = ['GET', 'HEAD'];

// Preset URL'ler — hızlı test için
const PRESETS = [
  { label: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1' },
  { label: 'HTTPBin', url: 'https://httpbin.org/get' },
];

export default function TestForm({ onSubmit, isRunning }) {
  const [url,          setUrl]          = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [requestCount, setRequestCount] = useState(50);
  const [method,       setMethod]       = useState('GET');
  const [error,        setError]        = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
    } catch {
      setError('Geçerli bir HTTP/HTTPS URL girin.');
      return;
    }

    const count = Number(requestCount);
    if (!Number.isInteger(count) || count < 1 || count > 200) {
      setError('İstek sayısı 1 ile 200 arasında olmalıdır.');
      return;
    }

    onSubmit({ url, requestCount: count, method });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="glass-card rounded-2xl p-6 border border-white/60 space-y-5"
    >
      {/* Başlık */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Yeni Test Başlat</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Hedef API'ye seri istek göndererek performansını ölç.
        </p>
      </div>

      {/* URL alanı */}
      <div>
        <label htmlFor="url" className="field-label">API Endpoint URL</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
            <Link2 className="w-4 h-4 text-slate-400" />
          </div>
          <input
            id="url"
            type="url"
            className="input-field pl-10"
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isRunning}
            required
          />
        </div>

        {/* Preset kısayolları */}
        <div className="flex gap-1.5 mt-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setUrl(p.url)}
              disabled={isRunning}
              className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200
                         text-slate-500 hover:text-brand-600 hover:border-brand-300
                         bg-white/60 hover:bg-brand-50 transition-all disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* İstek sayısı + metot */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="count" className="field-label">
            <span className="flex items-center gap-1">
              İstek Sayısı
              <span title="Maks. 200" className="cursor-help">
                <Info className="w-3 h-3 text-slate-400" />
              </span>
            </span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <input
              id="count"
              type="number"
              min="1"
              max="200"
              className="input-field pl-9"
              value={requestCount}
              onChange={(e) => setRequestCount(e.target.value)}
              disabled={isRunning}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="method" className="field-label">HTTP Metodu</label>
          <select
            id="method"
            className="input-field cursor-pointer"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={isRunning}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hız göstergesi */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className={`w-1 rounded-full transition-all duration-300 ${
                requestCount >= bar * 40
                  ? 'bg-brand-500 h-4'
                  : 'bg-slate-200 h-2'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {requestCount <= 20  ? 'Hafif test' :
           requestCount <= 80  ? 'Orta yük' :
           requestCount <= 150 ? 'Yüksek yük' : 'Stres testi'}
          <span className="text-slate-400"> · {requestCount} istek</span>
        </p>
      </div>

      {/* Hata */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl border border-red-200
                     bg-red-50/80 px-3.5 py-2.5 text-sm text-red-700"
        >
          <span className="mt-0.5 shrink-0">⚠</span>
          {error}
        </motion.div>
      )}

      {/* Gönder butonu */}
      <button
        type="submit"
        disabled={isRunning}
        className="btn-primary w-full py-3"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Test çalışıyor…
          </>
        ) : (
          <>
            Test Başlat
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </motion.form>
  );
}
