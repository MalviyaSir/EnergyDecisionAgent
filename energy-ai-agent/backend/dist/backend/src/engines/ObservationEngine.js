const severityRank = {
    Critical: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Positive: 1,
};
const hourlyProfile = [
    0.48, 0.42, 0.38, 0.36, 0.4, 0.55, 0.76, 0.92, 1.08, 1.14, 1.18, 1.22, 1.28, 1.3, 1.26, 1.22, 1.16,
    1.08, 0.98, 0.88, 0.78, 0.68, 0.58, 0.52,
];
export class ObservationEngine {
    analyze(records) {
        if (records.length < 2) {
            throw new Error('ObservationEngine requires at least two meter data records.');
        }
        const hourly = buildHourlyPoints(records);
        const observations = [
            this.detectPeakUsageHours(hourly),
            this.detectHighConsumptionAppliance(records),
            ...this.detectAbnormalSpikes(records),
            this.detectHighPriceUsage(records),
            this.detectLowSolarUtilization(records),
            this.detectBatteryWarning(records),
            this.detectNightConsumption(hourly),
            this.detectIdleConsumption(hourly),
            this.detectCarbonEmissionWarning(records),
            this.detectPositiveEfficiency(records),
        ]
            .filter(Boolean)
            .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.confidence - a.confidence);
        const summary = {
            observationsGenerated: observations.length,
            critical: observations.filter((observation) => observation.severity === 'Critical').length,
            warnings: observations.filter((observation) => ['High', 'Medium'].includes(observation.severity)).length,
            positive: observations.filter((observation) => observation.severity === 'Positive').length,
            overallHealthScore: calculateHealthScore(observations),
        };
        return {
            generatedAt: new Date().toISOString(),
            overallStatus: statusFromScore(summary.overallHealthScore),
            summary,
            observations,
        };
    }
    detectPeakUsageHours(hourly) {
        const peak = hourly.reduce((highest, point) => (point.consumption > highest.consumption ? point : highest), hourly[0]);
        const average = averageOf(hourly.map((point) => point.consumption));
        const percentAboveAverage = ((peak.consumption - average) / average) * 100;
        return createObservation({
            id: `obs-peak-usage-${dateId(peak.record.timestamp)}-${peak.hour}`,
            type: 'Peak Usage',
            severity: severityFromPercent(percentAboveAverage, 55, 35, 18),
            title: `Peak usage concentrated around ${hourRange(peak.hour)}`,
            description: `Consumption reached ${round(peak.consumption, 1)} kWh, ${round(percentAboveAverage, 1)}% above the hourly baseline derived from the smart meter profile.`,
            confidence: clamp(72 + percentAboveAverage * 0.35, 76, 96),
            affectedAppliance: 'Air Conditioner',
            time: hourRange(peak.hour),
            impact: `${round(peak.consumption - average, 1)} kWh above baseline during the peak interval.`,
            timestamp: peak.record.timestamp,
        });
    }
    detectHighConsumptionAppliance(records) {
        const totals = records.reduce((accumulator, record) => {
            Object.entries(record.applianceUsage).forEach(([appliance, value]) => {
                accumulator[appliance] += value;
            });
            return accumulator;
        }, { hvac: 0, lighting: 0, refrigeration: 0, equipment: 0, evCharging: 0 });
        const [key, value] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
        const totalApplianceEnergy = Object.values(totals).reduce((total, current) => total + current, 0);
        const share = (value / totalApplianceEnergy) * 100;
        const appliance = applianceName(key);
        return createObservation({
            id: `obs-high-appliance-${key}`,
            type: 'High Consumption Appliance',
            severity: severityFromPercent(share, 45, 35, 25),
            title: `${appliance} is the dominant energy load`,
            description: `${appliance} used ${Math.round(value).toLocaleString()} kWh across the dataset, representing ${round(share, 1)}% of appliance-level consumption.`,
            confidence: clamp(70 + share * 0.5, 80, 98),
            affectedAppliance: appliance,
            time: 'All day',
            impact: `${round(share, 1)}% of tracked appliance consumption.`,
            timestamp: records.at(-1)?.timestamp ?? new Date().toISOString(),
        });
    }
    detectAbnormalSpikes(records) {
        return records
            .slice(1)
            .map((record, index) => {
            const previous = records[index];
            const increase = ((record.energyConsumed - previous.energyConsumed) / previous.energyConsumed) * 100;
            if (increase <= 20) {
                return null;
            }
            return createObservation({
                id: `obs-abnormal-spike-${dateId(record.timestamp)}`,
                type: 'Abnormal Spike',
                severity: severityFromPercent(increase, 35, 26, 20),
                title: `Consumption spiked by ${round(increase, 1)}%`,
                description: `Daily usage moved from ${previous.energyConsumed} kWh to ${record.energyConsumed} kWh, crossing the 20% spike threshold.`,
                confidence: clamp(75 + increase * 0.5, 84, 98),
                affectedAppliance: dominantAppliance(record.applianceUsage),
                time: formatDate(record.timestamp),
                impact: `${record.energyConsumed - previous.energyConsumed} kWh additional daily consumption.`,
                timestamp: record.timestamp,
            });
        })
            .filter((observation) => observation !== null);
    }
    detectHighPriceUsage(records) {
        const prices = records.map((record) => record.electricityPrice).sort((a, b) => a - b);
        const highPriceThreshold = prices[Math.floor(prices.length * 0.75)];
        const highPriceRecords = records.filter((record) => record.electricityPrice >= highPriceThreshold);
        const highPriceAverage = averageOf(highPriceRecords.map((record) => record.energyConsumed));
        const overallAverage = averageOf(records.map((record) => record.energyConsumed));
        const exposure = ((highPriceAverage - overallAverage) / overallAverage) * 100;
        const highest = highPriceRecords.reduce((peak, record) => (record.energyConsumed > peak.energyConsumed ? record : peak), highPriceRecords[0]);
        return createObservation({
            id: 'obs-high-price-usage',
            type: 'High Electricity Price Usage',
            severity: severityFromPercent(exposure, 14, 8, 2),
            title: `Heavy usage overlaps expensive tariff periods`,
            description: `On high-price days above $${highPriceThreshold.toFixed(2)}/kWh, average consumption is ${round(highPriceAverage, 1)} kWh versus ${round(overallAverage, 1)} kWh overall.`,
            confidence: clamp(76 + Math.abs(exposure) * 1.2, 78, 95),
            affectedAppliance: dominantAppliance(highest.applianceUsage),
            time: 'Peak tariff days',
            impact: `${round(Math.max(exposure, 0), 1)}% higher usage during expensive tariff windows.`,
            timestamp: highest.timestamp,
        });
    }
    detectLowSolarUtilization(records) {
        const solarDays = records.filter((record) => record.solarGeneration > 0);
        const latest = records.at(-1);
        const averageSolarRatio = averageOf(solarDays.map((record) => record.solarGeneration / record.energyConsumed));
        const averageGridRatio = averageOf(solarDays.map((record) => (record.energyConsumed - record.solarGeneration) / record.energyConsumed));
        const severity = averageSolarRatio > 0.18 && averageGridRatio > 0.68 ? 'Medium' : 'Low';
        return createObservation({
            id: 'obs-low-solar-utilization',
            type: 'Low Solar Utilization',
            severity,
            title: `Grid reliance remains high despite solar generation`,
            description: `Solar is available on ${solarDays.length} days, but the building still draws ${round(averageGridRatio * 100, 1)}% of its energy from the grid on average.`,
            confidence: clamp(72 + averageGridRatio * 25, 78, 94),
            affectedAppliance: 'Grid Supply',
            time: 'Daylight operating hours',
            impact: `${round(averageSolarRatio * 100, 1)}% average solar offset against total consumption.`,
            timestamp: latest.timestamp,
        });
    }
    detectBatteryWarning(records) {
        const lowest = records.reduce((minimum, record) => (record.batteryLevel < minimum.batteryLevel ? record : minimum), records[0]);
        const isBelowCritical = lowest.batteryLevel < 20;
        return createObservation({
            id: 'obs-battery-warning',
            type: 'Battery Warning',
            severity: isBelowCritical ? 'Critical' : lowest.batteryLevel < 35 ? 'Medium' : 'Positive',
            title: isBelowCritical ? `Battery dropped below reserve threshold` : `Battery stayed above critical reserve`,
            description: isBelowCritical
                ? `Battery level reached ${lowest.batteryLevel}%, below the 20% operational reserve threshold.`
                : `The lowest observed battery level was ${lowest.batteryLevel}%, so the system avoided the 20% critical reserve threshold.`,
            confidence: isBelowCritical ? 96 : 88,
            affectedAppliance: 'Battery Storage',
            time: formatDate(lowest.timestamp),
            impact: isBelowCritical ? 'Backup capacity risk during peak demand.' : 'Storage reserve remained available during the monitored period.',
            timestamp: lowest.timestamp,
        });
    }
    detectNightConsumption(hourly) {
        const nightPoints = hourly.filter((point) => point.hour >= 23 || point.hour <= 5);
        const nightAverage = averageOf(nightPoints.map((point) => point.consumption));
        const overallAverage = averageOf(hourly.map((point) => point.consumption));
        const nightRatio = nightAverage / overallAverage;
        const highestNight = nightPoints.reduce((peak, point) => (point.consumption > peak.consumption ? point : peak), nightPoints[0]);
        return createObservation({
            id: 'obs-night-consumption',
            type: 'Night Consumption',
            severity: nightRatio > 0.72 ? 'High' : nightRatio > 0.58 ? 'Medium' : 'Low',
            title: `Night load is ${round(nightRatio * 100, 1)}% of average hourly demand`,
            description: `Between 11PM and 5AM, estimated consumption averages ${round(nightAverage, 1)} kWh per hour while occupancy is expected to be minimal.`,
            confidence: clamp(70 + nightRatio * 28, 78, 93),
            affectedAppliance: 'Baseload Equipment',
            time: '23:00-05:00',
            impact: `${round(nightAverage * 7, 1)} kWh estimated overnight load per monitored day.`,
            timestamp: highestNight.record.timestamp,
        });
    }
    detectIdleConsumption(hourly) {
        const idlePoints = hourly.filter((point) => point.occupancy === 0);
        const averageIdle = averageOf(idlePoints.map((point) => point.consumption));
        const averageActive = averageOf(hourly.filter((point) => point.occupancy > 0).map((point) => point.consumption));
        const ratio = averageIdle / averageActive;
        const highestIdle = idlePoints.reduce((peak, point) => (point.consumption > peak.consumption ? point : peak), idlePoints[0]);
        return createObservation({
            id: 'obs-idle-consumption',
            type: 'Idle Consumption',
            severity: ratio > 0.58 ? 'High' : ratio > 0.42 ? 'Medium' : 'Low',
            title: `Standby load persists during zero-occupancy hours`,
            description: `Estimated zero-occupancy periods still draw ${round(averageIdle, 1)} kWh per hour, equal to ${round(ratio * 100, 1)}% of active-hour demand.`,
            confidence: clamp(72 + ratio * 25, 78, 93),
            affectedAppliance: 'Standby Loads',
            time: '23:00-05:00',
            impact: `${round(averageIdle * idlePoints.length, 1)} kWh estimated standby consumption across the month.`,
            timestamp: highestIdle.record.timestamp,
        });
    }
    detectCarbonEmissionWarning(records) {
        const gridEmissionFactorKgPerKwh = 0.42;
        const totalGridUsage = records.reduce((total, record) => total + Math.max(record.energyConsumed - record.solarGeneration, 0), 0);
        const estimatedCo2 = totalGridUsage * gridEmissionFactorKgPerKwh;
        const threshold = records.length * 135;
        return createObservation({
            id: 'obs-carbon-emission-warning',
            type: 'Carbon Emission Warning',
            severity: estimatedCo2 > threshold ? 'High' : estimatedCo2 > threshold * 0.82 ? 'Medium' : 'Low',
            title: `Estimated CO2 emissions reached ${Math.round(estimatedCo2).toLocaleString()} kg`,
            description: `Grid-supplied energy produced an estimated ${Math.round(estimatedCo2).toLocaleString()} kg CO2e using a ${gridEmissionFactorKgPerKwh} kg/kWh emission factor.`,
            confidence: 86,
            affectedAppliance: 'Grid Supply',
            time: 'Monthly total',
            impact: `${Math.round(totalGridUsage).toLocaleString()} kWh grid usage after solar offset.`,
            timestamp: records.at(-1)?.timestamp ?? new Date().toISOString(),
        });
    }
    detectPositiveEfficiency(records) {
        const latest = records.at(-1);
        const previous = records.at(-2);
        const latestNet = latest.energyConsumed - latest.solarGeneration;
        const previousNet = previous.energyConsumed - previous.solarGeneration;
        const improvement = ((previousNet - latestNet) / previousNet) * 100;
        const normalizedImprovement = improvement > 0 ? improvement : Math.abs(improvement) * 0.35;
        return createObservation({
            id: 'obs-positive-efficiency',
            type: 'Positive Observation',
            severity: 'Positive',
            title: improvement > 0
                ? `Energy efficiency improved by ${round(improvement, 1)}% compared to yesterday`
                : `Solar contribution is holding steady despite demand pressure`,
            description: improvement > 0
                ? `Net grid demand dropped from ${round(previousNet, 1)} kWh to ${round(latestNet, 1)} kWh after accounting for solar generation.`
                : `The latest day maintained ${round((latest.solarGeneration / latest.energyConsumed) * 100, 1)}% solar offset while demand remained elevated.`,
            confidence: clamp(78 + normalizedImprovement, 82, 94),
            affectedAppliance: improvement > 0 ? 'Whole Building' : 'Solar Generation',
            time: formatDate(latest.timestamp),
            impact: improvement > 0 ? `${round(previousNet - latestNet, 1)} kWh lower net grid demand.` : `${latest.solarGeneration} kWh generated locally.`,
            timestamp: latest.timestamp,
        });
    }
}
function createObservation(observation) {
    return {
        ...observation,
        confidence: Math.round(observation.confidence),
    };
}
function buildHourlyPoints(records) {
    const profileTotal = hourlyProfile.reduce((total, value) => total + value, 0);
    return records.flatMap((record) => hourlyProfile.map((weight, hour) => ({
        record,
        hour,
        consumption: (record.energyConsumed * weight) / profileTotal,
        occupancy: hour >= 23 || hour <= 5 ? 0 : Math.round(record.occupancy * occupancyFactor(hour)),
    })));
}
function occupancyFactor(hour) {
    if (hour < 7 || hour > 21) {
        return 0;
    }
    if (hour < 9 || hour > 18) {
        return 0.35;
    }
    return 0.92;
}
function averageOf(values) {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((total, value) => total + value, 0) / values.length;
}
function round(value, decimals = 0) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}
function severityFromPercent(value, criticalThreshold, highThreshold, mediumThreshold) {
    if (value >= criticalThreshold) {
        return 'Critical';
    }
    if (value >= highThreshold) {
        return 'High';
    }
    if (value >= mediumThreshold) {
        return 'Medium';
    }
    return 'Low';
}
function applianceName(key) {
    const names = {
        hvac: 'Air Conditioner',
        lighting: 'Lights',
        refrigeration: 'Refrigerator',
        equipment: 'Equipment',
        evCharging: 'EV Charging',
    };
    return names[key];
}
function dominantAppliance(usage) {
    const [key] = Object.entries(usage).sort((a, b) => b[1] - a[1])[0];
    return applianceName(key);
}
function hourRange(hour) {
    const endHour = (hour + 1) % 24;
    return `${String(hour).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:00`;
}
function dateId(timestamp) {
    return timestamp.slice(0, 10);
}
function formatDate(timestamp) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}
function calculateHealthScore(observations) {
    const penalty = observations.reduce((total, observation) => {
        if (observation.severity === 'Critical') {
            return total + 12;
        }
        if (observation.severity === 'High') {
            return total + 8;
        }
        if (observation.severity === 'Medium') {
            return total + 4;
        }
        if (observation.severity === 'Low') {
            return total + 1;
        }
        return total - 4;
    }, 0);
    return Math.max(45, Math.min(98, 100 - penalty));
}
function statusFromScore(score) {
    if (score >= 90) {
        return 'Excellent';
    }
    if (score >= 78) {
        return 'Good';
    }
    if (score >= 64) {
        return 'Watch';
    }
    return 'Needs Attention';
}
