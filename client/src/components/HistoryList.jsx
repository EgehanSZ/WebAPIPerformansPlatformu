// client/src/components/HistoryList.jsx
// Glassmorphism kart içinde animasyonlu geçmiş test tablosu.
// Başarı oranına göre renkli badge'ler ve satır hover efekti.

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, ExternalLink, Inbox } from 'lucide-react';

function SuccessBadge({ rate }) {
  const cfg =
    rate >= 95 ? { cls: 'bg-emerald-100 text-emerald-700', label: 'Başarılı' } :
    rate >= 75 ? { cls: 'bg-amber-100  text-amber-700',   label: 'Kısmi'    } :
                 { cls: 'bg-red-100    text-red-600',     label: 'Hatalı'   };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
      <span className="font-bold">{rate?.toFixed(1)}%</span>
    </span>
  );
}

const rowVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: 'easeOut' },
  }),
};

export default function HistoryList({ items, loading, onRefresh }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card rounded-2xl border border-white/60 overflow-hidden"
    >
      {/* Başlık */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800">Geçmiş Testler</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-ghost !py-1.5 !px-3 !text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </button>
      </div>

      {/* Boş durum */}
      {items.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Henüz test yok</p>
          <p className="text-xs text-slate-400 mt-1">İlk testini başlatarak geçmiş oluştur.</p>
        </div>
      )}

      {/* Tablo */}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                {['Tarih', 'URL', 'Metot', 'İstek', 'Ort. (ms)', 'P95 (ms)', 'Başarı'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.tr
                    key={item._id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-b border-slate-100/70 hover:bg-white/70 transition-colors group"
                  >
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 truncate text-xs" title={item.url}>
                          {item.url}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-400 hover:text-brand-500" />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {item.method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 tabular-nums font-medium">
                      {item.requestCount}
                    </td>
                    <td className="px-5 py-3.5 text-xs tabular-nums font-semibold text-slate-700">
                      {item.averageLatency?.toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5 text-xs tabular-nums text-slate-500">
                      {item.p95Latency?.toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5">
                      <SuccessBadge rate={item.successRate} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
