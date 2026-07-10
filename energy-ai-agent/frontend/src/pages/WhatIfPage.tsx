import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Play, TrendingDown, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requestJson } from '@/lib/api';

interface SimulationParams {
  temperatureSetpoint: number;
  lightingReduction: number;
  occupancyPercent: number;
  shiftEvCharging: boolean;
  batteryReservePercent: number;
}

interface SimulationResult {
  current_energy_usage_kwh: number;
  current_monthly_bill_inr: number;
  current_comfort_score: number;
  current_efficiency_score: number;
  current_health_score: number;
  predicted_energy_usage_kwh: number;
  predicted_monthly_bill_inr: number;
  predicted_comfort_score: number;
  predicted_efficiency_score: number;
  predicted_health_score: number;
  monthly_savings_inr: number;
  annual_savings_inr: number;
  carbon_reduction_kg_co2: number;
  energy_efficiency_improvement_percent: number;
  building_health_improvement_percent: number;
  peak_load_reduction_kw: number;
  roi_percent: number;
  analysis: {
    executive_summary: string;
    benefits: string[];
    trade_offs: string[];
    risks: string[];
    recommendations: string[];
    confidence_score: number;
  };
  comparisons: Array<{
    metric: string;
    current_value: number | string;
    proposed_value: number | string;
    improvement_percent: number;
    unit: string;
  }>;
  actions_considered: string[];
}

export function WhatIfPage() {
  const [params, setParams] = useState<SimulationParams>({
    temperatureSetpoint: 24,
    lightingReduction: 0,
    occupancyPercent: 100,
    shiftEvCharging: false,
    batteryReservePercent: 40,
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulation() {
    setLoading(true);
    setError(null);

    try {
      const response = await requestJson<SimulationResult>('/api/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperatureSetpoint: params.temperatureSetpoint,
          reduceLightingPercent: params.lightingReduction,
          occupancyPercent: params.occupancyPercent,
          shiftEvCharging: params.shiftEvCharging,
          batteryReservePercent: params.batteryReservePercent,
        }),
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run simulation');
    } finally {
      setLoading(false);
    }
  }

  const updateParam = (key: keyof SimulationParams, value: number | boolean) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      {/* Parameter Controls */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scenario Parameters</CardTitle>
            <CardDescription>Configure your what-if scenario</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Temperature */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                AC Temperature Setpoint: {params.temperatureSetpoint}°C
              </label>
              <input
                type="range"
                min="18"
                max="30"
                value={params.temperatureSetpoint}
                onChange={(e) => updateParam('temperatureSetpoint', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-400">Optimal: 22°C, Higher = More Savings</p>
            </div>

            {/* Lighting */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Lighting Reduction: {params.lightingReduction}%
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={params.lightingReduction}
                onChange={(e) => updateParam('lightingReduction', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-400">Recommended: 15-30%</p>
            </div>

            {/* Occupancy */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Occupancy Level: {params.occupancyPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={params.occupancyPercent}
                onChange={(e) => updateParam('occupancyPercent', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-400">Reflects expected building utilization</p>
            </div>

            {/* EV Charging */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={params.shiftEvCharging}
                  onChange={(e) => updateParam('shiftEvCharging', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Shift EV Charging Off-Peak</span>
              </label>
              <p className="text-xs text-slate-400">Move charging to nights for lower tariffs</p>
            </div>

            {/* Battery Reserve */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Battery Reserve: {params.batteryReservePercent}%
              </label>
              <input
                type="range"
                min="10"
                max="90"
                value={params.batteryReservePercent}
                onChange={(e) => updateParam('batteryReservePercent', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-400">Higher = More buffer, Lower = More peak shaving</p>
            </div>

            <Button onClick={runSimulation} disabled={loading} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Key Impact</CardTitle>
              <CardDescription>Expected results from this scenario</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-3">
                {/* Monthly Savings */}
                <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-slate-400">Monthly Savings</p>
                      <p className="text-lg font-bold text-green-500">₹{result.monthly_savings_inr.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Annual Savings */}
                <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-400">Annual Savings</p>
                      <p className="text-lg font-bold text-blue-500">₹{result.annual_savings_inr.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Carbon Reduction */}
                <div className="rounded-lg bg-cyan-500/10 p-3 border border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                    <div>
                      <p className="text-xs text-slate-400">Carbon Reduction</p>
                      <p className="text-lg font-bold text-cyan-500">{result.carbon_reduction_kg_co2.toFixed(0)} kg CO₂/yr</p>
                    </div>
                  </div>
                </div>

                {/* ROI */}
                <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-400">ROI (12 months)</p>
                      <p className="text-lg font-bold text-amber-500">{result.roi_percent.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Analysis & Insights</CardTitle>
                  <CardDescription>Confidence: {result.analysis.confidence_score}%</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-slate-500/10 p-4 border border-slate-500/20">
                <p className="text-sm leading-relaxed">{result.analysis.executive_summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Benefits */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Benefits
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.analysis.benefits.map((benefit, i) => (
                      <li key={i} className="text-slate-400 flex gap-2">
                        <span className="text-green-500">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trade-offs */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Trade-offs
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.analysis.trade_offs.map((tradeoff, i) => (
                      <li key={i} className="text-slate-400 flex gap-2">
                        <span className="text-amber-500">•</span>
                        {tradeoff}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {result.analysis.risks.length > 0 && (
                <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Risks to Consider
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.analysis.risks.map((risk, i) => (
                      <li key={i} className="text-slate-400 flex gap-2">
                        <span className="text-red-500">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Next steps for implementation</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {result.analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-medium text-teal-400 flex-shrink-0">{i + 1}.</span>
                    <span className="text-slate-400">{rec}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current vs Proposed Comparison</CardTitle>
              <CardDescription>Side-by-side metric comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 font-medium">Metric</th>
                      <th className="text-right py-2 px-3">Current</th>
                      <th className="text-right py-2 px-3">Proposed</th>
                      <th className="text-right py-2 px-3">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.comparisons.map((comp, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-300">{comp.metric}</td>
                        <td className="text-right py-2 px-3">
                          {typeof comp.current_value === 'number' ? comp.current_value.toFixed(1) : comp.current_value}
                          <span className="text-xs text-slate-500 ml-1">{comp.unit}</span>
                        </td>
                        <td className="text-right py-2 px-3">
                          {typeof comp.proposed_value === 'number' ? comp.proposed_value.toFixed(1) : comp.proposed_value}
                          <span className="text-xs text-slate-500 ml-1">{comp.unit}</span>
                        </td>
                        <td className={`text-right py-2 px-3 font-medium ${comp.improvement_percent > 0 ? 'text-green-500' : comp.improvement_percent < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {comp.improvement_percent > 0 ? '+' : ''}{comp.improvement_percent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions Considered */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Considered</CardTitle>
              <CardDescription>Measures included in this scenario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-2">
                {result.actions_considered.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-800/30 p-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-400">{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}

