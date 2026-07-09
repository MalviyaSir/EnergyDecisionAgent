import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react';
import type { DashboardKpi } from '@shared/energy';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

type PremiumKpiCardProps = {
  kpi: DashboardKpi;
  icon: LucideIcon;
  accent: string;
};

export function PremiumKpiCard({ kpi, icon: Icon, accent }: PremiumKpiCardProps) {
  const animatedValue = useCountUp(kpi.value);
  const isCurrency = kpi.unit === '$';
  const isTrailingUnit = kpi.unit !== '$';
  const TrendIcon = kpi.trend.direction === 'up' ? ArrowUpRight : ArrowDownRight;
  const trendClass = kpi.trend.direction === 'up' ? 'text-emerald-300' : 'text-rose-300';

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="premium-card group relative min-h-40 overflow-hidden p-5"
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', accent)} />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-3xl transition group-hover:bg-white/[0.15]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
          <div className={cn('flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold', trendClass)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {kpi.trend.percent}%
          </div>
        </div>
        <div>
          <p className="metric-label">{kpi.label}</p>
          <p className="mt-2 text-3xl font-bold tracking-normal text-white">
            {isCurrency ? '$' : ''}
            {formatNumber(animatedValue, kpi.id === 'currentPowerUsage' ? 1 : 0)}
            {isTrailingUnit ? <span className="ml-1 text-base font-semibold text-slate-300">{kpi.unit}</span> : null}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function formatNumber(value: number, decimals: number) {
  return value.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}
