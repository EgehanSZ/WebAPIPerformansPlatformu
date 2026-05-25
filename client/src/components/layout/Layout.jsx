// client/src/components/layout/Layout.jsx
// Ana çerçeve: koyu sidebar + glassmorphism navbar + degrade içerik alanı.
// AnimatePresence ile görünüm değişimlerinde pürüzsüz geçiş animasyonu sağlar.

import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

export default function Layout({ children, activeView, onNavigate }) {
  return (
    <div className="flex h-screen overflow-hidden bg-app-gradient">
      {/* Koyu sol sidebar */}
      <Sidebar activeView={activeView} onNavigate={onNavigate} />

      {/* Sağ alan — navbar + içerik */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar activeView={activeView} />

        <main className="flex-1 overflow-y-auto">
          {/* Görünüm değişiminde fade + slide animasyonu */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="min-h-full p-6 lg:p-8 max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
