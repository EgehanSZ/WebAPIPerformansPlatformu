// client/src/components/Dashboard.jsx
// Bir test sonucunu metrikler + Recharts grafiği + dışa aktarma butonlarıyla gösterir.
//
// PDF: html2canvas ile ekran görüntüsü → jsPDF ile A4 yatay PDF
// CSV: native Blob API ile hem özet metrikleri hem de istek örneklerini içerir

import { useRef, useState } from 'react';
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

// ---- Yardımcı bileşenler ----

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

function ExportButton({ onClick, loading, icon, label, colorClass }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium
        transition disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <span>{icon}</span>
      )}
      {label}
    </button>
  );
}

// ---- CSV dışa aktarma ----

function buildCsv(result) {
  const escape = (v) => {
    const str = String(v ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows = [
    // Üst bilgi
    ['Alan', 'Değer'],
    ['URL', escape(result.url)],
    ['HTTP Metodu', result.method],
    ['Test Tarihi', new Date(result.createdAt || Date.now()).toLocaleString('tr-TR')],
    ['Toplam İstek', result.requestCount],
    ['Eşzamanlılık (Concurrency)', result.concurrency],
    ['Toplam Süre (ms)', result.totalDurationMs],
    [],
    // Metrikler
    ['Metrik', 'Değer (ms)'],
    ['Ortalama Yanıt Süresi', result.averageLatency],
    ['Min Yanıt Süresi', result.minLatency],
    ['Max Yanıt Süresi', result.maxLatency],
    ['P95 Yanıt Süresi', result.p95Latency],
    [],
    ['Başarılı İstek', result.successCount],
    ['Hatalı İstek', result.errorCount],
    ['Başarı Oranı (%)', result.successRate],
  ];

  // Örnekler varsa ekle
  if (result.samples?.length) {
    rows.push([]);
    rows.push(['#', 'Latency (ms)', 'HTTP Status', 'Başarılı', 'Hata']);
    result.samples.forEach((s) => {
      rows.push([
        s.index + 1,
        s.latencyMs,
        s.status || 0,
        s.ok ? 'Evet' : 'Hayır',
        s.error || '',
      ]);
    });
  }

  return rows.map((r) => r.join(',')).join('\r\n');
}

function downloadCsv(result) {
  const csv = buildCsv(result);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-test-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- PDF dışa aktarma ----

async function downloadPdf(exportRef) {
  // Dinamik import: PDF çıktısı istendiğinde yükle (bundle boyutunu küçültür).
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const element = exportRef.current;
  const canvas = await html2canvas(element, {
    scale: 2,           // Retina kalitesi için 2x
    useCORS: true,
    backgroundColor: '#f8fafc', // slate-50
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Sayfa yüksekliğini aşıyorsa birden fazla sayfaya böl.
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = 0;

  while (yPos < pdfHeight) {
    if (yPos > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -yPos, pdfWidth, pdfHeight);
    yPos += pageHeight;
  }

  pdf.save(`api-test-${Date.now()}.pdf`);
}

// ---- Ana bileşen ----

export default function Dashboard({ result }) {
  const exportRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!result) return null;

  const successColor =
    result.successRate >= 95
      ? 'green'
      : result.successRate >= 75
        ? 'blue'
        : 'red';

  const chartData = (result.samples || []).map((s) => ({
    name: `#${s.index + 1}`,
    latency: s.latencyMs,
    ok: s.ok,
  }));

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadPdf(exportRef);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dışa aktarma butonları — exportRef dışında, PDF'e dahil olmaz */}
      <div className="flex items-center justify-end gap-2">
        <ExportButton
          onClick={() => downloadCsv(result)}
          loading={false}
          icon="⬇"
          label="CSV İndir"
          colorClass="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        />
        <ExportButton
          onClick={handlePdf}
          loading={pdfLoading}
          icon="📄"
          label="PDF İndir"
          colorClass="border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
        />
      </div>

      {/* exportRef: pdf'e dahil olan bölüm */}
      <div ref={exportRef} className="space-y-6">
        {/* Üst bilgi kartı */}
        <div className="card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Test Sonucu</h2>
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

        {/* Metrik kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Ortalama Yanıt" value={result.averageLatency.toFixed(1)} unit="ms" accent="blue" />
          <MetricCard label="Min Yanıt" value={result.minLatency.toFixed(1)} unit="ms" accent="green" />
          <MetricCard label="Max Yanıt" value={result.maxLatency.toFixed(1)} unit="ms" accent="red" />
          <MetricCard label="p95 Yanıt" value={result.p95Latency.toFixed(1)} unit="ms" />
          <MetricCard label="Başarı Oranı" value={result.successRate.toFixed(1)} unit="%" accent={successColor} />
          <MetricCard label="Başarılı" value={result.successCount} accent="green" />
          <MetricCard label="Hatalı" value={result.errorCount} accent={result.errorCount > 0 ? 'red' : 'slate'} />
          <MetricCard label="Toplam" value={result.requestCount} />
        </div>

        {/* Recharts grafiği */}
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
                    label={{ value: 'ms', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip
                    formatter={(v) => [`${v.toFixed(2)} ms`, 'Latency']}
                    labelStyle={{ color: '#0f172a' }}
                  />
                  <ReferenceLine
                    y={result.averageLatency}
                    stroke="#2563eb"
                    strokeDasharray="4 4"
                    label={{ value: `ort ${result.averageLatency.toFixed(0)}ms`, fill: '#2563eb', fontSize: 11 }}
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
    </div>
  );
}
