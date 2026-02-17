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
        CAFFEINE_DISPLAY: false,

        /** Caffeine decay curve chart (line graph over time) */
        DECAY_CHART: false,

        /** Alertness overlay on the decay chart */
        ALERTNESS_GRAPH: false,

        /** Toggle buttons to show/hide caffeine, alertness, threshold lines */
        CHART_TOGGLES: false,

        /** Sleep threshold line on the chart */
        THRESHOLD_LINE: false,

        /** "You can sleep at X:XX" forecast card */
        SLEEP_FORECAST: false,

        /** Sleep quality selector (Great / Average / Poor) */
        SLEEP_QUALITY: false,

        /** 3-day history card on dashboard */
        HISTORY_CARD: false,

        /** "Detailed Statistics" button → opens detailed-stats page */
        DETAILED_STATS: false,

        // ── Add Drink Screen ──────────────────────────────────────────────
        /** The entire add-drink modal with preset cards + custom dose */
        ADD_DRINK: false,

        // ── Settings Screen ───────────────────────────────────────────────
        /** Dark/Light theme toggle */
        THEME_TOGGLE: false,

        /** Push notification toggle + frequency selector */
        NOTIFICATIONS: false,

        /** Body weight slider (adjusts effective half-life) */
        WEIGHT_SETTING: false,

        /** Base half-life slider */
        HALF_LIFE_SETTING: false,

        /** Sleep threshold slider */
        THRESHOLD_SETTING: false,

        /** In-app widget preview card in settings */
        WIDGET_PREVIEW: false,

        /** "Reset All Data" button */
        CLEAR_DATA: false,

        // ── Home Screen Widget ────────────────────────────────────────────
        /** Real Android home screen widget (GoodEnergy) */
        HOME_WIDGET: false,

        // ── Background Services ───────────────────────────────────────────
        /** Periodic background caffeine level notifications */
        BACKGROUND_NOTIFICATIONS: false,

        /** Background widget refresh (tied to background fetch task) */
        BACKGROUND_WIDGET_REFRESH: false,
    }
};
