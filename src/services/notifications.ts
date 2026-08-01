import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';
import * as LegacyNotifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'sheet-alarms-v2';
export const STOP_ALARM_ACTION = 'stop-sheet-alarm';

export class ExactAlarmPermissionError extends Error {
  constructor() {
    super('Exact alarm permission is required');
    this.name = 'ExactAlarmPermissionError';
  }
}

export async function configureNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Будильники / Alarms',
    description: 'Гучні нагадування Sheet: to do',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [500, 500, 500, 500],
    visibility: AndroidVisibility.PUBLIC,
  });
}

async function requestAlarmPermission(): Promise<boolean> {
  const permission = await notifee.requestPermission();
  if (permission.authorizationStatus !== AuthorizationStatus.AUTHORIZED) return false;
  if (
    Platform.OS === 'android' &&
    permission.android.alarm === AndroidNotificationSetting.DISABLED
  ) {
    await notifee.openAlarmPermissionSettings();
    throw new ExactAlarmPermissionError();
  }
  return true;
}

export async function scheduleReminder(
  id: string,
  title: string,
  body: string,
  date: Date,
  stopLabel: string,
): Promise<string | null> {
  if (date.getTime() <= Date.now()) return null;
  if (!(await requestAlarmPermission())) return null;
  await configureNotifications();
  return notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      data: { kind: 'sheet-alarm' },
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        ongoing: true,
        autoCancel: false,
        loopSound: true,
        showTimestamp: true,
        timestamp: date.getTime(),
        pressAction: { id: 'default' },
        fullScreenAction: { id: 'default' },
        actions: [{ title: stopLabel, pressAction: { id: STOP_ALARM_ACTION } }],
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    },
  );
}

export async function stopAlarm(notificationId: string): Promise<void> {
  await notifee.cancelNotification(notificationId);
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  await Promise.allSettled([
    notifee.cancelNotification(notificationId),
    // Version 0.3 used expo-notifications. Keep this compatibility cancellation
    // so rescheduling after an update does not leave the old trigger behind.
    LegacyNotifications.cancelScheduledNotificationAsync(notificationId),
  ]);
}
