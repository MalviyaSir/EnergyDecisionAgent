import { BadgeDollarSign, BatteryCharging, CloudSun, Gauge, TrendingUp } from 'lucide-react';
import type { SavingsResponse } from '@shared/energy';
import { useCountUp } from '@/hooks/useCountUp';

type SavingsSummaryProps = {
  response: SavingsResponse;
};

export function SavingsSummary({ response }: SavingsSummaryProps) {
  const items = [
    { label: 'Monthly Savings', value: response.summary.monthlySavings, prefix: '$', suffix: '', icon: BadgeDollarSign, color: 'text-emerald-200' },
    { label: 'Yearly Savings', value: response.summary.yearlySavings, prefix: '$', suffix: '', icon: TrendingUp, color: 'text-teal-200' },
    { label: 'Energy Saved', value: response.summary.energySavedMonthly, prefix: '', suffix: ' kWh', icon: BatteryCharging, color: 'text-sky-200' },
    { label: 'CO2 Reduction', value: response.summary.co2ReductionMonthly, prefix: '', suffix: ' kg', icon: CloudSun, color: 'text-amber-200' },
    { label: 'ROI Score', value: response.summary.roiScore, prefix: '', suffix: '/100', icon: Gauge, color: 'text-rose-200' },
  ];

  return (
    <section className="premium-card overflow-hidden p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="metric-label">AI Savings Summary</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Savings Estimation & ROI Engine</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-teal-100">
          Payback: {response.summary.paybackPeriod}
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
  prefix: string;
  suffix: string;
  icon: typeof BadgeDollarSign;
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
