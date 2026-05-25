// client/src/components/ui/MetricCard.jsx
// Glassmorphism metrik kartı — Framer Motion ile stagger animasyonu.
// Her kart bir ikon, etiket ve büyük değer gösterir.

import { motion } from 'framer-motion';

const ACCENTS = {
  slate: {
    value:   'text-slate-900',
    iconBg:  'bg-slate-100',
    icon:    'text-slate-500',
    border:  'border-slate-200/60',
  },
  green: {
    value:   'text-emerald-600',
    iconBg:  'bg-emerald-50',
    icon:    'text-emerald-500',
    border:  'border-emerald-200/60',
  },
  red: {
    value:   'text-red-500',
    iconBg:  'bg-red-50',
    icon:    'text-red-400',
    border:  'border-red-200/60',
  },
  blue: {
    value:   'text-brand-600',
    iconBg:  'bg-brand-50',
    icon:    'text-brand-500',
    border:  'border-brand-200/60',
  },
  amber: {
    value:   'text-amber-600',
    iconBg:  'bg-amber-50',
    icon:    'text-amber-500',
    border:  'border-amber-200/60',
  },
};

export default function MetricCard({
  label,
  value,
  unit,
  accent = 'slate',
  icon: Icon,
  delay = 0,
  subValue = null,
}) {
  const cfg = ACCENTS[accent] ?? ACCENTS.slate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`glass-card glass-card-hover rounded-2xl p-5 border ${cfg.border}`}
    >
      {/* Üst satır */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        {Icon && (
          <div className={`w-7 h-7 ${cfg.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${cfg.icon}`} />
          </div>
        )}
      </div>

      {/* Değer */}
      <div className="flex items-baseline gap-1">
        <span className={`text-[26px] font-bold leading-none ${cfg.value}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-400">{unit}</span>
        )}
      </div>

      {/* Alt açıklama */}
      {subValue && (
        <p className="mt-1.5 text-[11px] text-slate-400">{subValue}</p>
      )}
    </motion.div>
  );
}
