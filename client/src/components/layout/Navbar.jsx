// client/src/components/layout/Navbar.jsx
// Glassmorphism üst navbar — Clerk UserButton + breadcrumb + ikon düğmeler.

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Bell, HelpCircle } from 'lucide-react';

const VIEW_LABELS = {
  test:     'Yeni Test',
  history:  'Geçmiş Testler',
  settings: 'Ayarlar',
};

export default function Navbar({ activeView }) {
  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-6
                 border-b border-white/50 bg-white/60 backdrop-blur-xl z-10"
    >
      {/* Sol — breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium">Platform</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">
          {VIEW_LABELS[activeView] || activeView}
        </span>
      </div>

      {/* Sağ — araçlar + kullanıcı */}
      <div className="flex items-center gap-1.5">
        {/* Bildirim */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-slate-400 hover:text-slate-700 hover:bg-slate-100/80
                     transition-colors"
          title="Bildirimler"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Yardım */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-slate-400 hover:text-slate-700 hover:bg-slate-100/80
                     transition-colors"
          title="Yardım"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Auth */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn-primary !py-1.5 !px-3.5 !text-xs">
              Giriş Yap
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8 ring-2 ring-brand-200',
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}
