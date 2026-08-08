import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import * as LegacyNotifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  IOS_ALARM_CATEGORY_ID,
  SHEET_ALARM_KIND,
  iosReminderOptions,
} from './notification-platform';

const CHANNEL_ID = 'sheet-alarms-v2';
export const STOP_ALARM_ACTION = 'stop-sheet-alarm';

export class ExactAlarmPermissionError extends Error {
  constructor() {
    super('Exact alarm permission is required');
    this.name = 'ExactAlarmPermissionError';
  }
}

export async function configureNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
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
    return;
  }
  if (Platform.OS === 'ios') await configureIosCategory('Stop alarm');
}

async function requestAlarmPermission(): Promise<boolean> {
  const permission = await notifee.requestPermission(
    Platform.OS === 'ios'
      ? { alert: true, badge: false, sound: true, criticalAlert: false }
      : undefined,
  );
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
  if (Platform.OS === 'ios') await configureIosCategory(stopLabel);
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    ...(Platform.OS === 'android' ? { alarmManager: { type: AlarmType.SET_ALARM_CLOCK } } : {}),
  };
  return notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      data: { kind: SHEET_ALARM_KIND },
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
      ios: iosReminderOptions(),
    },
    trigger,
  );
}

export async function stopAlarm(notificationId: string): Promise<void> {
  await notifee.cancelNotification(notificationId);
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  const cancellations: Promise<unknown>[] = [notifee.cancelNotification(notificationId)];
  if (Platform.OS === 'android') {
    // Version 0.3 used expo-notifications on Android. Keep cancelling those IDs
    // when users update an existing installation and reschedule an item.
    cancellations.push(LegacyNotifications.cancelScheduledNotificationAsync(notificationId));
  }
  await Promise.allSettled(cancellations);
}

async function configureIosCategory(stopLabel: string): Promise<void> {
  await notifee.setNotificationCategories([
    {
      id: IOS_ALARM_CATEGORY_ID,
      actions: [
        {
          id: STOP_ALARM_ACTION,
          title: stopLabel,
          destructive: true,
        },
      ],
    },
  ]);
}
