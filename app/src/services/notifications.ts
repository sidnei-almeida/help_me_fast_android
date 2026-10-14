/**
 * Local notifications for the active fast (goal reached).
 * Everything is scheduled on-device; nothing leaves the phone.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'fast-goal';
const GOAL_NOTIFICATION_ID = 'fast-goal-reached';
const HALFWAY_NOTIFICATION_ID = 'fast-halfway';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

async function ensurePermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && !channelReady) {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Fasting goal',
        importance: Notifications.AndroidImportance.HIGH,
      });
      channelReady = true;
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (e) {
    console.warn('notifications: permission error', e);
    return false;
  }
}

async function scheduleAt(identifier: string, date: Date, title: string, body: string) {
  if (date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

/** (Re)schedules the reminders for the active fast. Safe to call repeatedly. */
export async function scheduleFastNotifications(startTime: number, targetHours: number): Promise<void> {
  await cancelFastNotifications();
  if (!(await ensurePermission())) return;
  const goalAt = startTime + targetHours * 3600 * 1000;
  try {
    await scheduleAt(
      GOAL_NOTIFICATION_ID,
      new Date(goalAt),
      'Goal reached! 🎉',
      `You completed your ${targetHours}h fast. Break it gently — or keep going if you feel good.`
    );
    if (targetHours >= 16) {
      await scheduleAt(
        HALFWAY_NOTIFICATION_ID,
        new Date(startTime + (targetHours / 2) * 3600 * 1000),
        'Halfway there 💪',
        `${targetHours / 2}h down. Remember water and electrolytes.`
      );
    }
  } catch (e) {
    console.warn('notifications: schedule error', e);
  }
}

export async function cancelFastNotifications(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(GOAL_NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync(HALFWAY_NOTIFICATION_ID);
  } catch {
    /* nothing scheduled */
  }
}
