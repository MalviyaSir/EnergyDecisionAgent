import { Activity, AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import type { ObservationsResponse } from '@shared/energy';
import { useCountUp } from '@/hooks/useCountUp';

type ObservationSummaryProps = {
  response: ObservationsResponse;
};

export function ObservationSummary({ response }: ObservationSummaryProps) {
  const items = [
    { label: 'Observations Generated', value: response.summary.observationsGenerated, suffix: '', icon: Activity, color: 'text-sky-200' },
    { label: 'Critical', value: response.summary.critical, suffix: '', icon: AlertTriangle, color: 'text-rose-200' },
    { label: 'Warnings', value: response.summary.warnings, suffix: '', icon: ShieldCheck, color: 'text-amber-200' },
    { label: 'Positive', value: response.summary.positive, suffix: '', icon: CheckCircle2, color: 'text-emerald-200' },
    { label: 'Overall Health Score', value: response.summary.overallHealthScore, suffix: '/100', icon: Sparkles, color: 'text-teal-200' },
  ];

  return (
    <section className="premium-card overflow-hidden p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="metric-label">AI Observation Summary</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Energy Observation Agent</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-teal-100">
          Overall Status: {response.overallStatus}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <SummaryMetric key={item.label} {...item} />
        ))}
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
