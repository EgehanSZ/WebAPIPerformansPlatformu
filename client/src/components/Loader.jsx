// client/src/components/Loader.jsx
// Test çalışırken gösterilen basit spinner + mesaj bileşeni.

export default function Loader({ label = 'Test çalışıyor…' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">
          Hedef sunucuya istekler atılıyor. Süre, istek sayısı ve yanıt
          gecikmesine bağlı olarak değişir.
        </p>
      </div>
    </div>
  );
}
