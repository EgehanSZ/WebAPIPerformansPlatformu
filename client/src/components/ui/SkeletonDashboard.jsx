// client/src/components/ui/SkeletonDashboard.jsx
// Test çalışırken gösterilen shimmer skeleton yükleme ekranı.
// Gerçek dashboard düzeniyle birebir örtüşen kart yapısı.

function Skel({ className }) {
  return <div className={`skeleton ${className}`} />;
}

function SkeletonMetricCard() {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-200/60">
      <div className="flex items-start justify-between mb-3">
        <Skel className="h-2.5 w-20 rounded-full" />
        <Skel className="h-7 w-7 rounded-lg" />
      </div>
      <Skel className="h-8 w-24 rounded-lg mt-1" />
      <Skel className="h-2 w-16 rounded-full mt-2" />
    </div>
  );
}

export default function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Başlık kartı */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200/60">
        <div className="flex items-center justify-between mb-2">
          <Skel className="h-5 w-32 rounded-lg" />
          <Skel className="h-3 w-24 rounded-full" />
        </div>
        <Skel className="h-3 w-80 rounded-full" />
        <Skel className="h-2.5 w-56 rounded-full mt-1.5" />
      </div>

      {/* 8 metrik kartı */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      {/* Grafik alanı */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200/60">
        <Skel className="h-4 w-64 rounded-lg mb-5" />
        <Skel className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
