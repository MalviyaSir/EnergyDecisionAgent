import { ArrowDown, GitCompareArrows } from 'lucide-react';
import type { DecisionRecommendation } from '@shared/energy';

type RecommendationComparisonProps = {
  recommendation: DecisionRecommendation;
};

export function RecommendationComparison({ recommendation }: RecommendationComparisonProps) {
  return (
    <section className="premium-card p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
          <GitCompareArrows className="h-5 w-5" />
        </div>
        <div>
          <p className="metric-label">Comparison Panel</p>
          <h2 className="text-lg font-bold text-white">Current to Recommended</h2>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        <ComparisonStep label="Current Situation" value={recommendation.currentSituation} />
        <Arrow />
        <ComparisonStep label="Recommended Action" value={recommendation.recommendedAction} />
        <Arrow />
        <ComparisonStep label="Expected Improvement" value={recommendation.expectedImprovement} />
      </div>
    </section>
  );
}

function ComparisonStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center text-teal-200">
      <ArrowDown className="h-5 w-5 md:-rotate-90" />
    </div>
  );
}
