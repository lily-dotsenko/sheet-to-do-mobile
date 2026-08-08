import {
  IOS_ALARM_CATEGORY_ID,
  alarmRouteParams,
  iosReminderOptions,
} from './notification-platform';

describe('notification platform configuration', () => {
  test('uses a time-sensitive audible iOS notification without critical alerts', () => {
    expect(iosReminderOptions()).toEqual({
      categoryId: IOS_ALARM_CATEGORY_ID,
      sound: 'default',
      interruptionLevel: 'timeSensitive',
      foregroundPresentationOptions: {
        badge: false,
        sound: true,
        banner: true,
        list: true,
      },
    });
  });

  test('creates alarm route parameters only for Sheet alarms', () => {
    expect(
      alarmRouteParams({
        id: 'task-7',
        title: 'Buy milk',
        body: 'Task reminder',
        data: { kind: 'sheet-alarm' },
      }),
    ).toEqual({
      notificationId: 'task-7',
      title: 'Buy milk',
      body: 'Task reminder',
    });
    expect(alarmRouteParams({ id: 'other', data: { kind: 'message' } })).toBeNull();
    expect(alarmRouteParams({ data: { kind: 'sheet-alarm' } })).toBeNull();
  });
});
