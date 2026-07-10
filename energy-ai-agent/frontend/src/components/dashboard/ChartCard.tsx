import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <Card className="min-h-[22rem] min-w-0 overflow-hidden rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80 min-w-0 overflow-hidden pb-6">{children}</CardContent>
    </Card>
  );
}
