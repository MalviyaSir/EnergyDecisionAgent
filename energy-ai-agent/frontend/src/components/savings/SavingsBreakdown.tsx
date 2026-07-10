import { motion } from 'framer-motion';
import type { RecommendationSavings, RoiCategory } from '@shared/energy';
import { cn } from '@/lib/utils';

type SavingsBreakdownProps = {
  items: RecommendationSavings[];
};

const roiStyles: Record<RoiCategory, string> = {
  Excellent: 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/30',
  'Very Good': 'bg-teal-400/20 text-teal-100 ring-teal-300/30',
  Good: 'bg-sky-400/20 text-sky-100 ring-sky-300/30',
  Moderate: 'bg-amber-400/20 text-amber-100 ring-amber-300/30',
  Low: 'bg-rose-400/20 text-rose-100 ring-rose-300/30',
};

export function SavingsBreakdown({ items }: SavingsBreakdownProps) {
  return (
    <section className="grid gap-3">
      <div>
        <p className="metric-label">Savings Breakdown</p>
        <h2 className="mt-1 text-lg font-bold text-white">Recommendation Impact</h2>
      </div>
      {items.map((item, index) => (
        <motion.article
          key={item.recommendationId}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.3 }}
          className="premium-card p-4"
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_7rem_7rem_7rem_7rem_8rem] xl:items-center">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold ring-1', roiStyles[item.roi])}>{item.roi}</span>
                <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-300">{item.confidence}% confidence</span>
              </div>
              <h3 className="font-bold text-white">{item.title}</h3>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, item.roiScore)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-teal-300"
                />
              </div>
            </div>
            <Fact label="Monthly" value={`$${item.monthlySavings.toLocaleString()}`} />
            <Fact label="Yearly" value={`$${item.yearlySavings.toLocaleString()}`} />
            <Fact label="Energy" value={`${item.energySaved} kWh`} />
            <Fact label="CO2" value={`${item.co2Reduction} kg`} />
            <Fact label="ROI Score" value={`${item.roiScore}/100`} />
          </div>
        </motion.article>
      ))}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-100">{value}</p>
    </div>
  );
}
