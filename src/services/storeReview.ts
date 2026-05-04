import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

export async function isReviewAvailable(): Promise<boolean> {
    return StoreReview.isAvailableAsync();
}

export async function requestInAppReview(): Promise<void> {
    try {
        if (await StoreReview.isAvailableAsync()) {
            await StoreReview.requestReview();
        }
    } catch {
        // Quotas / store rules — ignore
    }
}

/**
 * Opens the Play Store or App Store listing (Settings → Rate us).
 */
export async function openStoreListing(): Promise<void> {
    const androidPkg = Constants.expoConfig?.android?.package;
    const iosIdRaw = Constants.expoConfig?.extra?.iosAppStoreId;
    const iosId = typeof iosIdRaw === 'string' ? iosIdRaw.trim() : '';

    if (Platform.OS === 'android') {
        if (!androidPkg) return;
        const market = `market://details?id=${androidPkg}`;
        const httpsUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(androidPkg)}`;
        try {
            if (await Linking.canOpenURL(market)) {
                await Linking.openURL(market);
                return;
            }
        } catch {
            // fall through to HTTPS
        }
        await Linking.openURL(httpsUrl);
        return;
    }

    if (Platform.OS === 'ios') {
        if (iosId.length > 0) {
            await Linking.openURL(`https://apps.apple.com/app/id${iosId}`);
            return;
        }
        Alert.alert(
            'App Store',
            'Add your numeric App Store ID in app.config (extra.iosAppStoreId) or set EXPO_PUBLIC_IOS_APP_STORE_ID when building.'
        );
        return;
    }

    if (androidPkg) {
        await Linking.openURL(
            `https://play.google.com/store/apps/details?id=${encodeURIComponent(androidPkg)}`
        );
    }
}
