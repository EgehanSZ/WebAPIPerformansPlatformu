// client/src/components/Dashboard.jsx
// Premium test sonuç dashboard'u.
// • Recharts AreaChart — degrade dolgu + kavisli çizgi + özel tooltip
// • MetricCard bileşeni — stagger animasyonlu glassmorphism kartlar
// • PDF (html2canvas + jsPDF) ve CSV (native Blob) dışa aktarma
// • Framer Motion ile tüm bölümlerin slide-up girişi

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Timer, TrendingDown, TrendingUp, BarChart2,
  CheckCircle2, XCircle, Layers, FileDown, FileText,
  Zap,
} from 'lucide-react';
import MetricCard from './ui/MetricCard.jsx';

// ── Özel Recharts Tooltip ──────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3.5 py-2.5 text-xs shadow-xl border border-white/70">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      <p className="font-bold text-brand-600 text-sm">
        {payload[0].value.toFixed(2)}
        <span className="ml-1 font-normal text-slate-400">ms</span>
      </p>
      <p className={`mt-0.5 font-medium ${payload[0].payload.ok ? 'text-emerald-500' : 'text-red-500'}`}>
        {payload[0].payload.ok ? '✓ Başarılı' : '✗ Hata'}
      </p>
    </div>
  );
}

// ── Dışa aktarma yardımcıları ──────────────────────────────────────
function buildCsv(result) {
  const q = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ['Alan', 'Değer'],
    ['URL', q(result.url)],
    ['HTTP Metodu', result.method],
    ['Test Tarihi', new Date(result.createdAt || Date.now()).toLocaleString('tr-TR')],
    ['Toplam İstek', result.requestCount],
    ['Concurrency', result.concurrency],
    ['Toplam Süre (ms)', result.totalDurationMs],
    [],
    ['Metrik', 'ms'],
    ['Ortalama', result.averageLatency],
    ['Min', result.minLatency],
    ['Max', result.maxLatency],
    ['P95', result.p95Latency],
    [],
    ['Başarılı', result.successCount],
    ['Hatalı', result.errorCount],
    ['Başarı Oranı (%)', result.successRate],
  ];
  if (result.samples?.length) {
    rows.push([], ['#', 'Latency (ms)', 'HTTP Status', 'Başarılı', 'Hata']);
    result.samples.forEach((s) =>
      rows.push([s.index + 1, s.latencyMs, s.status || 0, s.ok ? 'Evet' : 'Hayır', s.error || ''])
    );
  }
  return rows.map((r) => r.join(',')).join('\r\n');
}

function downloadCsv(result) {
  const blob = new Blob(['﻿' + buildCsv(result)], { type: 'text/csv;charset=utf-8;' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `api-test-${Date.now()}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function downloadPdf(ref) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;
  const ph = pdf.internal.pageSize.getHeight();
  let y = 0;
  while (y < h) {
    if (y > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, w, h);
    y += ph;
  }
  pdf.save(`api-test-${Date.now()}.pdf`);
}

// ── Ana bileşen ────────────────────────────────────────────────────
export default function Dashboard({ result }) {
  const exportRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!result) return null;

  const successColor =
    result.successRate >= 95 ? 'green' :
    result.successRate >= 75 ? 'blue' : 'red';

  const chartData = (result.samples || []).map((s) => ({
    name: `#${s.index + 1}`,
    latency: s.latencyMs,
    ok: s.ok,
  }));

  const handlePdf = async () => {
    setPdfLoading(true);
    try { await downloadPdf(exportRef); }
    finally { setPdfLoading(false); }
  };

  // Stagger animasyonu için container + item varyantları
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };

  return (
    <div className="space-y-5">
      {/* Dışa aktarma butonları (PDF kapsamı dışında) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-end gap-2"
      >
        <button
          onClick={() => downloadCsv(result)}
          className="btn-ghost text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          <FileText className="w-3.5 h-3.5" />
          CSV İndir
        </button>
        <button
          onClick={handlePdf}
          disabled={pdfLoading}
          className="btn-ghost text-brand-600 border-brand-200 hover:bg-brand-50 disabled:opacity-50"
        >
          {pdfLoading
            ? <span className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            : <FileDown className="w-3.5 h-3.5" />
          }
          PDF İndir
        </button>
      </motion.div>

      {/* PDF kapsamındaki alan */}
      <div ref={exportRef} className="space-y-5">

        {/* Üst bilgi kartı */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 border border-white/60"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Test Sonucu</h2>
              </div>
              <p className="text-sm text-slate-600 break-all">
                <span className="font-semibold text-brand-600">{result.method}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                {result.url}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {result.requestCount} istek · concurrency {result.concurrency} ·
                toplam {(result.totalDurationMs / 1000).toFixed(2)} sn
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">
                {new Date(result.createdAt || Date.now()).toLocaleString('tr-TR')}
              </p>
              <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold
                              px-2.5 py-1 rounded-full ${
                result.successRate >= 95
                  ? 'bg-emerald-100 text-emerald-700'
                  : result.successRate >= 75
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {result.successRate.toFixed(1)}% Başarı
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrik kartlar — stagger */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3.5"
        >
          <MetricCard label="Ortalama Yanıt" value={result.averageLatency.toFixed(1)} unit="ms" accent="blue"  icon={Timer}        delay={0.05} />
          <MetricCard label="Min Yanıt"       value={result.minLatency.toFixed(1)}     unit="ms" accent="green" icon={TrendingDown}  delay={0.10} />
          <MetricCard label="Max Yanıt"       value={result.maxLatency.toFixed(1)}     unit="ms" accent="red"   icon={TrendingUp}   delay={0.15} />
          <MetricCard label="P95 Yanıt"       value={result.p95Latency.toFixed(1)}     unit="ms" accent="amber" icon={BarChart2}     delay={0.20} />
          <MetricCard label="Başarı Oranı"    value={result.successRate.toFixed(1)}    unit="%"  accent={successColor} icon={CheckCircle2} delay={0.25} />
          <MetricCard label="Başarılı İstek"  value={result.successCount}              accent="green" icon={CheckCircle2}  delay={0.30} />
          <MetricCard label="Hatalı İstek"    value={result.errorCount}                accent={result.errorCount > 0 ? 'red' : 'slate'} icon={XCircle} delay={0.35} />
          <MetricCard label="Toplam İstek"    value={result.requestCount}              accent="slate" icon={Layers}        delay={0.40} />
        </motion.div>

        {/* Alan grafik */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="glass-card rounded-2xl p-5 border border-white/60"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">
                İstek Bazında Yanıt Süresi
              </h3>
              <span className="text-xs text-slate-400">
                İlk {chartData.length} örnek gösteriliyor
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    {/* Degrade dolgu */}
                    <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="90%"  stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }}
                  />
                  {/* Ortalama referans çizgisi */}
                  <ReferenceLine
                    y={result.averageLatency}
                    stroke="#6366f1"
                    strokeDasharray="5 3"
                    strokeWidth={1.5}
                    label={{
                      value: `ort. ${result.averageLatency.toFixed(0)}ms`,
                      fill: '#6366f1',
                      fontSize: 10,
                      fontWeight: 600,
                      position: 'insideTopRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#latencyFill)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
