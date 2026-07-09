import { motion } from 'framer-motion';
import { BadgeDollarSign, BatteryCharging, Clock, Gauge, Sparkles, Zap } from 'lucide-react';
import type { DecisionRecommendation, RecommendationPriorityLabel } from '@shared/energy';
import { cn } from '@/lib/utils';

type RecommendationCardProps = {
  recommendation: DecisionRecommendation;
  index: number;
};

const priorityStyles: Record<RecommendationPriorityLabel, string> = {
  Critical: 'bg-rose-400/20 text-rose-100 ring-rose-300/30',
  High: 'bg-orange-400/20 text-orange-100 ring-orange-300/30',
  Medium: 'bg-amber-400/20 text-amber-100 ring-amber-300/30',
  Low: 'bg-sky-400/20 text-sky-100 ring-sky-300/30',
};

const impactStyles = {
  High: 'text-rose-100 bg-rose-400/15',
  Medium: 'text-amber-100 bg-amber-400/15',
  Low: 'text-sky-100 bg-sky-400/15',
};

export function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -3 }}
      transition={{ delay: index * 0.045, duration: 0.35 }}
      className="premium-card overflow-hidden p-5 transition-shadow hover:shadow-2xl hover:shadow-teal-950/30"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl font-black text-teal-100">
            {recommendation.priority}
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className={cn('rounded-full px-3 py-1 text-xs font-bold ring-1', priorityStyles[recommendation.priorityLabel])}
              >
                {recommendation.priorityLabel}
              </motion.span>
              <span className={cn('rounded-full px-3 py-1 text-xs font-bold', impactStyles[recommendation.expectedImpact])}>
                {recommendation.expectedImpact} impact
              </span>
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-300">
                Score {recommendation.priorityScore}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{recommendation.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{recommendation.reason}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right md:w-52">
          <Metric icon={BadgeDollarSign} label="Savings" value={`$${recommendation.estimatedSavings.toLocaleString()}`} />
          <Metric icon={BatteryCharging} label="Energy" value={`${recommendation.estimatedEnergySaved} kWh`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Fact icon={Gauge} label="Confidence" value={`${recommendation.confidence}%`} />
        <Fact icon={Sparkles} label="Difficulty" value={recommendation.difficulty} />
        <Fact icon={Clock} label="Time" value={recommendation.implementationTime} />
        <Fact icon={Zap} label="Risk" value={recommendation.risk} />
      </div>
    </motion.article>
  );
}

type MetricProps = {
  icon: typeof BadgeDollarSign;
  label: string;
  value: string;
};

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <Icon className="ml-auto h-4 w-4 text-teal-200" />
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}
