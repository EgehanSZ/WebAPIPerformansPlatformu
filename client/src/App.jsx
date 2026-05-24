// client/src/App.jsx
// Dış sarmalayıcı ClerkProvider'ı koyar; iç AppContent ise
// useAuth hook'uyla JWT alarak API çağrıları yapar.
// İki bileşene ayrılmasının nedeni: useAuth, ClerkProvider içinde
// çalışmak zorundadır.

import { useCallback, useEffect, useState } from 'react';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from '@clerk/clerk-react';

import TestForm from './components/TestForm.jsx';
import Loader from './components/Loader.jsx';
import Dashboard from './components/Dashboard.jsx';
import HistoryList from './components/HistoryList.jsx';
import { api } from './services/api.js';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// ----------------------------------------------------------------
// İç bileşen — ClerkProvider içinde çalışır, useAuth erişebilir.
// ----------------------------------------------------------------
function AppContent() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isSignedIn) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const token = await getToken();
      const data = await api.getHistory(20, token);
      setHistory(data.items || []);
    } catch (err) {
      console.error('Geçmiş yüklenirken hata:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [isSignedIn, getToken]);

  // Kullanıcı oturum açtığında/kapattığında geçmişi yenile.
  useEffect(() => {
    if (isLoaded) loadHistory();
  }, [isLoaded, loadHistory]);

  const handleRunTest = async (payload) => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      const data = await api.runTest(payload, token);
      setResult(data);
      loadHistory();
    } catch (err) {
      setError(err.message || 'Beklenmedik bir hata oluştu.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ---- Header ---- */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Web API Performans Test Platformu
            </h1>
            <p className="text-sm text-slate-500">
              Bulut tabanlı (Vercel + MongoDB Atlas) API performans analizi
            </p>
          </div>

          {/* Clerk auth bileşenleri */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-primary text-sm px-4 py-2">
                  Giriş Yap
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-9 w-9',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* ---- Ana içerik ---- */}
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Oturum açmamış kullanıcı bildirimi */}
        <SignedOut>
          <div className="card text-center py-12">
            <p className="text-lg font-medium text-slate-700">
              Test platformuna erişmek için giriş yap
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Testlerin kaydedilmesi ve geçmiş görüntüleme için hesap gerekli.
            </p>
            <SignInButton mode="modal">
              <button className="btn-primary mt-4">Giriş Yap / Kayıt Ol</button>
            </SignInButton>
          </div>
        </SignedOut>

        {/* Oturum açmış kullanıcı içeriği */}
        <SignedIn>
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
        </SignedIn>

        <footer className="pt-4 pb-8 text-center text-xs text-slate-400">
          Vercel · MongoDB Atlas · React · Clerk · Tailwind · Recharts
        </footer>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------
// Dış bileşen — ClerkProvider'ı sağlar.
// ----------------------------------------------------------------
export default function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600 font-medium">
          VITE_CLERK_PUBLISHABLE_KEY ortam değişkeni tanımlı değil.
          <br />
          <code className="text-sm">client/.env.local</code> dosyasını
          kontrol et.
        </p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AppContent />
    </ClerkProvider>
  );
}
