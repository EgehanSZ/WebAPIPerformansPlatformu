// client/src/components/HistoryList.jsx
// MongoDB'den çekilen geçmiş testlerin tablosu.

export default function HistoryList({ items, loading, onRefresh }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Geçmiş Testler</h2>
        <button
          onClick={onRefresh}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
          disabled={loading}
        >
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </button>
      </div>

      {items.length === 0 && !loading && (
        <p className="text-sm text-slate-500">
          Henüz kayıtlı bir test yok. İlk testini başlat!
        </p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-medium">Tarih</th>
                <th className="py-2 pr-4 font-medium">URL</th>
                <th className="py-2 pr-4 font-medium text-right">İstek</th>
                <th className="py-2 pr-4 font-medium text-right">Ort. (ms)</th>
                <th className="py-2 pr-4 font-medium text-right">p95 (ms)</th>
                <th className="py-2 pr-4 font-medium text-right">Başarı</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td
                    className="py-2 pr-4 text-slate-800 max-w-xs truncate"
                    title={item.url}
                  >
                    {item.url}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {item.requestCount}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {item.averageLatency?.toFixed(1)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {item.p95Latency?.toFixed(1)}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <span
                      className={
                        item.successRate >= 95
                          ? 'text-emerald-600 font-medium'
                          : item.successRate >= 75
                            ? 'text-amber-600 font-medium'
                            : 'text-red-600 font-medium'
                      }
                    >
                      {item.successRate?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
