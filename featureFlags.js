/**
 * Feature Flags — Master switch for every feature in the app.
 * 
 * Shared between app.config.ts (build-time) and src/ (runtime).
 * Kept as CommonJS (.js) for maximum compatibility.
 */
module.exports = {
    FEATURES: {
        // ── Dashboard Screen ──────────────────────────────────────────────
        /** Big mg number + "crash at" time on the main screen */
        CAFFEINE_DISPLAY: true,

        /** Caffeine decay curve chart (line graph over time) */
        DECAY_CHART: true,

        /** Alertness overlay on the decay chart */
        ALERTNESS_GRAPH: true,

        /** Toggle buttons to show/hide caffeine, alertness, threshold lines */
        CHART_TOGGLES: true,

        /** Sleep threshold line on the chart */
        THRESHOLD_LINE: true,

        /** "You can sleep at X:XX" forecast card */
        SLEEP_FORECAST: true,

        /** Sleep quality selector (Great / Average / Poor) */
        SLEEP_QUALITY: true,

        /** 3-day history card on dashboard */
        HISTORY_CARD: true,

        /** "Detailed Statistics" button → opens detailed-stats page */
        DETAILED_STATS: true,

        // ── Add Drink Screen ──────────────────────────────────────────────
        /** The entire add-drink modal with preset cards + custom dose */
        ADD_DRINK: true,

        // ── Settings Screen ───────────────────────────────────────────────
        /** Dark/Light theme toggle */
        THEME_TOGGLE: true,

        /** Push notification toggle + frequency selector */
        NOTIFICATIONS: false,

        /** Body weight slider (adjusts effective half-life) */
        WEIGHT_SETTING: true,

        /** Base half-life slider */
        HALF_LIFE_SETTING: true,

        /** Sleep threshold slider */
        THRESHOLD_SETTING: true,

        /** In-app widget preview card in settings */
        WIDGET_PREVIEW: false,

        /** "Reset All Data" button */
        CLEAR_DATA: true,

        /** Info popup icons next to settings metrics (Weight, Half-Life, Threshold) */
        INFO_POPUPS: true,

        // ── Home Screen Widget ────────────────────────────────────────────
        /** Real Android home screen widget (GoodEnergy) */
        HOME_WIDGET: true,

        // ── Background Services ───────────────────────────────────────────
        /** Periodic background caffeine level notifications */
        BACKGROUND_NOTIFICATIONS: true,

        /** Background widget refresh (tied to background fetch task) */
        BACKGROUND_WIDGET_REFRESH: true,
    }
};
