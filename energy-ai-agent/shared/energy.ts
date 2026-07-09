export type ApplianceUsage = {
  hvac: number;
  lighting: number;
  refrigeration: number;
  equipment: number;
  evCharging: number;
};

export type MeterDataRecord = {
  timestamp: string;
  energyConsumed: number;
  temperature: number;
  humidity: number;
  occupancy: number;
  solarGeneration: number;
  batteryLevel: number;
  applianceUsage: ApplianceUsage;
  electricityPrice: number;
};

export type AgentObservation = {
  id: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | 'Positive';
  type: string;
  title: string;
  description: string;
  confidence: number;
  affectedAppliance: string;
  time: string;
  impact: string;
  timestamp: string;
};

export type ObservationSummary = {
  observationsGenerated: number;
  critical: number;
  warnings: number;
  positive: number;
  overallHealthScore: number;
};

export type ObservationsResponse = {
  generatedAt: string;
  overallStatus: 'Excellent' | 'Good' | 'Watch' | 'Needs Attention';
  summary: ObservationSummary;
  observations: AgentObservation[];
};

export type Prediction = {
  horizon: string;
  expectedUsageKwh: number;
  peakRisk: 'low' | 'medium' | 'high';
  confidence: number;
};

export type Recommendation = {
  id: string;
  action: string;
  rationale: string;
  estimatedMonthlySavings: number;
  effort: 'low' | 'medium' | 'high';
};

export type WhatIfRequest = {
  temperatureSetpoint?: number;
  shiftEvCharging?: boolean;
  reduceLightingPercent?: number;
  batteryReservePercent?: number;
};

export type FeedbackRequest = {
  recommendationId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
};

export type Trend = {
  direction: 'up' | 'down';
  percent: number;
};

export type DashboardKpi = {
  id:
    | 'currentPowerUsage'
    | 'todayConsumption'
    | 'estimatedMonthlyBill'
    | 'solarGeneration'
    | 'batteryLevel'
    | 'energyEfficiencyScore';
  label: string;
  value: number;
  unit: string;
  trend: Trend;
};

export type ChartPoint = {
  label: string;
  consumption?: number;
  solar?: number;
  grid?: number;
  price?: number;
  usage?: number;
};

export type ApplianceHealthStatus = 'Normal' | 'High' | 'Critical';

export type ApplianceHealth = {
  name: string;
  currentUsage: number;
  status: ApplianceHealthStatus;
  loadPercent: number;
  estimatedDailyCost: number;
};

export type EnergySource = {
  name: 'Grid' | 'Solar' | 'Battery';
  percentage: number;
};

export type LiveMeterReading = {
  id: string;
  time: string;
  units: number;
  voltage: number;
  current: number;
  temperature: number;
  status: 'Stable' | 'Elevated' | 'Watch';
};

export type SmartDashboardResponse = {
  generatedAt: string;
  kpis: DashboardKpi[];
  charts: {
    hourlyConsumption: ChartPoint[];
    dailyConsumption: ChartPoint[];
    applianceConsumption: ChartPoint[];
    solarVsGridUsage: ChartPoint[];
    electricityPriceTrend: ChartPoint[];
    weeklyEnergyUsage: ChartPoint[];
  };
  applianceHealth: ApplianceHealth[];
  energySources: EnergySource[];
  liveMeterFeed: LiveMeterReading[];
};
