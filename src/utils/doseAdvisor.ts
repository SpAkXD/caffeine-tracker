import { Dose, calculateAlertness, calculateClearanceTime, calculateStackedCaffeine } from './math';

export interface DoseRecommendation {
    mg: number;
    drinkAt: number; // Unix ms — when to drink
    predictedAlertness: number; // at target time, 0-120
    sleepPenaltyHours: number; // how many hours past bedtime clearance extends
    score: number; // higher is better
}

/**
 * Finds the top dose recommendations to hit a target alertness at a specific time.
 *
 * Search space: 30–300 mg in 10 mg steps × every 15 minutes from now to targetTime.
 * Scores each candidate on: closeness to target alertness + minimal sleep impact.
 */
export function recommendDoses(
    targetTime: number,
    targetAlertness: number,
    currentDoses: Dose[],
    halfLifeHours: number,
    sleepThresholdMg: number,
    bedtimeMs: number, // today's bedtime as unix ms
    now: number = Date.now()
): DoseRecommendation[] {
    const candidates: DoseRecommendation[] = [];
    const maxSearchMs = targetTime - now;

    if (maxSearchMs <= 0) return [];

    const MG_STEP = 10;
    const TIME_STEP_MS = 15 * 60 * 1000;

    for (let mg = 30; mg <= 300; mg += MG_STEP) {
        for (let offsetMs = 0; offsetMs <= maxSearchMs; offsetMs += TIME_STEP_MS) {
            const drinkAt = now + offsetMs;
            const simulated: Dose[] = [
                ...currentDoses,
                { id: '__sim__', mg, timestamp: drinkAt },
            ];

            const alertnessAtTarget = calculateAlertness(
                simulated,
                targetTime,
                halfLifeHours,
                undefined,
                1.0
            );

            const clearance = calculateClearanceTime(simulated, sleepThresholdMg, halfLifeHours, now);
            const clearanceMs = clearance ?? now;
            const sleepPenaltyHours = clearanceMs > bedtimeMs
                ? (clearanceMs - bedtimeMs) / (1000 * 60 * 60)
                : 0;

            const alertnessDelta = Math.abs(alertnessAtTarget - targetAlertness);
            const score = -alertnessDelta - sleepPenaltyHours * 8;

            candidates.push({
                mg,
                drinkAt,
                predictedAlertness: Math.round(alertnessAtTarget),
                sleepPenaltyHours: Math.round(sleepPenaltyHours * 10) / 10,
                score,
            });
        }
    }

    candidates.sort((a, b) => b.score - a.score);

    // Deduplicate: keep at most 1 candidate per mg value in top results
    const seen = new Set<number>();
    const top: DoseRecommendation[] = [];
    for (const c of candidates) {
        if (!seen.has(c.mg)) {
            seen.add(c.mg);
            top.push(c);
        }
        if (top.length >= 3) break;
    }

    return top;
}

/** Returns a human-readable "drink in X min / X hours" label. */
export function formatDrinkInLabel(drinkAt: number, now: number = Date.now()): string {
    const diffMin = Math.round((drinkAt - now) / 60_000);
    if (diffMin <= 0) return 'Right now';
    if (diffMin < 60) return `In ${diffMin} min`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m === 0 ? `In ${h}h` : `In ${h}h ${m}m`;
}
