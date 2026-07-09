import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, ChevronDown, Crosshair, Lightbulb, ShieldAlert } from 'lucide-react';
import type { ReasoningItem, ReasoningSeverity } from '@shared/energy';
import { cn } from '@/lib/utils';

type ReasoningCardProps = {
  item: ReasoningItem;
  index: number;
};

const severityStyles: Record<ReasoningSeverity, string> = {
  Critical: 'bg-rose-400/20 text-rose-100 ring-rose-300/30',
  High: 'bg-orange-400/20 text-orange-100 ring-orange-300/30',
  Medium: 'bg-amber-400/20 text-amber-100 ring-amber-300/30',
  Low: 'bg-sky-400/20 text-sky-100 ring-sky-300/30',
};

export function ReasoningCard({ item, index }: ReasoningCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="premium-card overflow-hidden p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-teal-100">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className={cn('rounded-full px-3 py-1 text-xs font-bold ring-1', severityStyles[item.severity])}
              >
                {item.severity}
              </motion.span>
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-300">
                {item.confidence}% confidence
              </span>
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-300">
                {item.linkedObservationId}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{item.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{item.rootCause}</p>
          </div>
        </div>
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-slate-300 transition hover:bg-white/[0.14] hover:text-white"
          onClick={() => setExpanded((current) => !current)}
          aria-label="Toggle reasoning explanation"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_10rem_1fr]">
        <Fact icon={Crosshair} label="Root Cause" value={item.rootCauseAnalysis.primaryCause} />
        <ConfidenceRing confidence={item.confidence} />
        <Fact icon={Lightbulb} label="Recommended Focus" value={item.recommendedFocus} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.evidence.map((evidence) => (
          <span key={evidence} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300">
            {evidence}
          </span>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 md:grid-cols-2">
              <div>
                <p className="metric-label">Explanation</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.reasoning}</p>
              </div>
              <div>
                <p className="metric-label">Root Cause Analysis</p>
                <div className="mt-2 grid gap-2 text-sm text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-100">Secondary Cause:</span> {item.rootCauseAnalysis.secondaryCause}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-100">Supporting Factors:</span>{' '}
                    {item.rootCauseAnalysis.supportingFactors.join('; ')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

type FactProps = {
  icon: typeof ShieldAlert;
  label: string;
  value: string;
};

function Fact({ icon: Icon, label, value }: FactProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm font-semibold leading-5 text-slate-200">{value}</p>
    </div>
  );
}

function ConfidenceRing({ confidence }: { confidence: number }) {
  const angle = confidence * 3.6;

  return (
    <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <motion.div
        initial={{ background: 'conic-gradient(rgb(94 234 212) 0deg, rgba(255,255,255,0.1) 0deg)' }}
        animate={{ background: `conic-gradient(rgb(94 234 212) ${angle}deg, rgba(255,255,255,0.1) ${angle}deg)` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex h-24 w-24 items-center justify-center rounded-full"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950/80 text-lg font-bold text-white">
          {confidence}%
        </div>
      </motion.div>
    </div>
  );
}
