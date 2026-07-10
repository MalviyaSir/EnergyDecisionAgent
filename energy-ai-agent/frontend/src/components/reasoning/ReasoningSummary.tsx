import { Activity, AlertTriangle, BrainCircuit, Gauge, Target } from 'lucide-react';
import type { ReasoningResponse } from '@shared/energy';
import { useCountUp } from '@/hooks/useCountUp';

type ReasoningSummaryProps = {
  response: ReasoningResponse;
};

export function ReasoningSummary({ response }: ReasoningSummaryProps) {
  const items = [
    { label: 'Reasoning Generated', value: response.summary.reasoningGenerated, suffix: '', icon: BrainCircuit, color: 'text-teal-200' },
    { label: 'Critical Causes', value: response.summary.criticalCauses, suffix: '', icon: AlertTriangle, color: 'text-rose-200' },
    { label: 'Average Confidence', value: response.summary.averageConfidence, suffix: '%', icon: Gauge, color: 'text-sky-200' },
    { label: 'Overall Explainability Score', value: response.summary.overallExplainabilityScore, suffix: '/100', icon: Activity, color: 'text-emerald-200' },
  ];

  return (
    <section className="premium-card overflow-hidden p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="metric-label">AI Reasoning Summary</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Reasoning Engine</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-teal-100">
          Highest Impact Cause: {response.summary.highestImpactCause}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <SummaryMetric key={item.label} {...item} />
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-200">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="metric-label">Highest Impact Cause</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{response.summary.highestImpactCause}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

type SummaryMetricProps = {
  label: string;
  value: number;
  suffix: string;
  icon: typeof Activity;
  color: string;
};

function SummaryMetric({ label, value, suffix, icon: Icon, color }: SummaryMetricProps) {
  const count = useCountUp(value, 800);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold text-white">
        {Math.round(count)}
        <span className="text-base text-slate-400">{suffix}</span>
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}
