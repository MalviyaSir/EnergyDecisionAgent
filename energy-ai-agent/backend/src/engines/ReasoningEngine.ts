import type {
  AgentObservation,
  ApplianceUsage,
  MeterDataRecord,
  ObservationsResponse,
  ReasoningItem,
  ReasoningResponse,
  ReasoningSeverity,
} from '../../../shared/energy.js';

type MeterContext = {
  averageConsumption: number;
  peakRecord: MeterDataRecord;
  previousPeakRecord: MeterDataRecord;
  peakIncreasePercent: number;
  hottestRecord: MeterDataRecord;
  averageTemperature: number;
  highTemperatureDays: number;
  totalApplianceUsage: ApplianceUsage;
  totalApplianceEnergy: number;
  hvacSharePercent: number;
  nightLoadPercent: number;
  lowOccupancyHighUsageRecord: MeterDataRecord;
  lowestBatteryRecord: MeterDataRecord;
  averageSolarRatio: number;
  averageGridRatio: number;
  highSolarHighGridRecord: MeterDataRecord;
  highPriceThreshold: number;
  highPriceAverageConsumption: number;
  highPricePeakRecord: MeterDataRecord;
  estimatedCo2Kg: number;
  gridUsageKwh: number;
  largestSpikeRecord: MeterDataRecord;
  largestSpikePreviousRecord: MeterDataRecord;
  largestSpikePercent: number;
};

type RuleResult = {
  rootCause: string;
  primaryCause: string;
  secondaryCause: string;
  supportingFactors: string[];
  evidence: string[];
  reasoning: string;
  confidence: number;
  severity: ReasoningSeverity;
  recommendedFocus: string;
};

const severityRank: Record<ReasoningSeverity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export class ReasoningEngine {
  analyze(records: MeterDataRecord[], observationsResponse: ObservationsResponse): ReasoningResponse {
    if (records.length < 2) {
      throw new Error('ReasoningEngine requires at least two meter data records.');
    }

    const context = buildMeterContext(records);
    const importantObservations = observationsResponse.observations.filter((observation) => observation.severity !== 'Positive');
    const reasoning = importantObservations
      .map((observation, index) => createReasoningItem(observation, context, index))
      .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.confidence - a.confidence);

    return {
      generatedAt: new Date().toISOString(),
      sourceObservationGeneratedAt: observationsResponse.generatedAt,
      summary: buildSummary(reasoning),
      reasoning,
      timeline: reasoning.map((item) => {
        const observation = importantObservations.find((candidate) => candidate.id === item.linkedObservationId);

        return {
          observationId: item.linkedObservationId,
          observationTitle: observation?.title ?? item.title,
          observationType: observation?.type ?? 'Observation',
          reasonId: item.id,
          reasonTitle: item.rootCause,
          severity: item.severity,
        };
      }),
    };
  }
}

function createReasoningItem(observation: AgentObservation, context: MeterContext, index: number): ReasoningItem {
  const result = reasonForObservation(observation, context);
  const id = `reason-${String(index + 1).padStart(3, '0')}`;

  return {
    id,
    linkedObservationId: observation.id,
    title: observation.title,
    rootCause: result.rootCause,
    rootCauseAnalysis: {
      primaryCause: result.primaryCause,
      secondaryCause: result.secondaryCause,
      supportingFactors: result.supportingFactors,
      evidence: result.evidence,
      confidence: result.confidence,
    },
    reasoning: result.reasoning,
    evidence: result.evidence,
    confidence: result.confidence,
    severity: result.severity,
    recommendedFocus: result.recommendedFocus,
  };
}

function reasonForObservation(observation: AgentObservation, context: MeterContext): RuleResult {
  switch (observation.type) {
    case 'Peak Usage':
      return reasonPeakUsage(observation, context);
    case 'High Consumption Appliance':
      return reasonHighAppliance(observation, context);
    case 'Night Consumption':
    case 'Idle Consumption':
      return reasonNightOrIdleLoad(observation, context);
    case 'Battery Warning':
      return reasonBattery(observation, context);
    case 'Low Solar Utilization':
      return reasonSolarUnderuse(observation, context);
    case 'High Electricity Price Usage':
      return reasonHighBill(observation, context);
    case 'Carbon Emission Warning':
      return reasonCarbon(observation, context);
    case 'Abnormal Spike':
      return reasonSpike(observation, context);
    default:
      return reasonGeneric(observation, context);
  }
}

function reasonPeakUsage(observation: AgentObservation, context: MeterContext): RuleResult {
  const evidence = [
    `Temperature reached ${context.hottestRecord.temperature}C`,
    `HVAC used ${round(context.totalApplianceUsage.hvac).toLocaleString()} kWh across the dataset`,
    `HVAC represents ${round(context.hvacSharePercent, 1)}% of appliance usage`,
    `Peak day consumption was ${context.peakRecord.energyConsumed} kWh`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Extended cooling demand',
    primaryCause: context.hvacSharePercent >= 35 ? 'Extended air-conditioner runtime' : 'Concentrated daytime building load',
    secondaryCause: `${context.highTemperatureDays} high-temperature days increased cooling pressure`,
    supportingFactors: [
      `Average temperature was ${round(context.averageTemperature, 1)}C`,
      `${round(context.peakIncreasePercent, 1)}% above the previous peak comparison day`,
      `${observation.affectedAppliance} is linked to the observation`,
    ],
    evidence,
    reasoning:
      `Usage peaked because cooling-sensitive load increased while the building was operating in hot conditions. ` +
      `The meter data shows high HVAC share and elevated temperature, so the deterministic rule attributes the peak to extended cooling demand rather than a random meter fluctuation.`,
    confidenceBoost: context.hvacSharePercent >= 35 && context.hottestRecord.temperature >= 35 ? 5 : 1,
    recommendedFocus: 'Optimize AC settings',
  });
}

function reasonHighAppliance(observation: AgentObservation, context: MeterContext): RuleResult {
  const dominant = dominantAppliance(context.totalApplianceUsage);
  const dominantValue = context.totalApplianceUsage[dominant.key];
  const share = (dominantValue / context.totalApplianceEnergy) * 100;
  const evidence = [
    `${dominant.label} used ${round(dominantValue).toLocaleString()} kWh`,
    `${dominant.label} accounts for ${round(share, 1)}% of appliance usage`,
    `Average daily consumption was ${round(context.averageConsumption, 1)} kWh`,
  ];

  return buildRuleResult({
    observation,
    rootCause: `${dominant.label} is the dominant controllable load`,
    primaryCause: `Sustained ${dominant.label.toLowerCase()} demand`,
    secondaryCause: 'Load is concentrated in one appliance category',
    supportingFactors: [`Observation identified ${observation.affectedAppliance}`, `Peak day reached ${context.peakRecord.energyConsumed} kWh`],
    evidence,
    reasoning:
      `The appliance totals show one category carrying the largest share of demand. ` +
      `Because that appliance share is materially higher than the remaining categories, the rule identifies it as the primary root cause behind the high consumption observation.`,
    confidenceBoost: share >= 35 ? 4 : 1,
    recommendedFocus: `Audit ${dominant.label.toLowerCase()} schedules`,
  });
}

function reasonNightOrIdleLoad(observation: AgentObservation, context: MeterContext): RuleResult {
  const evidence = [
    `Night load is ${round(context.nightLoadPercent, 1)}% of average demand`,
    `Low-occupancy record still consumed ${context.lowOccupancyHighUsageRecord.energyConsumed} kWh`,
    `Occupancy was ${context.lowOccupancyHighUsageRecord.occupancy}`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Standby devices or forgotten appliances',
    primaryCause: 'Persistent baseload during low-occupancy hours',
    secondaryCause: 'Equipment remains active when occupancy drops',
    supportingFactors: [
      `Refrigeration and equipment together used ${round(context.totalApplianceUsage.refrigeration + context.totalApplianceUsage.equipment).toLocaleString()} kWh`,
      `Observation time window: ${observation.time}`,
    ],
    evidence,
    reasoning:
      `Consumption remains high even when occupancy is low, which points to always-on loads rather than occupant-driven usage. ` +
      `The rule therefore attributes the observation to standby devices, refrigeration, equipment, or appliances left running overnight.`,
    confidenceBoost: context.nightLoadPercent > 58 ? 4 : 1,
    recommendedFocus: 'Reduce standby and overnight loads',
  });
}

function reasonBattery(observation: AgentObservation, context: MeterContext): RuleResult {
  const dischargeGap = Math.max(context.averageConsumption - context.lowestBatteryRecord.solarGeneration, 0);
  const evidence = [
    `Battery minimum was ${context.lowestBatteryRecord.batteryLevel}%`,
    `Solar generation on that day was ${context.lowestBatteryRecord.solarGeneration} kWh`,
    `Demand exceeded same-day solar by ${round(dischargeGap, 1)} kWh`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Heavy discharge with insufficient solar charging',
    primaryCause: 'Battery reserve fell below the operational threshold',
    secondaryCause: 'Solar charging did not keep pace with demand',
    supportingFactors: [
      `Average grid dependency is ${round(context.averageGridRatio * 100, 1)}%`,
      `Lowest battery occurred on ${formatDate(context.lowestBatteryRecord.timestamp)}`,
    ],
    evidence,
    reasoning:
      `The battery warning is explained by a demand and charging mismatch. ` +
      `The lowest battery record shows reserve falling while same-day solar contribution was not enough to cover consumption, indicating heavy discharge with insufficient replenishment.`,
    confidenceBoost: context.lowestBatteryRecord.batteryLevel < 20 ? 6 : 2,
    recommendedFocus: 'Protect battery reserve and solar charging windows',
  });
}

function reasonSolarUnderuse(observation: AgentObservation, context: MeterContext): RuleResult {
  const gridOnSolarDay = Math.max(context.highSolarHighGridRecord.energyConsumed - context.highSolarHighGridRecord.solarGeneration, 0);
  const evidence = [
    `Average solar offset is ${round(context.averageSolarRatio * 100, 1)}%`,
    `Average grid dependency is ${round(context.averageGridRatio * 100, 1)}%`,
    `A high-solar day still used ${round(gridOnSolarDay, 1)} kWh from grid`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Poor solar utilization or scheduling',
    primaryCause: 'High grid draw continued while solar was available',
    secondaryCause: 'Flexible loads are likely not aligned with generation hours',
    supportingFactors: [
      `Solar generation reached ${context.highSolarHighGridRecord.solarGeneration} kWh on ${formatDate(context.highSolarHighGridRecord.timestamp)}`,
      `Total grid usage after solar offset was ${round(context.gridUsageKwh).toLocaleString()} kWh`,
    ],
    evidence,
    reasoning:
      `Solar production exists in the dataset, but grid dependency remains high after the solar offset is applied. ` +
      `That combination indicates the building is not consuming enough flexible demand during solar availability or storage dispatch is not aligned with generation.`,
    confidenceBoost: context.averageSolarRatio > 0.12 && context.averageGridRatio > 0.65 ? 5 : 1,
    recommendedFocus: 'Shift flexible load into solar hours',
  });
}

function reasonHighBill(observation: AgentObservation, context: MeterContext): RuleResult {
  const exposure = ((context.highPriceAverageConsumption - context.averageConsumption) / context.averageConsumption) * 100;
  const evidence = [
    `Peak tariff threshold is $${context.highPriceThreshold.toFixed(2)}/kWh`,
    `High-tariff average usage is ${round(context.highPriceAverageConsumption, 1)} kWh`,
    `Usage during expensive tariff periods is ${round(exposure, 1)}% above average`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Large appliances running during peak price',
    primaryCause: 'High consumption overlaps expensive tariff periods',
    secondaryCause: `${dominantAppliance(context.highPricePeakRecord.applianceUsage).label} is the likely controllable contributor`,
    supportingFactors: [
      `Highest high-price day consumed ${context.highPricePeakRecord.energyConsumed} kWh`,
      `Electricity price on that day was $${context.highPricePeakRecord.electricityPrice.toFixed(2)}/kWh`,
    ],
    evidence,
    reasoning:
      `The billing risk comes from timing, not only total usage. ` +
      `The rule compares high-price days with the full-period average and finds heavier consumption during expensive tariffs, pointing to large appliance operation during peak price windows.`,
    confidenceBoost: exposure > 8 ? 5 : 1,
    recommendedFocus: 'Move large appliance schedules away from peak tariff',
  });
}

function reasonCarbon(observation: AgentObservation, context: MeterContext): RuleResult {
  const evidence = [
    `Grid usage after solar offset is ${round(context.gridUsageKwh).toLocaleString()} kWh`,
    `Estimated emissions are ${round(context.estimatedCo2Kg).toLocaleString()} kg CO2e`,
    `Average renewable offset is ${round(context.averageSolarRatio * 100, 1)}%`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Low renewable utilization',
    primaryCause: 'High grid dependency',
    secondaryCause: 'Solar contribution is not large enough to offset total demand',
    supportingFactors: [
      `Average grid dependency is ${round(context.averageGridRatio * 100, 1)}%`,
      `Carbon estimate uses grid usage after solar offset`,
    ],
    evidence,
    reasoning:
      `Carbon emissions are driven by the amount of demand served by the grid after renewable generation is subtracted. ` +
      `Because grid dependency remains high, the deterministic rule explains the emission warning as low renewable utilization relative to total consumption.`,
    confidenceBoost: context.averageGridRatio > 0.7 ? 5 : 2,
    recommendedFocus: 'Increase renewable self-consumption',
  });
}

function reasonSpike(observation: AgentObservation, context: MeterContext): RuleResult {
  const dominant = dominantAppliance(context.largestSpikeRecord.applianceUsage);
  const evidence = [
    `Consumption rose from ${context.largestSpikePreviousRecord.energyConsumed} kWh to ${context.largestSpikeRecord.energyConsumed} kWh`,
    `Largest increase was ${round(context.largestSpikePercent, 1)}%`,
    `${dominant.label} was the dominant load on the spike day`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Large appliance started or unusual activity',
    primaryCause: 'Sudden load increase exceeded the normal daily pattern',
    secondaryCause: `${dominant.label} likely drove the incremental demand`,
    supportingFactors: [
      `Spike day temperature was ${context.largestSpikeRecord.temperature}C`,
      `Spike day occupancy was ${context.largestSpikeRecord.occupancy}`,
    ],
    evidence,
    reasoning:
      `The day-over-day increase crossed the abnormal spike threshold, and the spike-day appliance mix shows a dominant load category. ` +
      `That pattern is most consistent with a large appliance start, operational event, or unusual activity rather than gradual baseline drift.`,
    confidenceBoost: context.largestSpikePercent > 30 ? 6 : 2,
    recommendedFocus: 'Inspect spike-day appliance activity',
  });
}

function reasonGeneric(observation: AgentObservation, context: MeterContext): RuleResult {
  const evidence = [
    `Observation impact: ${observation.impact}`,
    `Average consumption is ${round(context.averageConsumption, 1)} kWh`,
    `Peak consumption is ${context.peakRecord.energyConsumed} kWh`,
  ];

  return buildRuleResult({
    observation,
    rootCause: 'Measured operating pattern crossed the observation threshold',
    primaryCause: observation.affectedAppliance,
    secondaryCause: 'Consumption pattern differs from the local baseline',
    supportingFactors: [`Observation type: ${observation.type}`, `Observation time: ${observation.time}`],
    evidence,
    reasoning:
      `The observation was generated from smart meter behavior that crossed a deterministic threshold. ` +
      `The reasoning engine links that threshold crossing back to the affected system and supporting meter context.`,
    confidenceBoost: 0,
    recommendedFocus: `Review ${observation.affectedAppliance.toLowerCase()} behavior`,
  });
}

function buildRuleResult({
  observation,
  rootCause,
  primaryCause,
  secondaryCause,
  supportingFactors,
  evidence,
  reasoning,
  confidenceBoost,
  recommendedFocus,
}: {
  observation: AgentObservation;
  rootCause: string;
  primaryCause: string;
  secondaryCause: string;
  supportingFactors: string[];
  evidence: string[];
  reasoning: string;
  confidenceBoost: number;
  recommendedFocus: string;
}): RuleResult {
  const confidence = clamp(Math.round(observation.confidence + confidenceBoost), 70, 98);

  return {
    rootCause,
    primaryCause,
    secondaryCause,
    supportingFactors,
    evidence,
    reasoning,
    confidence,
    severity: normalizeSeverity(observation.severity),
    recommendedFocus,
  };
}

function buildMeterContext(records: MeterDataRecord[]): MeterContext {
  const averageConsumption = averageOf(records.map((record) => record.energyConsumed));
  const peakRecord = records.reduce((peak, record) => (record.energyConsumed > peak.energyConsumed ? record : peak), records[0]);
  const peakIndex = records.findIndex((record) => record.timestamp === peakRecord.timestamp);
  const previousPeakRecord = records[Math.max(peakIndex - 1, 0)];
  const peakIncreasePercent = percentageChange(peakRecord.energyConsumed, previousPeakRecord.energyConsumed);
  const hottestRecord = records.reduce((hottest, record) => (record.temperature > hottest.temperature ? record : hottest), records[0]);
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
  const lowOccupancyRecords = records.filter((record) => record.occupancy <= 2);
  const lowOccupancyHighUsageRecord = (lowOccupancyRecords.length > 0 ? lowOccupancyRecords : records).reduce((peak, record) =>
    record.energyConsumed > peak.energyConsumed ? record : peak,
  );
  const solarRecords = records.filter((record) => record.solarGeneration > 0);
  const highSolarHighGridRecord = solarRecords.reduce((selected, record) => {
    const selectedGrid = selected.energyConsumed - selected.solarGeneration;
    const recordGrid = record.energyConsumed - record.solarGeneration;
    return record.solarGeneration >= selected.solarGeneration && recordGrid >= selectedGrid ? record : selected;
  }, solarRecords[0] ?? records[0]);
  const highPriceThreshold = percentile(
    records.map((record) => record.electricityPrice),
    0.75,
  );
  const highPriceRecords = records.filter((record) => record.electricityPrice >= highPriceThreshold);
  const highPricePeakRecord = highPriceRecords.reduce((peak, record) => (record.energyConsumed > peak.energyConsumed ? record : peak), highPriceRecords[0]);
  const spike = records.slice(1).reduce(
    (largest, record, index) => {
      const previous = records[index];
      const percent = percentageChange(record.energyConsumed, previous.energyConsumed);
      return percent > largest.percent ? { record, previous, percent } : largest;
    },
    { record: records[1], previous: records[0], percent: percentageChange(records[1].energyConsumed, records[0].energyConsumed) },
  );
  const gridUsageKwh = records.reduce((total, record) => total + Math.max(record.energyConsumed - record.solarGeneration, 0), 0);
  const averageSolarRatio = averageOf(solarRecords.map((record) => record.solarGeneration / record.energyConsumed));

  return {
    averageConsumption,
    peakRecord,
    previousPeakRecord,
    peakIncreasePercent,
    hottestRecord,
    averageTemperature: averageOf(records.map((record) => record.temperature)),
    highTemperatureDays: records.filter((record) => record.temperature >= 35).length,
    totalApplianceUsage,
    totalApplianceEnergy,
    hvacSharePercent: (totalApplianceUsage.hvac / totalApplianceEnergy) * 100,
    nightLoadPercent: calculateNightLoadPercent(records),
    lowOccupancyHighUsageRecord,
    lowestBatteryRecord: records.reduce((lowest, record) => (record.batteryLevel < lowest.batteryLevel ? record : lowest), records[0]),
    averageSolarRatio,
    averageGridRatio: averageOf(solarRecords.map((record) => Math.max(record.energyConsumed - record.solarGeneration, 0) / record.energyConsumed)),
    highSolarHighGridRecord,
    highPriceThreshold,
    highPriceAverageConsumption: averageOf(highPriceRecords.map((record) => record.energyConsumed)),
    highPricePeakRecord,
    estimatedCo2Kg: gridUsageKwh * 0.42,
    gridUsageKwh,
    largestSpikeRecord: spike.record,
    largestSpikePreviousRecord: spike.previous,
    largestSpikePercent: spike.percent,
  };
}

function buildSummary(reasoning: ReasoningItem[]) {
  const averageConfidence = reasoning.length === 0 ? 0 : Math.round(averageOf(reasoning.map((item) => item.confidence)));
  const highestImpact = reasoning[0];

  return {
    reasoningGenerated: reasoning.length,
    criticalCauses: reasoning.filter((item) => item.severity === 'Critical').length,
    averageConfidence,
    highestImpactCause: highestImpact?.rootCause ?? 'No high-impact cause detected',
    overallExplainabilityScore: clamp(Math.round(averageConfidence * 0.82 + reasoning.length * 1.8), 0, 98),
  };
}

function calculateNightLoadPercent(records: MeterDataRecord[]) {
  const nightWeight = 0.48 + 0.42 + 0.38 + 0.36 + 0.4 + 0.55 + 0.52;
  const profileTotal = [
    0.48, 0.42, 0.38, 0.36, 0.4, 0.55, 0.76, 0.92, 1.08, 1.14, 1.18, 1.22, 1.28, 1.3, 1.26, 1.22, 1.16,
    1.08, 0.98, 0.88, 0.78, 0.68, 0.58, 0.52,
  ].reduce((total, value) => total + value, 0);
  const averageNight = averageOf(records.map((record) => (record.energyConsumed * nightWeight) / profileTotal / 7));
  const averageHourly = averageOf(records.map((record) => record.energyConsumed / 24));

  return (averageNight / averageHourly) * 100;
}

function dominantAppliance(usage: ApplianceUsage) {
  const names: Record<keyof ApplianceUsage, string> = {
    hvac: 'Air Conditioner',
    lighting: 'Lighting',
    refrigeration: 'Refrigeration',
    equipment: 'Equipment',
    evCharging: 'EV Charging',
  };
  const [key] = Object.entries(usage).sort((a, b) => b[1] - a[1])[0] as [keyof ApplianceUsage, number];

  return { key, label: names[key] };
}

function normalizeSeverity(severity: AgentObservation['severity']): ReasoningSeverity {
  return severity === 'Positive' ? 'Low' : severity;
}

function averageOf(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function percentile(values: number[], target: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * target)] ?? sorted.at(-1) ?? 0;
}

function percentageChange(current: number, previous: number) {
  return previous === 0 ? 0 : ((current - previous) / previous) * 100;
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
