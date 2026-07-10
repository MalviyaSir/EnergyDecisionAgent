import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { DecisionRecommendation } from '@shared/energy';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { RecommendationComparison } from '@/components/recommendations/RecommendationComparison';
import {
  RecommendationControls,
  type RecommendationFilter,
  type RecommendationSort,
} from '@/components/recommendations/RecommendationControls';
import { RecommendationSummary } from '@/components/recommendations/RecommendationSummary';
import { Card } from '@/components/ui/card';
import { useRecommendations } from '@/hooks/useRecommendations';

export function RecommendationsPage() {
  const recommendations = useRecommendations(12000);
  const [activeFilter, setActiveFilter] = useState<RecommendationFilter>('All');
  const [activeSort, setActiveSort] = useState<RecommendationSort>('priority');
  const [search, setSearch] = useState('');

  const visibleRecommendations = useMemo(() => {
    if (recommendations.status !== 'ready') {
      return [];
    }

    const query = search.trim().toLowerCase();
    const filtered = recommendations.data.recommendations.filter((recommendation) => {
      const matchesFilter = activeFilter === 'All' || recommendation.priorityLabel === activeFilter;
      const matchesSearch =
        query.length === 0 ||
        [
          recommendation.title,
          recommendation.reason,
          recommendation.currentSituation,
          recommendation.recommendedAction,
          recommendation.expectedImprovement,
          recommendation.expectedImpact,
          recommendation.difficulty,
        ].some((value) => value.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });

    return [...filtered].sort((a, b) => sortRecommendations(a, b, activeSort));
  }, [activeFilter, activeSort, recommendations, search]);

  if (recommendations.status === 'loading') {
    return (
      <div className="grid gap-4">
        <div className="premium-card h-48 animate-pulse bg-white/[0.08]" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="premium-card h-56 animate-pulse bg-white/[0.08]" />
        ))}
      </div>
    );
  }

  if (recommendations.status === 'error') {
    return (
      <Card className="rounded-2xl p-8 text-rose-100">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span>{recommendations.error}</span>
        </div>
      </Card>
    );
  }

  const comparisonRecommendation = visibleRecommendations[0] ?? recommendations.data.recommendations[0];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
      <RecommendationSummary response={recommendations.data} />
      {comparisonRecommendation ? <RecommendationComparison recommendation={comparisonRecommendation} /> : null}
      <RecommendationControls
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeSort={activeSort}
        onSortChange={setActiveSort}
        search={search}
        onSearchChange={setSearch}
      />
      <section className="grid gap-4">
        {visibleRecommendations.length > 0 ? (
          visibleRecommendations.map((recommendation: DecisionRecommendation, index) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} index={index} />
          ))
        ) : (
          <Card className="rounded-2xl p-8 text-center text-slate-300">No recommendations match the current filters.</Card>
        )}
      </section>
    </motion.div>
  );
}

function sortRecommendations(a: DecisionRecommendation, b: DecisionRecommendation, sort: RecommendationSort) {
  if (sort === 'savings') {
    return b.estimatedSavings - a.estimatedSavings || a.priority - b.priority;
  }

  if (sort === 'confidence') {
    return b.confidence - a.confidence || a.priority - b.priority;
  }

  if (sort === 'easyWins') {
    const difficultyRank = { Easy: 0, Moderate: 1, Hard: 2 };
    return difficultyRank[a.difficulty] - difficultyRank[b.difficulty] || b.estimatedSavings - a.estimatedSavings;
  }

  return a.priority - b.priority;
}
