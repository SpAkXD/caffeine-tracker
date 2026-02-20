import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
 * Schedule a one-shot notification for the exact moment caffeine drops
 * to the user's sleep threshold. Cancels any previously scheduled
 * threshold notifications first.
 *
 * This replaces the old "periodic background loop" approach — the OS
 * can no longer kill a background task and cause missed alerts because
 * the notification is pre-scheduled at a precise future timestamp.
 *
 * @param thresholdTimestamp  Unix-ms when the level will hit the threshold
 * @param thresholdMg        The threshold value (for the notification body)
 */
export async function scheduleThresholdNotification(
    thresholdTimestamp: number | null,
    thresholdMg: number
): Promise<void> {
    try {
        // Always clear stale scheduled notifications first
        await cancelAllNotifications();

        // Nothing to schedule if already below threshold or no clearance time
        if (thresholdTimestamp === null) return;

        // Only schedule if the clearance time is in the future
        const secondsUntil = Math.round((thresholdTimestamp - Date.now()) / 1000);
        if (secondsUntil <= 0) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🌙 Sleep-Safe!',
                body: `Your caffeine is now below ${Math.round(thresholdMg)} mg — you're clear to sleep.`,
                data: { type: 'threshold-reached' },
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsUntil,
                repeats: false,
                channelId: Platform.OS === 'android' ? 'caffeine-updates' : undefined,
            },
        });

        console.log(`Threshold notification scheduled in ${(secondsUntil / 60).toFixed(0)} min`);
    } catch (error) {
        console.error('Error scheduling threshold notification:', error);
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
