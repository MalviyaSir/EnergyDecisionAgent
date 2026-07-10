import { Trophy } from 'lucide-react';
import type { RecommendationSavings } from '@shared/energy';

type SavingsLeaderboardProps = {
  items: RecommendationSavings[];
};

export function SavingsLeaderboard({ items }: SavingsLeaderboardProps) {
  return (
    <section className="premium-card p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-200">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <p className="metric-label">Leaderboard</p>
          <h2 className="text-lg font-bold text-white">Top 5 Money Saving Actions</h2>
        </div>
      </div>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={item.recommendationId} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 md:grid-cols-[3rem_1fr_auto] md:items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-teal-100">{index + 1}</div>
            <div>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.roi} ROI</p>
            </div>
            <p className="text-xl font-bold text-emerald-200">${item.yearlySavings.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
