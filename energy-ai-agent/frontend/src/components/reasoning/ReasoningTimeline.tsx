import { ArrowDown, GitBranch } from 'lucide-react';
import type { ReasoningTimelineItem } from '@shared/energy';

type ReasoningTimelineProps = {
  items: ReasoningTimelineItem[];
};

export function ReasoningTimeline({ items }: ReasoningTimelineProps) {
  return (
    <section className="premium-card p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
          <GitBranch className="h-5 w-5" />
        </div>
        <div>
          <p className="metric-label">Timeline View</p>
          <h2 className="text-lg font-bold text-white">Observation to Reason</h2>
        </div>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.reasonId} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observation</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{item.observationTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{item.observationType}</p>
            </div>
            <div className="flex justify-center text-teal-200 md:px-4">
              <ArrowDown className="h-5 w-5 md:-rotate-90" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{item.reasonTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{item.severity} severity</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
