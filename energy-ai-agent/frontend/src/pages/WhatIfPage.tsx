import { useMemo, useState } from 'react';
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
  temperature: number;
  humidity: number;
  hvacLoad: number;
  lightingLoad: number;
  plugLoad: number;
  solarGeneration: number;
  batteryCharge: number;
  electricityTariff: number;
  workingHours: number;
  weekendMode: boolean;
  holidayMode: boolean;
  peakDemand: number;
  acUnits: number;
  lights: number;
  equipmentCount: number;
  buildingSize: number;
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

const defaultParams: SimulationParams = {
  temperatureSetpoint: 24,
  lightingReduction: 0,
  occupancyPercent: 100,
  shiftEvCharging: false,
  batteryReservePercent: 40,
  temperature: 30,
  humidity: 60,
  hvacLoad: 18,
  lightingLoad: 7,
  plugLoad: 9,
  solarGeneration: 0,
  batteryCharge: 45,
  electricityTariff: 8.5,
  workingHours: 17,
  weekendMode: false,
  holidayMode: false,
  peakDemand: 52,
  acUnits: 4,
  lights: 36,
  equipmentCount: 22,
  buildingSize: 6500,
};

export function WhatIfPage() {
  const [params, setParams] = useState(defaultParams);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateParam = (key: keyof SimulationParams, value: number | boolean) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

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
          temperature: params.temperature,
          humidity: params.humidity,
          hvacLoad: params.hvacLoad,
          lightingLoad: params.lightingLoad,
          plugLoad: params.plugLoad,
          solarGeneration: params.solarGeneration,
          batteryCharge: params.batteryCharge,
          electricityTariff: params.electricityTariff,
          workingHours: params.workingHours,
          weekendMode: params.weekendMode,
          holidayMode: params.holidayMode,
          peakDemand: params.peakDemand,
          acUnits: params.acUnits,
          lights: params.lights,
          equipmentCount: params.equipmentCount,
          buildingSize: params.buildingSize,
        }),
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run simulation');
    } finally {
      setLoading(false);
    }
  }

  const metricCards = useMemo(() => {
    if (!result) return [];
    return [
      { label: 'Monthly savings', value: `₹${result.monthly_savings_inr.toFixed(0)}`, tone: 'text-emerald-300' },
      { label: 'Annual savings', value: `₹${result.annual_savings_inr.toFixed(0)}`, tone: 'text-sky-300' },
      { label: 'CO₂ reduction', value: `${result.carbon_reduction_kg_co2.toFixed(0)} kg`, tone: 'text-cyan-300' },
      { label: 'ROI', value: `${result.roi_percent.toFixed(1)}%`, tone: 'text-amber-300' },
    ];
  }, [result]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scenario parameters</CardTitle>
            <CardDescription>Adjust the live building controls and recalculate instantly.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Slider label={`AC temperature setpoint: ${params.temperatureSetpoint}°C`} min={18} max={30} value={params.temperatureSetpoint} onChange={(value) => updateParam('temperatureSetpoint', value)} />
            <Slider label={`Lighting reduction: ${params.lightingReduction}%`} min={0} max={60} value={params.lightingReduction} onChange={(value) => updateParam('lightingReduction', value)} />
            <Slider label={`Occupancy: ${params.occupancyPercent}%`} min={0} max={100} value={params.occupancyPercent} onChange={(value) => updateParam('occupancyPercent', value)} />
            <Slider label={`Solar generation: ${params.solarGeneration} kW`} min={0} max={40} value={params.solarGeneration} onChange={(value) => updateParam('solarGeneration', value)} />
            <Slider label={`Battery charge: ${params.batteryCharge}%`} min={10} max={90} value={params.batteryCharge} onChange={(value) => updateParam('batteryCharge', value)} />
            <Slider label={`Tariff: ₹${params.electricityTariff}/kWh`} min={4} max={15} step={0.5} value={params.electricityTariff} onChange={(value) => updateParam('electricityTariff', value)} />
            <Slider label={`Working hours: ${params.workingHours}:00`} min={8} max={22} value={params.workingHours} onChange={(value) => updateParam('workingHours', value)} />
            <Slider label={`Peak demand: ${params.peakDemand} kW`} min={20} max={90} value={params.peakDemand} onChange={(value) => updateParam('peakDemand', value)} />
            <Slider label={`AC units: ${params.acUnits}`} min={1} max={10} value={params.acUnits} onChange={(value) => updateParam('acUnits', value)} />
            <Slider label={`Lights: ${params.lights}`} min={10} max={80} value={params.lights} onChange={(value) => updateParam('lights', value)} />
            <Slider label={`Equipment count: ${params.equipmentCount}`} min={5} max={50} value={params.equipmentCount} onChange={(value) => updateParam('equipmentCount', value)} />
            <Slider label={`Building size: ${params.buildingSize} m²`} min={1000} max={20000} value={params.buildingSize} onChange={(value) => updateParam('buildingSize', value)} />
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-300">
              <span>Shift EV charging</span>
              <input type="checkbox" checked={params.shiftEvCharging} onChange={(event) => updateParam('shiftEvCharging', event.target.checked)} className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-300">
              <span>Weekend mode</span>
              <input type="checkbox" checked={params.weekendMode} onChange={(event) => updateParam('weekendMode', event.target.checked)} className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-300">
              <span>Holiday mode</span>
              <input type="checkbox" checked={params.holidayMode} onChange={(event) => updateParam('holidayMode', event.target.checked)} className="h-4 w-4" />
            </label>
            <Button onClick={runSimulation} disabled={loading} className="md:col-span-2">
              <Play className="mr-2 h-4 w-4" />
              {loading ? 'Running simulation…' : 'Run what-if scenario'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scenario impact</CardTitle>
            <CardDescription>Real-time projection from the live simulation engine.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {metricCards.length > 0 ? metricCards.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className={`mt-1 text-xl font-semibold ${metric.tone}`}>{metric.value}</p>
              </div>
            )) : <p className="text-sm text-slate-400">Run a scenario to see the projected savings and operational impact.</p>}
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-rose-300" />
            <div>
              <p className="font-medium text-white">Simulation error</p>
              <p className="text-sm text-slate-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>AI analysis</CardTitle>
              <CardDescription>Confidence {result.analysis.confidence_score}%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 p-4 text-sm text-slate-200">{result.analysis.executive_summary}</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-white"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Benefits</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {result.analysis.benefits.map((benefit, index) => <li key={`${benefit}-${index}`}>{benefit}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-white"><AlertTriangle className="h-4 w-4 text-amber-300" />Trade-offs</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {result.analysis.trade_offs.map((tradeOff, index) => <li key={`${tradeOff}-${index}`}>{tradeOff}</li>)}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current vs proposed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-slate-400">
                      <th className="py-2 pr-3">Metric</th>
                      <th className="py-2 pr-3">Current</th>
                      <th className="py-2 pr-3">Proposed</th>
                      <th className="py-2 pr-3">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.comparisons.map((comparison) => (
                      <tr key={comparison.metric} className="border-b border-white/10 text-slate-300">
                        <td className="py-2 pr-3">{comparison.metric}</td>
                        <td className="py-2 pr-3">{formatValue(comparison.current_value, comparison.unit)}</td>
                        <td className="py-2 pr-3">{formatValue(comparison.proposed_value, comparison.unit)}</td>
                        <td className="py-2 pr-3">{comparison.improvement_percent > 0 ? '+' : ''}{comparison.improvement_percent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </motion.div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm text-slate-300">
      <span className="font-medium text-white">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full" />
    </label>
  );
}

function formatValue(value: number | string, unit: string) {
  if (typeof value === 'number') {
    return `${value.toFixed(1)} ${unit}`.trim();
  }
  return `${value} ${unit}`.trim();
}

