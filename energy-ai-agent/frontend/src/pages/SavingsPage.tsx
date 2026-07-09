import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { RecommendationSavings } from '@shared/energy';
import { EnvironmentalImpactCard } from '@/components/savings/EnvironmentalImpactCard';
import { SavingsBreakdown } from '@/components/savings/SavingsBreakdown';
import { SavingsCharts } from '@/components/savings/SavingsCharts';
import { SavingsControls, type SavingsSort } from '@/components/savings/SavingsControls';
import { SavingsLeaderboard } from '@/components/savings/SavingsLeaderboard';
import { SavingsSummary } from '@/components/savings/SavingsSummary';
import { Card } from '@/components/ui/card';
import { useSavings } from '@/hooks/useSavings';

export function SavingsPage() {
  const savings = useSavings(12000);
  const [activeSort, setActiveSort] = useState<SavingsSort>('savings');

  const sortedSavings = useMemo(() => {
    if (savings.status !== 'ready') {
      return [];
    }

    return [...savings.data.recommendationSavings].sort((a, b) => sortSavings(a, b, activeSort));
  }, [activeSort, savings]);

  if (savings.status === 'loading') {
    return (
      <div className="grid gap-4">
        <div className="premium-card h-48 animate-pulse bg-white/[0.08]" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="premium-card h-96 animate-pulse bg-white/[0.08]" />
          <div className="premium-card h-96 animate-pulse bg-white/[0.08]" />
        </div>
      </div>
    );
  }

  if (savings.status === 'error') {
    return (
      <Card className="rounded-2xl p-8 text-rose-100">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span>{savings.error}</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
      <SavingsSummary response={savings.data} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <SavingsLeaderboard items={savings.data.leaderboard} />
        <EnvironmentalImpactCard impact={savings.data.environmentalImpact} />
      </div>
      <SavingsCharts projection={savings.data.monthlyProjection} distribution={savings.data.savingsDistribution} />
      <SavingsControls activeSort={activeSort} onSortChange={setActiveSort} />
      <SavingsBreakdown items={sortedSavings} />
    </motion.div>
  );
}

function sortSavings(a: RecommendationSavings, b: RecommendationSavings, sort: SavingsSort) {
  if (sort === 'roi') {
    return b.roiScore - a.roiScore || b.yearlySavings - a.yearlySavings;
  }

  if (sort === 'co2') {
    return b.yearlyCo2Reduction - a.yearlyCo2Reduction || b.yearlySavings - a.yearlySavings;
  }

  if (sort === 'easyWins') {
    const difficultyRank = { Easy: 0, Moderate: 1, Hard: 2 };
    return difficultyRank[a.difficulty] - difficultyRank[b.difficulty] || b.roiScore - a.roiScore;
  }

  return b.yearlySavings - a.yearlySavings;
}
