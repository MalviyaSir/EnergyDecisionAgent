import { BadgeDollarSign, BrainCircuit, Gauge, Lightbulb, Trophy } from 'lucide-react';
import type { RecommendationsResponse } from '@shared/energy';
import { useCountUp } from '@/hooks/useCountUp';

type RecommendationSummaryProps = {
  response: RecommendationsResponse;
};

export function RecommendationSummary({ response }: RecommendationSummaryProps) {
  const items = [
    { label: 'Recommendations Generated', value: response.summary.recommendationsGenerated, prefix: '', suffix: '', icon: Lightbulb, color: 'text-teal-200' },
    { label: 'Estimated Monthly Savings', value: response.summary.estimatedMonthlySavings, prefix: '$', suffix: '', icon: BadgeDollarSign, color: 'text-emerald-200' },
    { label: 'Estimated Yearly Savings', value: response.summary.estimatedYearlySavings, prefix: '$', suffix: '', icon: Trophy, color: 'text-amber-200' },
    { label: 'Average Confidence', value: response.summary.averageConfidence, prefix: '', suffix: '%', icon: Gauge, color: 'text-sky-200' },
  ];

  return (
    <section className="premium-card overflow-hidden p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="metric-label">AI Recommendation Summary</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Decision Engine</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-teal-100">
          Highest Impact: {response.summary.highestImpactRecommendation}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <SummaryMetric key={item.label} {...item} />
        ))}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <PriorityMetric label="High Priority" value={response.summary.highPriority} tone="text-rose-200" />
        <PriorityMetric label="Medium Priority" value={response.summary.mediumPriority} tone="text-amber-200" />
        <PriorityMetric label="Low Priority" value={response.summary.lowPriority} tone="text-sky-200" />
      </div>
    </section>
  );
}

type SummaryMetricProps = {
  label: string;
  value: number;
  prefix: string;
  suffix: string;
  icon: typeof BrainCircuit;
  color: string;
};

function SummaryMetric({ label, value, prefix, suffix, icon: Icon, color }: SummaryMetricProps) {
  const count = useCountUp(value, 850);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold text-white">
        {prefix}
        {Math.round(count).toLocaleString()}
        <span className="text-base text-slate-400">{suffix}</span>
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function PriorityMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  const count = useCountUp(value, 700);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <p className={`text-2xl font-bold ${tone}`}>{Math.round(count)}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}
