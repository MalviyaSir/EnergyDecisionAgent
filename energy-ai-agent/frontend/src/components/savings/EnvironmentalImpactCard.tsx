import { Leaf, Sprout, SunMedium, Zap } from 'lucide-react';
import type { EnvironmentalImpact } from '@shared/energy';

type EnvironmentalImpactCardProps = {
  impact: EnvironmentalImpact;
};

export function EnvironmentalImpactCard({ impact }: EnvironmentalImpactCardProps) {
  const items = [
    { label: 'Trees Equivalent', value: impact.treesEquivalent.toLocaleString(), icon: Sprout, color: 'text-emerald-200' },
    { label: 'CO2 Reduction', value: `${impact.co2Reduction.toLocaleString()} kg`, icon: Leaf, color: 'text-teal-200' },
    { label: 'Renewable Usage', value: `${impact.renewableUsagePercent}%`, icon: SunMedium, color: 'text-amber-200' },
    { label: 'Efficiency Improvement', value: `${impact.energyEfficiencyImprovementPercent}%`, icon: Zap, color: 'text-sky-200' },
  ];

  return (
    <section className="premium-card p-5">
      <div className="mb-5">
        <p className="metric-label">Environmental Impact</p>
        <h2 className="mt-1 text-lg font-bold text-white">Carbon and Renewable Effect</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="mt-1 text-sm text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
