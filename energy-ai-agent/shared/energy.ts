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

export type ReasoningSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type RootCauseAnalysis = {
  primaryCause: string;
  secondaryCause: string;
  supportingFactors: string[];
  evidence: string[];
  confidence: number;
};

export type ReasoningItem = {
  id: string;
  linkedObservationId: string;
  title: string;
  rootCause: string;
  rootCauseAnalysis: RootCauseAnalysis;
  reasoning: string;
  evidence: string[];
  confidence: number;
  severity: ReasoningSeverity;
  recommendedFocus: string;
};

export type ReasoningSummary = {
  reasoningGenerated: number;
  criticalCauses: number;
  averageConfidence: number;
  highestImpactCause: string;
  overallExplainabilityScore: number;
};

export type ReasoningTimelineItem = {
  observationId: string;
  observationTitle: string;
  observationType: string;
  reasonId: string;
  reasonTitle: string;
  severity: ReasoningSeverity;
};

export type ReasoningResponse = {
  generatedAt: string;
  sourceObservationGeneratedAt: string;
  summary: ReasoningSummary;
  reasoning: ReasoningItem[];
  timeline: ReasoningTimelineItem[];
};

export type RecommendationPriorityLabel = 'Critical' | 'High' | 'Medium' | 'Low';

export type RecommendationImpact = 'High' | 'Medium' | 'Low';

export type RecommendationDifficulty = 'Easy' | 'Moderate' | 'Hard';

export type RecommendationRisk = 'Low' | 'Medium' | 'High';

export type DecisionRecommendation = {
  id: string;
  priority: number;
  priorityLabel: RecommendationPriorityLabel;
  priorityScore: number;
  title: string;
  reason: string;
  expectedImpact: RecommendationImpact;
  estimatedSavings: number;
  estimatedEnergySaved: number;
  difficulty: RecommendationDifficulty;
  implementationTime: string;
  confidence: number;
  risk: RecommendationRisk;
  linkedReasoning: string;
  currentSituation: string;
  recommendedAction: string;
  expectedImprovement: string;
};

export type RecommendationsSummary = {
  recommendationsGenerated: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  highestImpactRecommendation: string;
  averageConfidence: number;
};

export type RecommendationsResponse = {
  generatedAt: string;
  sourceReasoningGeneratedAt: string;
  summary: RecommendationsSummary;
  recommendations: DecisionRecommendation[];
};

export type Prediction = {
  horizon: string;
  expectedUsageKwh: number;
  peakRisk: 'low' | 'medium' | 'high';
  confidence: number;
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
