import type {
  AgentObservation,
  ApplianceUsage,
  DecisionRecommendation,
  MeterDataRecord,
  ObservationsResponse,
  RecommendationDifficulty,
  RecommendationImpact,
  RecommendationPriorityLabel,
  RecommendationRisk,
  RecommendationsResponse,
  ReasoningItem,
  ReasoningResponse,
} from '../../../shared/energy.js';

type DecisionContext = {
  records: MeterDataRecord[];
  observations: AgentObservation[];
  reasoning: ReasoningItem[];
  averagePrice: number;
  peakPrice: number;
  averageConsumption: number;
  totalConsumption: number;
  totalApplianceUsage: ApplianceUsage;
  totalApplianceEnergy: number;
  applianceShares: ApplianceUsage;
  latest: MeterDataRecord;
  lowestBattery: MeterDataRecord;
  averageSolarRatio: number;
  averageGridRatio: number;
  nightLoadPercent: number;
};

type RecommendationDraft = Omit<DecisionRecommendation, 'id' | 'priority' | 'priorityLabel' | 'priorityScore'> & {
  baseScore: number;
};

const difficultyScore: Record<RecommendationDifficulty, number> = {
  Easy: 18,
  Moderate: 10,
  Hard: 4,
};

const impactScore: Record<RecommendationImpact, number> = {
  High: 28,
  Medium: 18,
  Low: 10,
};

const riskPenalty: Record<RecommendationRisk, number> = {
  Low: 0,
  Medium: 5,
  High: 12,
};

export class DecisionEngine {
  analyze(records: MeterDataRecord[], observationsResponse: ObservationsResponse, reasoningResponse: ReasoningResponse): RecommendationsResponse {
    if (records.length < 2) {
      throw new Error('DecisionEngine requires at least two meter data records.');
    }

    const context = buildDecisionContext(records, observationsResponse, reasoningResponse);
    const drafts = [
      decideAcSetpoint(context),
      decidePeakShift(context),
      decideNightStandby(context),
      decideBatterySolarCharge(context),
      decideSolarScheduling(context),
      decideGridDependency(context),
      decideTariffWashingSchedule(context),
      decideWaterHeaterRuntime(context),
      decideRefrigeratorCheck(context),
      decideLedLighting(context),
    ].filter((draft): draft is RecommendationDraft => draft !== null);

    const recommendations = drafts
      .map((draft) => ({
        ...draft,
        priorityScore: calculatePriorityScore(draft),
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore || b.estimatedSavings - a.estimatedSavings || b.confidence - a.confidence)
      .map((draft, index) => ({
        id: `rec-${String(index + 1).padStart(3, '0')}`,
        priority: index + 1,
        priorityLabel: priorityLabel(draft.priorityScore),
        ...draft,
      }));

    return {
      generatedAt: new Date().toISOString(),
      sourceReasoningGeneratedAt: reasoningResponse.generatedAt,
      summary: buildSummary(recommendations),
      recommendations,
    };
  }
}

function decideAcSetpoint(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['cooling', 'air-conditioner', 'air conditioner', 'hvac']);
  const hvacShare = context.applianceShares.hvac;

  if (!linkedReasoning || hvacShare < 30) {
    return null;
  }

  const energySaved = context.totalApplianceUsage.hvac * 0.07;

  return createDraft({
    context,
    linkedReasoning,
    title: `Increase AC temperature from the current cooling setpoint to 24C`,
    reason: `Air Conditioner represents ${round(hvacShare, 1)}% of appliance consumption while ${linkedReasoning.rootCause.toLowerCase()} is the linked cause.`,
    expectedImpact: 'High',
    estimatedEnergySaved: energySaved,
    difficulty: 'Easy',
    implementationTime: '1 minute',
    risk: 'Low',
    currentSituation: `Cooling load used ${round(context.totalApplianceUsage.hvac).toLocaleString()} kWh in the meter period.`,
    recommendedAction: 'Increase the AC cooling setpoint to 24C during occupied hours.',
    expectedImprovement: `Reduce cooling energy by about ${round(energySaved, 1)} kWh per month without equipment changes.`,
    baseScore: 16,
  });
}

function decidePeakShift(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['peak usage', 'sudden load', 'spike', 'peak']);
  const peakObservation = findObservation(context, ['Peak Usage', 'Abnormal Spike']);

  if (!linkedReasoning || !peakObservation) {
    return null;
  }

  const flexibleLoad = context.totalApplianceUsage.equipment + context.totalApplianceUsage.evCharging + context.totalApplianceUsage.lighting * 0.25;
  const energySaved = flexibleLoad * 0.05;

  return createDraft({
    context,
    linkedReasoning,
    title: `Shift heavy appliances away from ${peakObservation.time}`,
    reason: `${peakObservation.title} and ${linkedReasoning.rootCause.toLowerCase()} indicate controllable load is concentrated in peak windows.`,
    expectedImpact: 'High',
    estimatedEnergySaved: energySaved,
    difficulty: 'Moderate',
    implementationTime: '15 minutes',
    risk: 'Medium',
    currentSituation: `Peak observation window is ${peakObservation.time}.`,
    recommendedAction: 'Move heavy equipment, EV charging, and batch loads into off-peak operating hours.',
    expectedImprovement: `Reduce peak-window demand exposure by about ${round(energySaved, 1)} kWh per month.`,
    baseScore: 13,
  });
}

function decideNightStandby(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['standby', 'overnight', 'night', 'baseload']);

  if (!linkedReasoning || context.nightLoadPercent < 45) {
    return null;
  }

  const standbyBase = context.totalApplianceUsage.equipment * 0.16 + context.totalApplianceUsage.lighting * 0.08;
  const energySaved = standbyBase * 0.22;

  return createDraft({
    context,
    linkedReasoning,
    title: `Turn off standby appliances during low-occupancy hours`,
    reason: `Night load is ${round(context.nightLoadPercent, 1)}% of average demand, matching the reasoning cause: ${linkedReasoning.rootCause}.`,
    expectedImpact: 'Medium',
    estimatedEnergySaved: energySaved,
    difficulty: 'Easy',
    implementationTime: '5 minutes',
    risk: 'Low',
    currentSituation: `Low-occupancy periods still carry ${round(context.nightLoadPercent, 1)}% of average demand.`,
    recommendedAction: 'Switch off nonessential standby equipment and plug loads after operating hours.',
    expectedImprovement: `Cut overnight baseload by about ${round(energySaved, 1)} kWh per month.`,
    baseScore: 12,
  });
}

function decideBatterySolarCharge(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['battery', 'reserve', 'discharge']);

  if (!linkedReasoning || context.lowestBattery.batteryLevel > 35) {
    return null;
  }

  const energySaved = Math.max(context.averageConsumption * 0.08, 20);

  return createDraft({
    context,
    linkedReasoning,
    title: `Charge battery using solar during daytime`,
    reason: `Battery reserve dropped to ${context.lowestBattery.batteryLevel}% while solar offset averaged ${round(context.averageSolarRatio * 100, 1)}%.`,
    expectedImpact: 'Medium',
    estimatedEnergySaved: energySaved,
    difficulty: 'Moderate',
    implementationTime: '20 minutes',
    risk: 'Medium',
    currentSituation: `Lowest battery level was ${context.lowestBattery.batteryLevel}% on ${formatDate(context.lowestBattery.timestamp)}.`,
    recommendedAction: 'Prioritize daytime solar charging before evening discharge.',
    expectedImprovement: `Recover around ${round(energySaved, 1)} kWh of grid-exposed demand per month.`,
    baseScore: 11,
  });
}

function decideSolarScheduling(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['solar', 'renewable', 'grid dependency']);

  if (!linkedReasoning || context.averageSolarRatio < 0.1) {
    return null;
  }

  const flexibleLoad = context.totalApplianceUsage.equipment + context.totalApplianceUsage.evCharging;
  const energySaved = flexibleLoad * Math.min(0.14, context.averageGridRatio * 0.12);

  return createDraft({
    context,
    linkedReasoning,
    title: `Run flexible appliances when solar generation is high`,
    reason: `Solar offsets ${round(context.averageSolarRatio * 100, 1)}% of demand, but grid dependency remains ${round(context.averageGridRatio * 100, 1)}%.`,
    expectedImpact: 'High',
    estimatedEnergySaved: energySaved,
    difficulty: 'Moderate',
    implementationTime: '30 minutes',
    risk: 'Low',
    currentSituation: `Grid still supplies ${round(context.averageGridRatio * 100, 1)}% of demand after solar generation.`,
    recommendedAction: 'Schedule flexible appliances and EV charging into high-solar daytime windows.',
    expectedImprovement: `Shift about ${round(energySaved, 1)} kWh per month from grid supply to solar-backed use.`,
    baseScore: 14,
  });
}

function decideGridDependency(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['carbon', 'grid dependency', 'renewable']);

  if (!linkedReasoning || context.averageGridRatio < 0.6) {
    return null;
  }

  const energySaved = context.totalConsumption * 0.035;

  return createDraft({
    context,
    linkedReasoning,
    title: `Reduce grid dependency during high-demand periods`,
    reason: `Grid dependency is ${round(context.averageGridRatio * 100, 1)}%, which drives the linked cause: ${linkedReasoning.rootCause}.`,
    expectedImpact: 'High',
    estimatedEnergySaved: energySaved,
    difficulty: 'Moderate',
    implementationTime: '25 minutes',
    risk: 'Low',
    currentSituation: `Total demand is ${round(context.totalConsumption).toLocaleString()} kWh with high grid reliance.`,
    recommendedAction: 'Prioritize solar-backed loads and defer discretionary grid-heavy usage.',
    expectedImprovement: `Avoid about ${round(energySaved, 1)} kWh per month of grid-supplied energy.`,
    baseScore: 13,
  });
}

function decideTariffWashingSchedule(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['tariff', 'price', 'expensive']);

  if (!linkedReasoning || context.peakPrice <= context.averagePrice * 1.08) {
    return null;
  }

  const washingEnergy = context.totalApplianceUsage.equipment * 0.18;
  const energySaved = washingEnergy * 0.18;

  return createDraft({
    context,
    linkedReasoning,
    title: `Schedule washing machine after peak tariff`,
    reason: `Peak tariff is $${context.peakPrice.toFixed(2)}/kWh versus an average of $${context.averagePrice.toFixed(2)}/kWh.`,
    expectedImpact: 'Medium',
    estimatedEnergySaved: energySaved,
    difficulty: 'Easy',
    implementationTime: '2 minutes',
    risk: 'Low',
    currentSituation: `Estimated washing load is ${round(washingEnergy, 1)} kWh in the meter period.`,
    recommendedAction: 'Run washing cycles after peak tariff periods instead of high-price windows.',
    expectedImprovement: `Move roughly ${round(energySaved, 1)} kWh per month away from expensive tariff exposure.`,
    baseScore: 12,
  });
}

function decideWaterHeaterRuntime(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['equipment', 'dominant', 'large appliance', 'peak']);
  const heaterEnergy = context.totalApplianceUsage.equipment * 0.32;
  const heaterShare = (heaterEnergy / context.totalApplianceEnergy) * 100;

  if (heaterShare < 5.5) {
    return null;
  }

  const energySaved = heaterEnergy * 0.12;

  return createDraft({
    context,
    linkedReasoning,
    title: `Limit water heater runtime by ${Math.max(15, Math.round(heaterShare * 3))} minutes per cycle`,
    reason: `Estimated water-heater load is ${round(heaterShare, 1)}% of tracked appliance consumption.`,
    expectedImpact: heaterShare >= 8 ? 'Medium' : 'Low',
    estimatedEnergySaved: energySaved,
    difficulty: 'Easy',
    implementationTime: '3 minutes',
    risk: 'Medium',
    currentSituation: `Water-heater runtime is estimated from equipment load at ${round(heaterEnergy, 1)} kWh.`,
    recommendedAction: 'Reduce heater runtime or use timer controls during noncritical periods.',
    expectedImprovement: `Save about ${round(energySaved, 1)} kWh per month from heating load.`,
    baseScore: 8,
  });
}

function decideRefrigeratorCheck(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['baseload', 'standby', 'dominant', 'night']);
  const refrigerationShare = context.applianceShares.refrigeration;

  if (refrigerationShare < 11) {
    return null;
  }

  const energySaved = context.totalApplianceUsage.refrigeration * 0.08;

  return createDraft({
    context,
    linkedReasoning,
    title: `Check refrigerator door seal and cooling setting`,
    reason: `Refrigeration represents ${round(refrigerationShare, 1)}% of appliance consumption and contributes to persistent baseload.`,
    expectedImpact: 'Low',
    estimatedEnergySaved: energySaved,
    difficulty: 'Easy',
    implementationTime: '10 minutes',
    risk: 'Low',
    currentSituation: `Refrigeration used ${round(context.totalApplianceUsage.refrigeration).toLocaleString()} kWh in the meter period.`,
    recommendedAction: 'Inspect door seals and adjust the cooling setting to the efficient operating range.',
    expectedImprovement: `Reduce refrigeration baseload by about ${round(energySaved, 1)} kWh per month.`,
    baseScore: 7,
  });
}

function decideLedLighting(context: DecisionContext): RecommendationDraft | null {
  const linkedReasoning = findReasoning(context, ['lighting', 'peak', 'standby', 'solar']);
  const lightingShare = context.applianceShares.lighting;

  if (lightingShare < 8.5) {
    return null;
  }

  const energySaved = context.totalApplianceUsage.lighting * 0.18;

  return createDraft({
    context,
    linkedReasoning,
    title: `Replace high-use lighting with LED lighting`,
    reason: `Lighting accounts for ${round(lightingShare, 1)}% of appliance consumption across the meter period.`,
    expectedImpact: 'Medium',
    estimatedEnergySaved: energySaved,
    difficulty: 'Moderate',
    implementationTime: '1-2 hours',
    risk: 'Low',
    currentSituation: `Lighting used ${round(context.totalApplianceUsage.lighting).toLocaleString()} kWh.`,
    recommendedAction: 'Replace high-use fixtures with LED lighting in the most active zones.',
    expectedImprovement: `Save about ${round(energySaved, 1)} kWh per month from lighting load.`,
    baseScore: 9,
  });
}

function createDraft({
  context,
  linkedReasoning,
  title,
  reason,
  expectedImpact,
  estimatedEnergySaved,
  difficulty,
  implementationTime,
  risk,
  currentSituation,
  recommendedAction,
  expectedImprovement,
  baseScore,
}: {
  context: DecisionContext;
  linkedReasoning?: ReasoningItem;
  title: string;
  reason: string;
  expectedImpact: RecommendationImpact;
  estimatedEnergySaved: number;
  difficulty: RecommendationDifficulty;
  implementationTime: string;
  risk: RecommendationRisk;
  currentSituation: string;
  recommendedAction: string;
  expectedImprovement: string;
  baseScore: number;
}): RecommendationDraft {
  const linkedConfidence = linkedReasoning?.confidence ?? 78;
  const confidence = clamp(Math.round(linkedConfidence - riskPenalty[risk] * 0.4 + difficultyScore[difficulty] * 0.25), 70, 98);
  const tariffFactor = expectedImpact === 'High' ? context.peakPrice : context.averagePrice;
  const estimatedSavings = Math.max(1, Math.round(estimatedEnergySaved * tariffFactor));

  return {
    title,
    reason,
    expectedImpact,
    estimatedSavings,
    estimatedEnergySaved: round(estimatedEnergySaved, 1),
    difficulty,
    implementationTime,
    confidence,
    risk,
    linkedReasoning: linkedReasoning?.id ?? 'unlinked',
    currentSituation,
    recommendedAction,
    expectedImprovement,
    baseScore,
  };
}

function calculatePriorityScore(draft: RecommendationDraft) {
  const savingsScore = Math.min(28, draft.estimatedSavings / 4);
  const confidenceScore = draft.confidence * 0.18;
  return Math.round(draft.baseScore + impactScore[draft.expectedImpact] + savingsScore + difficultyScore[draft.difficulty] + confidenceScore - riskPenalty[draft.risk]);
}

function priorityLabel(score: number): RecommendationPriorityLabel {
  if (score >= 72) {
    return 'Critical';
  }

  if (score >= 60) {
    return 'High';
  }

  if (score >= 46) {
    return 'Medium';
  }

  return 'Low';
}

function buildDecisionContext(records: MeterDataRecord[], observationsResponse: ObservationsResponse, reasoningResponse: ReasoningResponse): DecisionContext {
  const totalApplianceUsage = records.reduce(
    (total, record) => ({
      hvac: total.hvac + record.applianceUsage.hvac,
      lighting: total.lighting + record.applianceUsage.lighting,
      refrigeration: total.refrigeration + record.applianceUsage.refrigeration,
      equipment: total.equipment + record.applianceUsage.equipment,
      evCharging: total.evCharging + record.applianceUsage.evCharging,
    }),
    { hvac: 0, lighting: 0, refrigeration: 0, equipment: 0, evCharging: 0 },
  );
  const totalApplianceEnergy = Object.values(totalApplianceUsage).reduce((total, value) => total + value, 0);
  const solarRecords = records.filter((record) => record.solarGeneration > 0);

  return {
    records,
    observations: observationsResponse.observations,
    reasoning: reasoningResponse.reasoning,
    averagePrice: averageOf(records.map((record) => record.electricityPrice)),
    peakPrice: Math.max(...records.map((record) => record.electricityPrice)),
    averageConsumption: averageOf(records.map((record) => record.energyConsumed)),
    totalConsumption: sum(records, (record) => record.energyConsumed),
    totalApplianceUsage,
    totalApplianceEnergy,
    applianceShares: {
      hvac: (totalApplianceUsage.hvac / totalApplianceEnergy) * 100,
      lighting: (totalApplianceUsage.lighting / totalApplianceEnergy) * 100,
      refrigeration: (totalApplianceUsage.refrigeration / totalApplianceEnergy) * 100,
      equipment: (totalApplianceUsage.equipment / totalApplianceEnergy) * 100,
      evCharging: (totalApplianceUsage.evCharging / totalApplianceEnergy) * 100,
    },
    latest: records.at(-1) as MeterDataRecord,
    lowestBattery: records.reduce((lowest, record) => (record.batteryLevel < lowest.batteryLevel ? record : lowest), records[0]),
    averageSolarRatio: averageOf(solarRecords.map((record) => record.solarGeneration / record.energyConsumed)),
    averageGridRatio: averageOf(solarRecords.map((record) => Math.max(record.energyConsumed - record.solarGeneration, 0) / record.energyConsumed)),
    nightLoadPercent: calculateNightLoadPercent(records),
  };
}

function buildSummary(recommendations: DecisionRecommendation[]) {
  const estimatedMonthlySavings = sum(recommendations, (recommendation) => recommendation.estimatedSavings);

  return {
    recommendationsGenerated: recommendations.length,
    highPriority: recommendations.filter((recommendation) => ['Critical', 'High'].includes(recommendation.priorityLabel)).length,
    mediumPriority: recommendations.filter((recommendation) => recommendation.priorityLabel === 'Medium').length,
    lowPriority: recommendations.filter((recommendation) => recommendation.priorityLabel === 'Low').length,
    estimatedMonthlySavings,
    estimatedYearlySavings: estimatedMonthlySavings * 12,
    highestImpactRecommendation: recommendations[0]?.title ?? 'No recommendation generated',
    averageConfidence: recommendations.length === 0 ? 0 : Math.round(averageOf(recommendations.map((recommendation) => recommendation.confidence))),
  };
}

function findReasoning(context: DecisionContext, terms: string[]) {
  return context.reasoning.find((item) => {
    const searchable = [
      item.title,
      item.rootCause,
      item.reasoning,
      item.recommendedFocus,
      item.rootCauseAnalysis.primaryCause,
      item.rootCauseAnalysis.secondaryCause,
      ...item.evidence,
      ...item.rootCauseAnalysis.supportingFactors,
    ]
      .join(' ')
      .toLowerCase();

    return terms.some((term) => searchable.includes(term));
  });
}

function findObservation(context: DecisionContext, types: string[]) {
  return context.observations.find((observation) => types.includes(observation.type));
}

function calculateNightLoadPercent(records: MeterDataRecord[]) {
  const profile = [
    0.48, 0.42, 0.38, 0.36, 0.4, 0.55, 0.76, 0.92, 1.08, 1.14, 1.18, 1.22, 1.28, 1.3, 1.26, 1.22, 1.16, 1.08,
    0.98, 0.88, 0.78, 0.68, 0.58, 0.52,
  ];
  const nightWeight = profile[0] + profile[1] + profile[2] + profile[3] + profile[4] + profile[5] + profile[23];
  const profileTotal = sum(profile, (value) => value);
  const averageNight = averageOf(records.map((record) => (record.energyConsumed * nightWeight) / profileTotal / 7));
  const averageHourly = averageOf(records.map((record) => record.energyConsumed / 24));

  return (averageNight / averageHourly) * 100;
}

function averageOf(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return sum(values, (value) => value) / values.length;
}

function sum<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}
