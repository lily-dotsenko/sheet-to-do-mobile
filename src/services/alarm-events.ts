import notifee, { EventType } from '@notifee/react-native';

import { STOP_ALARM_ACTION, stopAlarm } from './notifications';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const notificationId = detail.notification?.id;
  if (
    type === EventType.ACTION_PRESS &&
    detail.pressAction?.id === STOP_ALARM_ACTION &&
    notificationId
  ) {
    await stopAlarm(notificationId);
  }
});
