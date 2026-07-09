import { Search } from 'lucide-react';
import type { ReasoningSeverity } from '@shared/energy';
import { cn } from '@/lib/utils';

export type ReasoningFilter = 'All' | ReasoningSeverity;

type ReasoningFiltersProps = {
  activeFilter: ReasoningFilter;
  onFilterChange: (filter: ReasoningFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

const filters: ReasoningFilter[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

export function ReasoningFilters({ activeFilter, onFilterChange, search, onSearchChange }: ReasoningFiltersProps) {
  return (
    <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            className={cn(
              'rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition',
              'hover:bg-white/10 hover:text-white',
              activeFilter === filter && 'bg-teal-300 text-slate-950 hover:bg-teal-200 hover:text-slate-950',
            )}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <label className="relative block min-w-0 md:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search reasoning"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.08] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/60 focus:ring-2 focus:ring-teal-300/20"
        />
      </label>
    </section>
  );
}
