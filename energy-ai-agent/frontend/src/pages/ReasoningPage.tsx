import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { ReasoningItem } from '@shared/energy';
import { ReasoningCard } from '@/components/reasoning/ReasoningCard';
import { ReasoningFilters, type ReasoningFilter } from '@/components/reasoning/ReasoningFilters';
import { ReasoningSummary } from '@/components/reasoning/ReasoningSummary';
import { ReasoningTimeline } from '@/components/reasoning/ReasoningTimeline';
import { Card } from '@/components/ui/card';
import { useReasoning } from '@/hooks/useReasoning';

export function ReasoningPage() {
  const reasoning = useReasoning(12000);
  const [activeFilter, setActiveFilter] = useState<ReasoningFilter>('All');
  const [search, setSearch] = useState('');

  const filteredReasoning = useMemo(() => {
    if (reasoning.status !== 'ready') {
      return [];
    }

    return reasoning.data.reasoning.filter((item) => {
      const matchesFilter = activeFilter === 'All' || item.severity === activeFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        [
          item.title,
          item.rootCause,
          item.reasoning,
          item.recommendedFocus,
          item.rootCauseAnalysis.primaryCause,
          item.rootCauseAnalysis.secondaryCause,
          ...item.evidence,
          ...item.rootCauseAnalysis.supportingFactors,
        ].some((value) => value.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, reasoning, search]);

  if (reasoning.status === 'loading') {
    return (
      <div className="grid gap-4">
        <div className="premium-card h-48 animate-pulse bg-white/[0.08]" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="premium-card h-64 animate-pulse bg-white/[0.08]" />
        ))}
      </div>
    );
  }

  if (reasoning.status === 'error') {
    return (
      <Card className="rounded-2xl p-8 text-rose-100">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span>{reasoning.error}</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
      <ReasoningSummary response={reasoning.data} />
      <ReasoningFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} search={search} onSearchChange={setSearch} />
      <section className="grid gap-4">
        {filteredReasoning.length > 0 ? (
          filteredReasoning.map((item: ReasoningItem, index) => <ReasoningCard key={item.id} item={item} index={index} />)
        ) : (
          <Card className="rounded-2xl p-8 text-center text-slate-300">No reasoning matches the current filters.</Card>
        )}
      </section>
      <ReasoningTimeline items={reasoning.data.timeline} />
    </motion.div>
  );
}
