// client/src/components/Dashboard.jsx
// Bir test sonucunu metrikler + grafikle gösterir.
// Recharts ile her isteğin latency dağılımını çizgi grafik olarak çizer.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

function MetricCard({ label, value, unit, accent = 'slate' }) {
  const accentMap = {
    slate: 'text-slate-900',
    green: 'text-emerald-600',
    red: 'text-red-600',
    blue: 'text-brand-600',
  };
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${accentMap[accent]}`}>
        {value}
        {unit && <span className="ml-1 text-base text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

export default function Dashboard({ result }) {
  if (!result) return null;

  const successColor =
    result.successRate >= 95
      ? 'green'
      : result.successRate >= 75
        ? 'blue'
        : 'red';

  // Recharts için sample dizisini hazırlıyoruz.
  const chartData = (result.samples || []).map((s) => ({
    name: `#${s.index + 1}`,
    latency: s.latencyMs,
    ok: s.ok,
  }));

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Test Sonucu
          </h2>
          <span className="text-xs text-slate-500">
            {new Date(result.createdAt || Date.now()).toLocaleString('tr-TR')}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 break-all">
          <span className="font-medium">{result.method}</span> · {result.url}
        </p>
        <p className="text-xs text-slate-500">
          {result.requestCount} istek · concurrency {result.concurrency} ·
          toplam süre {(result.totalDurationMs / 1000).toFixed(2)} sn
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Ortalama Yanıt"
          value={result.averageLatency.toFixed(1)}
          unit="ms"
          accent="blue"
        />
        <MetricCard
          label="Min Yanıt"
          value={result.minLatency.toFixed(1)}
          unit="ms"
          accent="green"
        />
        <MetricCard
          label="Max Yanıt"
          value={result.maxLatency.toFixed(1)}
          unit="ms"
          accent="red"
        />
        <MetricCard
          label="p95 Yanıt"
          value={result.p95Latency.toFixed(1)}
          unit="ms"
        />
        <MetricCard
          label="Başarı Oranı"
          value={result.successRate.toFixed(1)}
          unit="%"
          accent={successColor}
        />
        <MetricCard
          label="Başarılı"
          value={result.successCount}
          accent="green"
        />
        <MetricCard
          label="Hatalı"
          value={result.errorCount}
          accent={result.errorCount > 0 ? 'red' : 'slate'}
        />
        <MetricCard
          label="Toplam"
          value={result.requestCount}
        />
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-medium text-slate-700">
            İstek Bazında Yanıt Süresi (ilk {chartData.length} örnek)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  label={{
                    value: 'ms',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 12,
                    fill: '#64748b',
                  }}
                />
                <Tooltip
                  formatter={(v) => [`${v.toFixed(2)} ms`, 'Latency']}
                  labelStyle={{ color: '#0f172a' }}
                />
                <ReferenceLine
                  y={result.averageLatency}
                  stroke="#2563eb"
                  strokeDasharray="4 4"
                  label={{
                    value: `ort ${result.averageLatency.toFixed(0)}ms`,
                    fill: '#2563eb',
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
