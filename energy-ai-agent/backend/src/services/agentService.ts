import type {
  ApplianceUsage,
  ChartPoint,
  FeedbackRequest,
  LiveMeterReading,
  MeterDataRecord,
  ApplianceHealthStatus,
  ObservationsResponse,
  ReasoningResponse,
  SmartDashboardResponse,
  WhatIfRequest,
} from '../../../shared/energy.js';
import { ObservationEngine } from '../engines/ObservationEngine.js';
import { readMeterData } from './dataService.js';
import { generateReasoning } from './reasoningService.js';

export async function getMeterData() {
  return {
    source: 'local-json',
    records: await readMeterData(),
  };
}

export async function getSmartDashboard(): Promise<SmartDashboardResponse> {
  const records = await readMeterData();
  const latest = records.at(-1);
  const previous = records.at(-2);

  if (!latest || !previous) {
    throw new Error('Dashboard data requires at least two meter records.');
  }

  const monthlyConsumption = sum(records, (record) => record.energyConsumed);
  const monthlySolar = sum(records, (record) => record.solarGeneration);
  const monthlyCost = sum(records, (record) => record.energyConsumed * record.electricityPrice);
  const efficiencyScore = calculateEfficiencyScore(latest, monthlySolar / monthlyConsumption);
  const currentPowerUsage = latest.energyConsumed / 24;

  return {
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        id: 'currentPowerUsage',
        label: 'Current Power Usage',
        value: round(currentPowerUsage, 1),
        unit: 'kWh',
        trend: trend(currentPowerUsage, previous.energyConsumed / 24),
      },
      {
        id: 'todayConsumption',
        label: "Today's Consumption",
        value: latest.energyConsumed,
        unit: 'kWh',
        trend: trend(latest.energyConsumed, previous.energyConsumed),
      },
      {
        id: 'estimatedMonthlyBill',
        label: 'Estimated Monthly Bill',
        value: Math.round(monthlyCost),
        unit: '$',
        trend: trend(latest.energyConsumed * latest.electricityPrice, previous.energyConsumed * previous.electricityPrice),
      },
      {
        id: 'solarGeneration',
        label: 'Solar Generation',
        value: latest.solarGeneration,
        unit: 'kWh',
        trend: trend(latest.solarGeneration, previous.solarGeneration),
      },
      {
        id: 'batteryLevel',
        label: 'Battery Level',
        value: latest.batteryLevel,
        unit: '%',
        trend: trend(latest.batteryLevel, previous.batteryLevel),
      },
      {
        id: 'energyEfficiencyScore',
        label: 'Energy Efficiency Score',
        value: efficiencyScore,
        unit: '/100',
        trend: trend(efficiencyScore, calculateEfficiencyScore(previous, previous.solarGeneration / previous.energyConsumed)),
      },
    ],
    charts: {
      hourlyConsumption: buildHourlyConsumption(latest),
      dailyConsumption: records.map((record) => ({
        label: formatDay(record.timestamp),
        consumption: record.energyConsumed,
      })),
      applianceConsumption: applianceEntries(latest.applianceUsage).map(([name, value]) => ({
        label: name,
        usage: value,
      })),
      solarVsGridUsage: records.map((record) => ({
        label: formatDay(record.timestamp),
        solar: record.solarGeneration,
        grid: Math.max(record.energyConsumed - record.solarGeneration, 0),
      })),
      electricityPriceTrend: records.map((record) => ({
        label: formatDay(record.timestamp),
        price: round(record.electricityPrice * 100, 1),
      })),
      weeklyEnergyUsage: buildWeeklyUsage(records),
    },
    applianceHealth: buildApplianceHealth(latest),
    energySources: buildEnergySources(latest),
    liveMeterFeed: buildLiveMeterFeed(records),
  };
}

export async function getObservations(): Promise<ObservationsResponse> {
  const engine = new ObservationEngine();
  return engine.analyze(await readMeterData());
}

export function getPredictions() {
  return {
    generatedAt: new Date().toISOString(),
    status: 'placeholder',
    predictions: [
      { horizon: 'next-24-hours', expectedUsageKwh: 468, peakRisk: 'medium', confidence: 0.74 },
      { horizon: 'next-7-days', expectedUsageKwh: 3095, peakRisk: 'high', confidence: 0.68 },
    ],
  };
}

export async function getReasoning(): Promise<ReasoningResponse> {
  return generateReasoning();
}

export function getRecommendations() {
  return {
    status: 'placeholder',
    recommendations: [
      {
        id: 'rec-pre-cool',
        action: 'Pre-cool common areas before peak tariff hours.',
        rationale: 'Shift HVAC demand away from high-price periods while preserving comfort.',
        estimatedMonthlySavings: 1240,
        effort: 'medium',
      },
      {
        id: 'rec-lighting',
        action: 'Dim lighting by 15% in high-daylight zones.',
        rationale: 'Solar production indicates daylight availability during costly hours.',
        estimatedMonthlySavings: 410,
        effort: 'low',
      },
      {
        id: 'rec-ev-shift',
        action: 'Move EV charging to late evening off-peak windows.',
        rationale: 'Weekend and evening EV demand can avoid weekday peak price exposure.',
        estimatedMonthlySavings: 680,
        effort: 'low',
      },
    ],
  };
}

export function getSavings() {
  return {
    status: 'placeholder',
    baselineMonthlyCost: 33420,
    estimatedOptimizedCost: 28790,
    estimatedSavings: 4630,
    carbonReductionKg: 842,
  };
}

export function simulateWhatIf(request: WhatIfRequest) {
  return {
    status: 'placeholder',
    input: request,
    estimatedDailySavings: 126,
    estimatedDemandReductionKwh: 38,
    comfortRisk: request.temperatureSetpoint && request.temperatureSetpoint > 26 ? 'medium' : 'low',
    message: 'Simulation placeholder ready for future agent logic.',
  };
}

export function recordFeedback(request: FeedbackRequest) {
  return {
    status: 'accepted',
    storedIn: 'memory-placeholder',
    feedback: request,
    message: 'Feedback endpoint is ready to connect to a learning loop.',
  };
}

function sum(records: MeterDataRecord[], selector: (record: MeterDataRecord) => number) {
  return records.reduce((total, record) => total + selector(record), 0);
}

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function trend(current: number, previous: number) {
  const percent = previous === 0 ? 0 : ((current - previous) / previous) * 100;

  return {
    direction: percent >= 0 ? ('up' as const) : ('down' as const),
    percent: round(Math.abs(percent), 1),
  };
}

function formatDay(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}

function calculateEfficiencyScore(record: MeterDataRecord, solarRatio: number) {
  const loadScore = Math.max(0, 100 - (record.energyConsumed - 350) * 0.18);
  const batteryScore = record.batteryLevel * 0.22;
  const solarScore = solarRatio * 35;

  return Math.max(55, Math.min(98, Math.round(loadScore * 0.62 + batteryScore + solarScore)));
}

function buildHourlyConsumption(record: MeterDataRecord): ChartPoint[] {
  const profile = [0.48, 0.42, 0.38, 0.36, 0.4, 0.55, 0.76, 0.92, 1.08, 1.14, 1.18, 1.22, 1.28, 1.3, 1.26, 1.22, 1.16, 1.08, 0.98, 0.88, 0.78, 0.68, 0.58, 0.52];
  const profileTotal = profile.reduce((total, value) => total + value, 0);

  return profile.map((weight, hour) => ({
    label: `${String(hour).padStart(2, '0')}:00`,
    consumption: round((record.energyConsumed * weight) / profileTotal, 1),
  }));
}

function buildWeeklyUsage(records: MeterDataRecord[]): ChartPoint[] {
  const weeks = [records.slice(0, 7), records.slice(7, 14), records.slice(14, 21), records.slice(21, 30)];

  return weeks.map((week, index) => ({
    label: `Week ${index + 1}`,
    usage: Math.round(sum(week, (record) => record.energyConsumed)),
  }));
}

function applianceEntries(usage: ApplianceUsage): Array<[string, number]> {
  return [
    ['Air Conditioner', usage.hvac],
    ['Lights', usage.lighting],
    ['Refrigerator', usage.refrigeration],
    ['Equipment', usage.equipment],
    ['EV Charging', usage.evCharging],
  ];
}

function buildApplianceHealth(record: MeterDataRecord) {
  const appliances = [
    { name: 'Air Conditioner', currentUsage: record.applianceUsage.hvac, normalLimit: 230 },
    { name: 'Refrigerator', currentUsage: record.applianceUsage.refrigeration, normalLimit: 68 },
    { name: 'Washing Machine', currentUsage: record.applianceUsage.equipment * 0.18, normalLimit: 18 },
    { name: 'Water Heater', currentUsage: record.applianceUsage.equipment * 0.32, normalLimit: 34 },
    { name: 'Lights', currentUsage: record.applianceUsage.lighting, normalLimit: 66 },
    { name: 'Fans', currentUsage: record.applianceUsage.equipment * 0.22, normalLimit: 24 },
  ];

  return appliances.map((appliance) => {
    const loadPercent = Math.min(100, Math.round((appliance.currentUsage / appliance.normalLimit) * 76));
    const status: ApplianceHealthStatus = loadPercent > 88 ? 'Critical' : loadPercent > 68 ? 'High' : 'Normal';

    return {
      name: appliance.name,
      currentUsage: round(appliance.currentUsage, 1),
      status,
      loadPercent,
      estimatedDailyCost: round(appliance.currentUsage * record.electricityPrice, 2),
    };
  });
}

function buildEnergySources(record: MeterDataRecord) {
  const solar = Math.min(record.solarGeneration, record.energyConsumed);
  const battery = Math.min(record.batteryLevel * 0.9, record.energyConsumed * 0.18);
  const grid = Math.max(record.energyConsumed - solar - battery, 0);
  const total = grid + solar + battery;

  return [
    { name: 'Grid' as const, percentage: Math.round((grid / total) * 100) },
    { name: 'Solar' as const, percentage: Math.round((solar / total) * 100) },
    { name: 'Battery' as const, percentage: Math.round((battery / total) * 100) },
  ];
}

function buildLiveMeterFeed(records: MeterDataRecord[]): LiveMeterReading[] {
  return records.slice(-10).reverse().map((record, index) => {
    const voltage = 228 + ((record.occupancy + index) % 8);
    const current = round((record.energyConsumed / 24 / voltage) * 1000, 1);
    const status = current > 88 ? 'Watch' : record.temperature > 36 ? 'Elevated' : 'Stable';

    return {
      id: `meter-${record.timestamp}`,
      time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(record.timestamp)),
      units: round(record.energyConsumed / 24, 1),
      voltage,
      current,
      temperature: record.temperature,
      status,
    };
  });
}
