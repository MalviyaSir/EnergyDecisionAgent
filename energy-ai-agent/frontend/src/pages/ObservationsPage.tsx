import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { AgentObservation } from '@shared/energy';
import { ObservationCard } from '@/components/observations/ObservationCard';
import { ObservationFilters, type ObservationFilter } from '@/components/observations/ObservationFilters';
import { ObservationSummary } from '@/components/observations/ObservationSummary';
import { Card } from '@/components/ui/card';
import { useObservations } from '@/hooks/useObservations';

export function ObservationsPage() {
  const observations = useObservations(10000);
  const [activeFilter, setActiveFilter] = useState<ObservationFilter>('All');
  const [search, setSearch] = useState('');

  const filteredObservations = useMemo(() => {
    if (observations.status !== 'ready') {
      return [];
    }

    return observations.data.observations.filter((observation) => {
      const matchesFilter = activeFilter === 'All' || observation.severity === activeFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        [
          observation.title,
          observation.description,
          observation.type,
          observation.affectedAppliance,
          observation.impact,
        ].some((value) => value.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, observations, search]);

  if (observations.status === 'loading') {
    return (
      <div className="grid gap-4">
        <div className="premium-card h-48 animate-pulse bg-white/[0.08]" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="premium-card h-56 animate-pulse bg-white/[0.08]" />
        ))}
      </div>
    );
  }

  if (observations.status === 'error') {
    return (
      <Card className="rounded-2xl p-8 text-rose-100">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span>{observations.error}</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
      <ObservationSummary response={observations.data} />
      <ObservationFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        search={search}
        onSearchChange={setSearch}
      />
      <section className="grid gap-4">
        {filteredObservations.length > 0 ? (
          filteredObservations.map((observation: AgentObservation, index) => (
            <ObservationCard key={observation.id} observation={observation} index={index} />
          ))
        ) : (
          <Card className="rounded-2xl p-8 text-center text-slate-300">No observations match the current filters.</Card>
        )}
      </section>
    </motion.div>
  );
}
