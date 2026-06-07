// client/src/App.jsx
// Uygulama giriş noktası:
// • Oturum yoksa → tam ekran sign-in sayfası (sidebar gizli)
// • Oturum varsa  → sidebar + navbar + görünüm yönlendirmesi
// • Sonner toast ile başarı/hata bildirimleri

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClerkProvider, SignedIn, SignedOut,
  SignInButton, useAuth,
} from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Activity, ArrowRight } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

import Layout        from './components/layout/Layout.jsx';
import TestForm      from './components/TestForm.jsx';
import Dashboard     from './components/Dashboard.jsx';
import HistoryList   from './components/HistoryList.jsx';
import SkeletonDashboard from './components/ui/SkeletonDashboard.jsx';
import { api }       from './services/api.js';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// ── Ayarlar görünümü (placeholder) ────────────────────────────────
function SettingsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-8 border border-white/60 text-center max-w-md mx-auto mt-12"
    >
      <p className="text-2xl mb-2">⚙️</p>
      <h2 className="text-base font-bold text-slate-800">Ayarlar</h2>
      <p className="text-sm text-slate-500 mt-1">
        Bu bölüm yakında kullanıma açılacak.
      </p>
    </motion.div>
  );
}

// ── Tam ekran giriş sayfası (oturum açmamış) ──────────────────────
function SignInPage() {
  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700
                          flex items-center justify-center shadow-2xl shadow-brand-900/30">
            <Activity className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Kart */}
        <div className="glass-card rounded-3xl p-8 border border-white/60 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">API Monitor</h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Web API performans test platformuna hoş geldin.
            </p>
          </div>

          {/* Özellikler */}
          <div className="text-left space-y-2.5">
            {[
              '🚀 Saniyeler içinde performans testleri',
              '📊 Gerçek zamanlı latency grafikleri',
              '📄 PDF ve CSV rapor dışa aktarma',
              '🔒 Kişisel test geçmişi ve güvenli oturum',
            ].map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Giriş butonu */}
          <SignInButton mode="modal">
            <button className="btn-primary w-full py-3 text-base justify-center">
              Başlamak için Giriş Yap
              <ArrowRight className="w-4 h-4" />
            </button>
          </SignInButton>

          <p className="text-xs text-slate-400">
            Ücretsiz hesap oluşturabilirsiniz. Kredi kartı gerekmez.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Oturum açık — asıl uygulama içeriği ──────────────────────────
function AppContent() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const [activeView,    setActiveView]    = useState('test');
  const [isRunning,     setIsRunning]     = useState(false);
  const [result,        setResult]        = useState(null);
  const [history,       setHistory]       = useState([]);
  const [historyLoading,setHistoryLoading]= useState(false);

  const loadHistory = useCallback(async () => {
    if (!isSignedIn) { setHistory([]); return; }
    setHistoryLoading(true);
    try {
      const token = await getToken();
      const data  = await api.getHistory(20, token);
      setHistory(data.items || []);
    } catch (err) {
      toast.error('Geçmiş yüklenemedi: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) loadHistory();
  }, [isLoaded, loadHistory]);

  const handleRunTest = async (payload) => {
    setIsRunning(true);
    setResult(null);
    const toastId = toast.loading('Test çalışıyor…');
    try {
      const token = await getToken();
      const data  = await api.runTest(payload, token);
      setResult(data);
      setActiveView('test');
      toast.success(
        `Test tamamlandı — %${data.successRate.toFixed(1)} başarı, ort. ${data.averageLatency.toFixed(0)}ms`,
        { id: toastId, duration: 5000 }
      );
      loadHistory();
    } catch (err) {
      toast.error('Test başarısız: ' + err.message, { id: toastId });
    } finally {
      setIsRunning(false);
    }
  };

  // Clerk yüklenene kadar boş ekran
  if (!isLoaded) return null;

  return (
    <>
      {/* Oturum açmamış → tam ekran sign-in */}
      <SignedOut>
        <SignInPage />
      </SignedOut>

      {/* Oturum açık → tam uygulama */}
      <SignedIn>
        <Layout activeView={activeView} onNavigate={setActiveView}>
          <AnimatePresence mode="wait">
            {activeView === 'test' && (
              <motion.div key="test" className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
                {/* Sol: form */}
                <div className="lg:col-span-1">
                  <TestForm onSubmit={handleRunTest} isRunning={isRunning} />
                </div>

                {/* Sağ: sonuç / skeleton / boş durum */}
                <div className="lg:col-span-2">
                  {isRunning && <SkeletonDashboard />}

                  {!isRunning && result && <Dashboard result={result} />}

                  {!isRunning && !result && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass-card rounded-2xl border border-white/60 flex flex-col
                                 items-center justify-center py-20 text-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center
                                      justify-center mb-4 shadow-inner">
                        <Activity className="w-7 h-7 text-brand-400" />
                      </div>
                      <p className="font-semibold text-slate-700">
                        Test sonuçları burada görünecek
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Sol formu doldur ve testi başlat.
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === 'history' && (
              <motion.div key="history">
                <HistoryList
                  items={history}
                  loading={historyLoading}
                  onRefresh={loadHistory}
                />
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div key="settings">
                <SettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </Layout>
      </SignedIn>
    </>
  );
}

// ── Kök bileşen ────────────────────────────────────────────────────
export default function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm border border-red-200">
          <p className="text-red-600 font-semibold">Yapılandırma Hatası</p>
          <p className="text-sm text-slate-500 mt-1">
            <code>VITE_CLERK_PUBLISHABLE_KEY</code> ortam değişkeni eksik.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AppContent />
      <Analytics />
    </ClerkProvider>
  );
}
