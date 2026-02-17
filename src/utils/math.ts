import { addMinutes } from 'date-fns';

export interface Dose {
    id: string;
    mg: number;
    timestamp: number; // Unix timestamp in ms
}

/**
 * Calculates the current caffeine level for a single dose.
 * Formula: CurrentMg = InitialMg * (0.5)^(ElapsedHours / HalfLifeHours)
 */
export const calculateDecay = (
    initialMg: number,
    elapsedHours: number,
    halfLifeHours: number
): number => {
    if (elapsedHours < 0) return 0; // Future dose has not been consumed yet
    return initialMg * Math.pow(0.5, elapsedHours / halfLifeHours);
};

/**
 * Calculates the total current caffeine level from multiple doses.
 */
export const calculateStackedCaffeine = (
    doses: Dose[],
    currentTime: number,
    halfLifeHours: number
): number => {
    let totalMg = 0;

    doses.forEach((dose) => {
        const elapsedHours = (currentTime - dose.timestamp) / (1000 * 60 * 60);
        if (elapsedHours >= 0) {
            totalMg += calculateDecay(dose.mg, elapsedHours, halfLifeHours);
        }
    });

    return Math.max(0, totalMg);
};

/**
 * Calculates the time when caffeine drops below the sleep threshold.
 * 
 * This is the SINGLE SOURCE OF TRUTH for clearance time.
 * All components (Dashboard, DetailedStats, WidgetPreview) must use this.
 * 
 * Steps forward in 5-minute increments for precision.
 * Returns the timestamp (ms) when safe, or null if already clear.
 */
export const calculateClearanceTime = (
    doses: Dose[],
    threshold: number,
    halfLifeHours: number,
    startTime: number = Date.now()
): number | null => {
    const currentLevel = calculateStackedCaffeine(doses, startTime, halfLifeHours);
    if (currentLevel <= threshold) return null; // Already clear

    let time = startTime;
    const maxTime = startTime + 48 * 60 * 60 * 1000; // 48h max search
    const step = 5 * 60 * 1000; // 5-minute precision

    while (time < maxTime) {
        time += step;
        const level = calculateStackedCaffeine(doses, time, halfLifeHours);
        if (level <= threshold) {
            return time;
        }
    }

    return maxTime;
};

/**
 * @deprecated Use calculateClearanceTime instead for consistency.
 * Kept for backward compatibility with SleepForecast component.
 */
export const calculateTimeToThreshold = (
    doses: Dose[],
    currentTotalMg: number,
    halfLifeHours: number,
    threshold: number,
    startTime: number = Date.now()
): number => {
    const result = calculateClearanceTime(doses, threshold, halfLifeHours, startTime);
    return result ?? startTime;
};

/**
 * Calculates alertness using a MULTIPLICATIVE pharmacodynamic model.
 * 
 * Key principle: Caffeine ALWAYS causes a visible spike, even at midnight.
 * Instead of "base - fatigue" (which can zero out), we use:
 *   Alertness = caffeineEffect × circadianModulator × fatiguePenalty × sleepQuality
 * 
 * Components:
 * 1. Caffeine Effect: Direct mapping from caffeine mg to alertness boost.
 *    Uses diminishing returns curve but always > 0 when caffeine present.
 * 
 * 2. Circadian Modulator (0.3 – 1.0): Simulates natural daily rhythm.
 *    Peaks ~6-8h after waking, dips at night but NEVER hits 0.
 *    Minimum 0.3 ensures 150mg at midnight → ~45 alertness (visible spike).
 * 
 * 3. Fatigue Penalty: After 14h awake, dampens alertness by 20%.
 *    Creates the "crash" feeling at end of day.
 * 
 * 4. Sleep Quality: Ceiling multiplier (Poor=0.6, Average=0.8, Great=1.0).
 * 
 * @returns Alertness value (0-120 scale, always ≥ 0 when caffeine > 0)
 */
export const calculateAlertness = (
    doses: Dose[],
    targetTime: number,
    halfLifeHours: number,
    wakeUpTime?: number,
    sleepQualityMultiplier: number = 1.0,
    _crashThreshold: number = 50 // Kept for backward-compat signature
): number => {
    // Default wake up time: 7 AM today
    const realToday = new Date(Date.now());
    realToday.setHours(7, 0, 0, 0);
    const defaultWakeUp = realToday.getTime();
    const actualWakeUp = wakeUpTime || defaultWakeUp;

    // Hours since waking up (can be negative if before wake-up)
    const hoursAwake = (targetTime - actualWakeUp) / (1000 * 60 * 60);

    // If before wake-up, assume sleeping — base natural alertness is very low
    if (hoursAwake < 0) {
        const caffeineLevel = calculateStackedCaffeine(doses, targetTime, halfLifeHours);
        // Even when sleeping, caffeine has a muted effect
        const baseSleep = 10;
        const caffeineEffect = 40 * (1 - Math.exp(-caffeineLevel / 100));
        return Math.min((baseSleep + caffeineEffect * 0.3) * sleepQualityMultiplier, 120 * sleepQualityMultiplier);
    }

    // === 1. CAFFEINE EFFECT ===
    // Direct pharmacological boost from caffeine in the bloodstream.
    // Uses a saturating curve: rapid boost at low doses, diminishing at high.
    // ~95mg (1 coffee) → ~55 points, ~200mg → ~75 points, ~400mg → ~90 points
    const caffeineLevel = calculateStackedCaffeine(doses, targetTime, halfLifeHours);
    const caffeineEffect = 100 * (1 - Math.exp(-caffeineLevel / 120));

    // === 2. CIRCADIAN MODULATOR (0.3 → 1.0) ===
    // Natural alertness rhythm across the day.
    // Peaks around 6-8 hours after waking (early afternoon).
    // Dips to minimum of 0.3 at ~16-18 hours awake (late night).
    // Uses cosine wave shifted to peak at hoursAwake=7.
    const circadianPhase = (hoursAwake - 7) * Math.PI / 9; // Period ~18h
    const rawCircadian = 0.5 + 0.5 * Math.cos(circadianPhase);
    const circadianModulator = 0.3 + 0.7 * rawCircadian; // Clamp to [0.3, 1.0]

    // === 3. NATURAL BASELINE ===
    // Even without caffeine, humans have some alertness while awake.
    // This gives the curve a base shape that caffeine modulates.
    const naturalBaseline = 50 * circadianModulator; // 15-50 depending on time

    // === 4. FATIGUE PENALTY ===
    // After 14+ hours awake, fatigue dampens everything more aggressively.
    // Creates the steep "crash" at end of day.
    let fatiguePenalty = 1.0;
    if (hoursAwake > 14) {
        // Ramps from 1.0 to 0.5 between hours 14-20
        fatiguePenalty = Math.max(0.5, 1.0 - (hoursAwake - 14) * 0.083);
    }

    // === 5. FINAL ALERTNESS ===
    // Combine: natural baseline + caffeine boost, scaled by circadian rhythm and fatigue
    const caffeineContribution = caffeineEffect * circadianModulator * fatiguePenalty;
    const rawAlertness = (naturalBaseline + caffeineContribution) * sleepQualityMultiplier;

    // Clamp to [0, 120 * sleepQuality]
    const maxAlertness = 120 * sleepQualityMultiplier;
    return Math.max(0, Math.min(rawAlertness, maxAlertness));
};

/**
 * Calculates alertness data points for charting alongside caffeine.
 */
export const calculateAlertnessData = (
    doses: Dose[],
    startTime: number,
    endTime: number,
    halfLifeHours: number,
    stepMs: number = 30 * 60 * 1000,
    sleepQualityMultiplier: number = 1.0
): { value: number; date: number }[] => {
    const dataPoints: { value: number; date: number }[] = [];

    for (let time = startTime; time <= endTime; time += stepMs) {
        const alertness = calculateAlertness(doses, time, halfLifeHours, undefined, sleepQualityMultiplier);
        dataPoints.push({
            value: parseFloat(alertness.toFixed(1)),
            date: time,
        });
    }

    return dataPoints;
};
