import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { calculateStackedCaffeine, Dose } from '../utils/math';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> - true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // If not already granted, ask for permission
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        // For Android, create notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('caffeine-updates', {
                name: 'Caffeine Level Updates',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B35',
            });
        }

        return finalStatus === 'granted';
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Pre-schedule up to 24 caffeine update notifications at the user's chosen interval.
 *
 * Instead of relying on BackgroundFetch (which the OS kills after 2-3 hours),
 * we calculate the projected caffeine decay for the next 24 hours and schedule
 * each notification with an exact future Date trigger. This ensures delivery
 * regardless of OS background limits.
 *
 * Call this whenever the user opens the app, adds a drink, or changes frequency —
 * it cancels all existing scheduled notifications first, then regenerates a fresh batch.
 *
 * NOTE: Remote push notifications are not supported in Expo Go for SDK 53+.
 * This function uses only local scheduling (scheduleNotificationAsync with DATE triggers).
 * For real push notification testing, use a development build instead of Expo Go.
 *
 * @param doses         Current dose array from the store
 * @param halfLife      Effective half-life in hours
 * @param frequencyHours Notification interval in hours (1, 3, or 6) — must be passed by caller
 */
export async function scheduleCaffeineUpdates(
    doses: Dose[],
    halfLife: number,
    frequencyHours: 1 | 3 | 6
): Promise<void> {
    try {
        // Cancel all existing scheduled notifications before regenerating
        await Notifications.cancelAllScheduledNotificationsAsync();

        const frequency = frequencyHours;
        const now = Date.now();

        for (let h = frequency; h <= 24; h += frequency) {
            const futureTime = now + h * 60 * 60 * 1000;
            const projectedLevel = Math.round(
                calculateStackedCaffeine(doses, futureTime, halfLife)
            );

            // Skip if caffeine will be negligible
            if (projectedLevel < 1) continue;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '☕ Caffeine Update',
                    body: `Current Level: ${projectedLevel} mg`,
                    data: { type: 'caffeine-update' },
                    sound: false,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: new Date(futureTime),
                    channelId: Platform.OS === 'android' ? 'caffeine-updates' : undefined,
                },
            });
        }

        console.log('Pre-scheduled caffeine notifications (up to 24h)');
    } catch (error) {
        console.error('Error scheduling caffeine updates:', error);
        throw error;
    }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('Cancelled all scheduled notifications');
    } catch (error) {
        console.error('Error cancelling notifications:', error);
        throw error;
    }
}

/**
 * Get the current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    } catch (error) {
        console.error('Error getting notification permission status:', error);
        return 'undetermined';
    }
}
