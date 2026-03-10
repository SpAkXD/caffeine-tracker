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
 * Pre-schedule up to 24 hourly caffeine update notifications.
 *
 * Instead of relying on BackgroundFetch (which the OS kills after 2-3 hours),
 * we calculate the projected caffeine decay for the next 24 hours and schedule
 * each notification with an exact future Date trigger. This ensures delivery
 * regardless of OS background limits.
 *
 * Call this whenever the user opens the app or adds a drink — it cancels
 * all existing scheduled notifications first, then regenerates a fresh batch.
 *
 * @param doses       Current dose array from the store
 * @param halfLife    Effective half-life in hours
 */
export async function scheduleCaffeineUpdates(
    doses: Dose[],
    halfLife: number
): Promise<void> {
    try {
        // Cancel all existing scheduled notifications before regenerating
        await Notifications.cancelAllScheduledNotificationsAsync();

        const now = Date.now();

        for (let h = 1; h <= 24; h++) {
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
 * Send an immediate test notification
 * @param caffeineLevel - Current caffeine level to display
 */
export async function sendTestNotification(caffeineLevel: number): Promise<void> {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '☕ Current Caffeine Level',
                body: `${Math.round(caffeineLevel)} mg in your system`,
                data: { type: 'caffeine-update' },
                sound: false,
            },
            trigger: null, // Send immediately
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        throw error;
    }
}

/**
 * Schedule a test notification with a 5-second delay.
 * Mirrors the exact payload the background task sends,
 * so devs can verify notification UI without waiting hours.
 * @param currentLevel - Current caffeine level in mg
 */
export async function scheduleTestNotification(currentLevel: number): Promise<void> {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '☕ Caffeine Update',
                body: `Current Level: ${Math.round(currentLevel)} mg`,
                data: { type: 'caffeine-update' },
                sound: false,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 5,
                repeats: false,
            },
        });
        console.log('Test notification scheduled (5 seconds)');
    } catch (error) {
        console.error('Error scheduling test notification:', error);
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
