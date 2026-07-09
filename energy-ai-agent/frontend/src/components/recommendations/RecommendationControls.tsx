import { ArrowDownWideNarrow, Search } from 'lucide-react';
import type { RecommendationPriorityLabel } from '@shared/energy';
import { cn } from '@/lib/utils';

export type RecommendationFilter = 'All' | RecommendationPriorityLabel;
export type RecommendationSort = 'priority' | 'savings' | 'confidence' | 'easyWins';

type RecommendationControlsProps = {
  activeFilter: RecommendationFilter;
  onFilterChange: (filter: RecommendationFilter) => void;
  activeSort: RecommendationSort;
  onSortChange: (sort: RecommendationSort) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

const filters: RecommendationFilter[] = ['All', 'Critical', 'High', 'Medium', 'Low'];
const sorts: Array<{ label: string; value: RecommendationSort }> = [
  { label: 'Highest Priority', value: 'priority' },
  { label: 'Highest Savings', value: 'savings' },
  { label: 'Highest Confidence', value: 'confidence' },
  { label: 'Easy Wins', value: 'easyWins' },
];

export function RecommendationControls({
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  search,
  onSearchChange,
}: RecommendationControlsProps) {
  return (
    <section className="grid gap-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
        <div className="flex flex-wrap gap-2">
          {sorts.map((sort) => (
            <button
              key={sort.value}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition',
                'hover:bg-white/10 hover:text-white',
                activeSort === sort.value && 'bg-white/[0.14] text-teal-100',
              )}
              onClick={() => onSortChange(sort.value)}
            >
              <ArrowDownWideNarrow className="h-4 w-4" />
              {sort.label}
            </button>
          ))}
        </div>
      </div>
      <label className="relative block min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search recommendations"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.08] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/60 focus:ring-2 focus:ring-teal-300/20"
        />
      </label>
    </section>
  );
}
