/**
 * Feature Flags — Master switch for every feature in the app.
 *
 * Imports the single source of truth from root `featureFlags.js`
 * so that both the build system (app.config.ts) and runtime (src/)
 * share the exact same flags.
 */

// Import the raw JS object (Metro handles this fine)
// Using require to ensure compatibility with module.exports
const { FEATURES: FLAGS } = require('../../featureFlags');

export const FEATURES = FLAGS as {
    CAFFEINE_DISPLAY: boolean;
    DECAY_CHART: boolean;
    ALERTNESS_GRAPH: boolean;
    CHART_TOGGLES: boolean;
    THRESHOLD_LINE: boolean;
    SLEEP_FORECAST: boolean;
    SLEEP_QUALITY: boolean;
    HISTORY_CARD: boolean;
    DETAILED_STATS: boolean;
    ADD_DRINK: boolean;
    THEME_TOGGLE: boolean;
    NOTIFICATIONS: boolean;
    WEIGHT_SETTING: boolean;
    HALF_LIFE_SETTING: boolean;
    THRESHOLD_SETTING: boolean;
    WIDGET_PREVIEW: boolean;
    CLEAR_DATA: boolean;
    INFO_POPUPS: boolean;
    HOME_WIDGET: boolean;
    BACKGROUND_NOTIFICATIONS: boolean;
    BACKGROUND_WIDGET_REFRESH: boolean;
};

export type FeatureName = keyof typeof FEATURES;
