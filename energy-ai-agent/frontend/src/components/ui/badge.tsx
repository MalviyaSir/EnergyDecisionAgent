import type * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'teal' | 'amber' | 'rose' | 'slate';
};

const tones = {
  teal: 'bg-teal-300/15 text-teal-100 ring-teal-200/20',
  amber: 'bg-amber-300/15 text-amber-100 ring-amber-200/20',
  rose: 'bg-rose-300/15 text-rose-100 ring-rose-200/20',
  slate: 'bg-slate-300/10 text-slate-200 ring-slate-200/15',
};

export function Badge({ className, tone = 'slate', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1', tones[tone], className)}
      {...props}
    />
  );
}
