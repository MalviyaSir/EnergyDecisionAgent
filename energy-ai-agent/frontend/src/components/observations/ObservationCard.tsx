import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertOctagon,
  AlertTriangle,
  BatteryWarning,
  ChevronDown,
  CircleDollarSign,
  CloudSun,
  Gauge,
  Moon,
  PlugZap,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { AgentObservation } from '@shared/energy';
import { cn } from '@/lib/utils';

type ObservationCardProps = {
  observation: AgentObservation;
  index: number;
};

const severityStyles: Record<AgentObservation['severity'], string> = {
  Critical: 'bg-rose-400/20 text-rose-100 ring-rose-300/30',
  High: 'bg-orange-400/20 text-orange-100 ring-orange-300/30',
  Medium: 'bg-amber-400/20 text-amber-100 ring-amber-300/30',
  Low: 'bg-sky-400/20 text-sky-100 ring-sky-300/30',
  Positive: 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/30',
};

const iconMap = {
  'Peak Usage': Zap,
  'High Consumption Appliance': PlugZap,
  'Abnormal Spike': AlertOctagon,
  'High Electricity Price Usage': CircleDollarSign,
  'Low Solar Utilization': CloudSun,
  'Battery Warning': BatteryWarning,
  'Night Consumption': Moon,
  'Idle Consumption': Gauge,
  'Carbon Emission Warning': AlertTriangle,
  'Positive Observation': Sparkles,
};

export function ObservationCard({ observation, index }: ObservationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[observation.type as keyof typeof iconMap] ?? Gauge;
  const timestamp = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(observation.timestamp));

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.35 }}
      className="premium-card overflow-hidden p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-teal-100">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className={cn('rounded-full px-3 py-1 text-xs font-bold ring-1', severityStyles[observation.severity])}
              >
                {observation.severity}
              </motion.span>
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-300">
                {observation.confidence}% confidence
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{observation.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{observation.description}</p>
          </div>
        </div>
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-slate-300 transition hover:bg-white/[0.14] hover:text-white"
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Fact label="Timestamp" value={timestamp} />
        <Fact label="Affected Appliance" value={observation.affectedAppliance} />
        <Fact label="Time Window" value={observation.time} />
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="metric-label">Impact</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{observation.impact}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

type FactProps = {
  label: string;
  value: string;
};

function Fact({ label, value }: FactProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}
