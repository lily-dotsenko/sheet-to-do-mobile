import notifee, { EventType, Notification } from '@notifee/react-native';
import { Href, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

import { alarmRouteParams } from '@/services/notification-platform';
import { STOP_ALARM_ACTION, stopAlarm } from '@/services/notifications';

export function AlarmNavigationHandler() {
  const router = useRouter();
  const openAlarm = useCallback(
    (notification?: Notification) => {
      const routeParams = alarmRouteParams(notification);
      if (!routeParams) return;
      const params = new URLSearchParams(routeParams);
      router.replace(`/alarm?${params.toString()}` as Href);
    },
    [router],
  );

  useEffect(() => {
    if (Platform.OS === 'android') {
      void notifee.getInitialNotification().then((initial) => openAlarm(initial?.notification));
    }
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === STOP_ALARM_ACTION &&
        detail.notification?.id
      ) {
        void stopAlarm(detail.notification.id);
        return;
      }
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        openAlarm(detail.notification);
      }
    });
  }, [openAlarm]);

  return null;
}
