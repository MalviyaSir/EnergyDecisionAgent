import { ArrowDownWideNarrow } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SavingsSort = 'savings' | 'roi' | 'co2' | 'easyWins';

type SavingsControlsProps = {
  activeSort: SavingsSort;
  onSortChange: (sort: SavingsSort) => void;
};

const sorts: Array<{ label: string; value: SavingsSort }> = [
  { label: 'Highest Savings', value: 'savings' },
  { label: 'Highest ROI', value: 'roi' },
  { label: 'Highest CO2 Reduction', value: 'co2' },
  { label: 'Easy Wins', value: 'easyWins' },
];

export function SavingsControls({ activeSort, onSortChange }: SavingsControlsProps) {
  return (
    <section className="flex flex-wrap gap-2">
      {sorts.map((sort) => (
        <button
          key={sort.value}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition',
            'hover:bg-white/10 hover:text-white',
            activeSort === sort.value && 'bg-teal-300 text-slate-950 hover:bg-teal-200 hover:text-slate-950',
          )}
          onClick={() => onSortChange(sort.value)}
        >
          <ArrowDownWideNarrow className="h-4 w-4" />
          {sort.label}
        </button>
      ))}
    </section>
  );
}
