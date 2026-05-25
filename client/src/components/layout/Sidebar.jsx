// client/src/components/layout/Sidebar.jsx
// Slate-900 koyu yan menü — modern SaaS stili.
// Framer Motion ile açılış animasyonu ve aktif menü geçişi.

import { motion } from 'framer-motion';
import { Activity, Zap, Clock, Settings, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'test',     label: 'Yeni Test',       icon: Zap,      badge: null },
  { id: 'history',  label: 'Geçmiş Testler',  icon: Clock,    badge: null },
  { id: 'settings', label: 'Ayarlar',          icon: Settings, badge: null },
];

// Her menü öğesi için Framer Motion varyantları
const itemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.28, ease: 'easeOut' },
  }),
};

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-60 shrink-0 flex flex-col h-full bg-slate-900 border-r border-slate-800 overflow-hidden"
    >
      {/* Logo alanı */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700
                          flex items-center justify-center shadow-lg shadow-brand-900/50">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">API Monitor</p>
            <p className="text-slate-500 text-xs mt-0.5">Performance Platform</p>
          </div>
        </div>
      </div>

      {/* Navigasyon */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Menü
        </p>

        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <motion.button
              key={item.id}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full relative ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>

              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute right-2.5 flex items-center"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Alt bilgi */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] text-slate-500">Sistem çalışıyor</span>
        </div>
        <p className="text-[10px] text-slate-700 mt-1 pl-3.5">v2.0.0 · Vercel + Atlas</p>
      </div>
    </motion.aside>
  );
}
