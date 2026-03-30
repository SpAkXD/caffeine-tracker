import { ExpoConfig, ConfigContext } from 'expo/config';
const { FEATURES } = require('./featureFlags');

export default ({ config }: ConfigContext): ExpoConfig => {
    const plugins: any[] = [
        "expo-router",
        [
            "expo-notifications",
            {
                "icon": "./assets/images/notification-icon.png",
                "color": "#FF6B35",
                "sounds": []
            }
        ]
    ];

    if (FEATURES.HOME_WIDGET) {
        plugins.push([
            "react-native-android-widget",
            {
                "widgets": [
                    {
                        "name": "GoodEnergy",
                        "label": "Caffeine Level",
                        "minWidth": "110dp",
                        "minHeight": "110dp",
                        "description": "Shows your current caffeine level",
                        "previewImage": "./assets/images/icon.png",
                        "updatePeriodMillis": 900000,
                        "resizeMode": "horizontal|vertical"
                    }
                ]
            }
        ]);
    }

    return {
        ...config,
        name: "Caffeine Tracker",
        slug: "caffeine-tracker",
        version: "2.1.1",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "caffinetracker",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        splash: {
            image: "./assets/images/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#050505"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.caffinetracker.app",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false
            }
        },
        android: {
            package: "com.caffinetracker.app",
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#050505"
            },
            permissions: [
                "android.permission.POST_NOTIFICATIONS"
            ],
            versionCode: 13
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins,
        experiments: {
            typedRoutes: true
        },
        extra: {
            router: {},
            eas: {
                projectId: "f92043b2-2d66-4e77-99fe-e538e672b8e4"
            }
        }
    };
};
