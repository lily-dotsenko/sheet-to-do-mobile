export const IOS_ALARM_CATEGORY_ID = 'sheet-alarm-actions';
export const SHEET_ALARM_KIND = 'sheet-alarm';

export type AlarmNotificationLike = {
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

export function iosReminderOptions() {
  return {
    categoryId: IOS_ALARM_CATEGORY_ID,
    sound: 'default' as const,
    interruptionLevel: 'timeSensitive' as const,
    foregroundPresentationOptions: {
      badge: false,
      sound: true,
      banner: true,
      list: true,
    },
  };
}

export function alarmRouteParams(notification?: AlarmNotificationLike) {
  if (notification?.data?.kind !== SHEET_ALARM_KIND || !notification.id) return null;
  return {
    notificationId: notification.id,
    title: notification.title ?? '',
    body: notification.body ?? '',
  };
}
