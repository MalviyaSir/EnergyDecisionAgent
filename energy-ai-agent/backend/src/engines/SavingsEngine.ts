import type {
  DecisionRecommendation,
  MeterDataRecord,
  RecommendationDifficulty,
  RecommendationRisk,
  RecommendationSavings,
  RecommendationsResponse,
  RoiCategory,
  SavingsResponse,
} from '../../../shared/energy.js';

type SavingsContext = {
  records: MeterDataRecord[];
  recommendationsResponse: RecommendationsResponse;
  currentMonthlyConsumption: number;
  averageElectricityPrice: number;
  renewableUsagePercent: number;
  gridEmissionFactorKgPerKwh: number;
};

const implementationBaseCost: Record<RecommendationDifficulty, number> = {
  Easy: 20,
  Moderate: 95,
  Hard: 240,
};

const riskMultiplier: Record<RecommendationRisk, number> = {
  Low: 1,
  Medium: 1.18,
  High: 1.42,
};

export class SavingsEngine {
  estimate(records: MeterDataRecord[], recommendationsResponse: RecommendationsResponse): SavingsResponse {
    if (records.length < 2) {
      throw new Error('SavingsEngine requires at least two meter data records.');
    }

    const context = buildContext(records, recommendationsResponse);
    const recommendationSavings = recommendationsResponse.recommendations.map((recommendation) => estimateRecommendationSavings(recommendation, context));
    const monthlySavings = sum(recommendationSavings, (item) => item.monthlySavings);
    const energySavedMonthly = sum(recommendationSavings, (item) => item.energySaved);
    const co2ReductionMonthly = sum(recommendationSavings, (item) => item.co2Reduction);
    const weightedRoiScore =
      monthlySavings === 0
        ? 0
        : Math.round(sum(recommendationSavings, (item) => item.roiScore * item.monthlySavings) / monthlySavings);
    const paybackMonths = calculatePortfolioPayback(recommendationsResponse.recommendations, monthlySavings);

    return {
      generatedAt: new Date().toISOString(),
      sourceRecommendationsGeneratedAt: recommendationsResponse.generatedAt,
      summary: {
        monthlySavings,
        yearlySavings: monthlySavings * 12,
        energySavedMonthly: round(energySavedMonthly, 1),
        energySavedYearly: round(energySavedMonthly * 12, 1),
        co2ReductionMonthly: round(co2ReductionMonthly, 1),
        co2ReductionYearly: round(co2ReductionMonthly * 12, 1),
        roiScore: weightedRoiScore,
        paybackPeriod: formatPayback(paybackMonths),
      },
      recommendationSavings,
      leaderboard: [...recommendationSavings].sort((a, b) => b.yearlySavings - a.yearlySavings).slice(0, 5),
      environmentalImpact: {
        treesEquivalent: Math.round((co2ReductionMonthly * 12) / 21.8),
        co2Reduction: round(co2ReductionMonthly * 12, 1),
        renewableUsagePercent: round(context.renewableUsagePercent, 1),
        energyEfficiencyImprovementPercent: round((energySavedMonthly / context.currentMonthlyConsumption) * 100, 1),
      },
      monthlyProjection: buildProjection(monthlySavings),
      savingsDistribution: buildDistribution(recommendationSavings, monthlySavings),
    };
  }
}

function estimateRecommendationSavings(recommendation: DecisionRecommendation, context: SavingsContext): RecommendationSavings {
  const boundedEnergySaved = Math.min(recommendation.estimatedEnergySaved, context.currentMonthlyConsumption * 0.18);
  const calculatedSavings = boundedEnergySaved * context.averageElectricityPrice;
  const monthlySavings = Math.max(1, Math.round((calculatedSavings + recommendation.estimatedSavings) / 2));
  const co2Reduction = boundedEnergySaved * context.gridEmissionFactorKgPerKwh;
  const investmentCost = implementationBaseCost[recommendation.difficulty] * riskMultiplier[recommendation.risk];
  const paybackMonths = monthlySavings === 0 ? 999 : investmentCost / monthlySavings;
  const roiScore = calculateRoiScore(monthlySavings, investmentCost, recommendation.confidence, recommendation.difficulty);

  return {
    recommendationId: recommendation.id,
    title: recommendation.title,
    monthlySavings,
    yearlySavings: monthlySavings * 12,
    energySaved: round(boundedEnergySaved, 1),
    yearlyEnergySaved: round(boundedEnergySaved * 12, 1),
    co2Reduction: round(co2Reduction, 1),
    yearlyCo2Reduction: round(co2Reduction * 12, 1),
    roi: roiCategory(roiScore),
    roiScore,
    confidence: recommendation.confidence,
    difficulty: recommendation.difficulty,
    paybackMonths: round(paybackMonths, 1),
  };
}

function buildContext(records: MeterDataRecord[], recommendationsResponse: RecommendationsResponse): SavingsContext {
  const currentMonthlyConsumption = sum(records, (record) => record.energyConsumed);
  const solarGeneration = sum(records, (record) => record.solarGeneration);

  return {
    records,
    recommendationsResponse,
    currentMonthlyConsumption,
    averageElectricityPrice: averageOf(records.map((record) => record.electricityPrice)),
    renewableUsagePercent: (solarGeneration / currentMonthlyConsumption) * 100,
    gridEmissionFactorKgPerKwh: 0.42,
  };
}

function calculateRoiScore(monthlySavings: number, investmentCost: number, confidence: number, difficulty: RecommendationDifficulty) {
  const monthlyReturnPercent = investmentCost === 0 ? 100 : (monthlySavings / investmentCost) * 100;
  const difficultyBonus = difficulty === 'Easy' ? 12 : difficulty === 'Moderate' ? 6 : 0;
  return clamp(Math.round(monthlyReturnPercent * 0.62 + confidence * 0.28 + difficultyBonus), 20, 98);
}

function roiCategory(score: number): RoiCategory {
  if (score >= 90) {
    return 'Excellent';
  }

  if (score >= 78) {
    return 'Very Good';
  }

  if (score >= 64) {
    return 'Good';
  }

  if (score >= 48) {
    return 'Moderate';
  }

  return 'Low';
}

function calculatePortfolioPayback(recommendations: DecisionRecommendation[], monthlySavings: number) {
  const implementationCost = sum(
    recommendations,
    (recommendation) => implementationBaseCost[recommendation.difficulty] * riskMultiplier[recommendation.risk],
  );

  return monthlySavings === 0 ? 999 : implementationCost / monthlySavings;
}

function formatPayback(months: number) {
  if (months < 0.5) {
    return '0 months';
  }

  if (months < 1.5) {
    return '1 month';
  }

  return `${Math.round(months)} months`;
}

function buildProjection(monthlySavings: number) {
  return Array.from({ length: 12 }).map((_, index) => ({
    month: `Month ${index + 1}`,
    cumulativeSavings: monthlySavings * (index + 1),
  }));
}

function buildDistribution(items: RecommendationSavings[], totalMonthlySavings: number) {
  return items.map((item) => ({
    recommendationId: item.recommendationId,
    title: item.title,
    value: item.monthlySavings,
    percentage: totalMonthlySavings === 0 ? 0 : round((item.monthlySavings / totalMonthlySavings) * 100, 1),
  }));
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
