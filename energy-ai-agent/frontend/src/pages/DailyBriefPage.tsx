import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requestJson } from '@/lib/api';

type DailyBriefResponse = {
  good_morning_message: string;
  date: string;
  executive_summary: string;
  facility_manager_insights: string;
  top_recommendations: string[];
  priority_actions: string[];
  critical_alerts: string[];
  top_risks: string[];
  equipment_requiring_attention: string[];
  predicted_electricity_bill_today: string;
  predicted_electricity_bill_month: string;
  estimated_daily_saving: string;
  estimated_monthly_saving: string;
  carbon_reduction_today: string;
  carbon_reduction_month: string;
  confidence_score: number;
  building_health_score: number;
  energy_efficiency_score: number;
};

export function DailyBriefPage() {
  const [brief, setBrief] = useState<DailyBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadBrief() {
      try {
        const data = await requestJson<DailyBriefResponse>('/api/daily-brief');
        if (active) {
          setBrief(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load the daily brief');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBrief();
    const timer = window.setInterval(loadBrief, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (loading) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-8 text-slate-300">Loading daily brief…</div>;
  }

  if (error || !brief) {
    return (
      <Card className="rounded-2xl p-8 text-rose-100">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span>{error ?? 'Daily brief is unavailable.'}</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Daily Brief</CardTitle>
              <CardDescription>{brief.date}</CardDescription>
            </div>
            <div className="rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-sm text-teal-200">
              Confidence {brief.confidence_score}%
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 p-4">
            <div className="flex items-center gap-2 text-teal-200">
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold">{brief.good_morning_message}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{brief.executive_summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm text-slate-400">Building Health</p>
              <p className="mt-1 text-2xl font-semibold text-white">{brief.building_health_score}/100</p>
              <p className="mt-1 text-sm text-slate-300">Energy Efficiency {brief.energy_efficiency_score}/100</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm text-slate-400">Financial Outlook</p>
              <p className="mt-1 text-lg font-semibold text-white">{brief.predicted_electricity_bill_today}</p>
              <p className="text-sm text-slate-300">Monthly bill {brief.predicted_electricity_bill_month}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="mb-3 flex items-center gap-2 font-semibold text-white"><TrendingUp className="h-4 w-4" />Top recommendations</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {brief.top_recommendations.map((item) => <li key={item} className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="mb-3 font-semibold text-white">Priority actions</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {brief.priority_actions.map((item) => <li key={item} className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="mb-3 font-semibold text-white">Critical alerts</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {brief.critical_alerts.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="mb-3 font-semibold text-white">Top risks</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {brief.top_risks.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="mb-2 font-semibold text-white">Facility manager insights</p>
            <p className="text-sm text-slate-300">{brief.facility_manager_insights}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
