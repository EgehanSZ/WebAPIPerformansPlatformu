// client/src/App.jsx
// Üst seviye bileşen — form, loader, dashboard ve history'yi birleştirir.

import { useCallback, useEffect, useState } from 'react';
import TestForm from './components/TestForm.jsx';
import Loader from './components/Loader.jsx';
import Dashboard from './components/Dashboard.jsx';
import HistoryList from './components/HistoryList.jsx';
import { api } from './services/api.js';

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getHistory(20);
      setHistory(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRunTest = async (payload) => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.runTest(payload);
      setResult(data);
      // Yeni test geldi — geçmiş listesini de tazele.
      loadHistory();
    } catch (err) {
      setError(err.message || 'Beklenmedik bir hata oluştu.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-xl font-semibold text-slate-900">
            Web API Performans Test Platformu
          </h1>
          <p className="text-sm text-slate-500">
            Bulut tabanlı (Vercel + MongoDB Atlas) API performans analizi
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TestForm onSubmit={handleRunTest} isRunning={isRunning} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {isRunning && <Loader />}

            {error && !isRunning && (
              <div className="card border-red-200 bg-red-50">
                <h3 className="font-medium text-red-800">Test başarısız</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            )}

            {result && !isRunning && <Dashboard result={result} />}

            {!isRunning && !result && !error && (
              <div className="card text-center text-slate-500">
                <p className="font-medium text-slate-700">
                  Sonuçları burada göreceksin
                </p>
                <p className="mt-1 text-sm">
                  Sol formdan bir URL gir ve testi başlat.
                </p>
              </div>
            )}
          </div>
        </div>

        <HistoryList
          items={history}
          loading={historyLoading}
          onRefresh={loadHistory}
        />

        <footer className="pt-4 pb-8 text-center text-xs text-slate-400">
          Vercel · MongoDB Atlas · React · Tailwind · Recharts
        </footer>
      </main>
    </div>
  );
}
