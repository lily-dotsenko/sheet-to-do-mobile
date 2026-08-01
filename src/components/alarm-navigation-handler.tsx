import notifee, { EventType, Notification } from '@notifee/react-native';
import { Href, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';

export function AlarmNavigationHandler() {
  const router = useRouter();
  const openAlarm = useCallback(
    (notification?: Notification) => {
      if (notification?.data?.kind !== 'sheet-alarm' || !notification.id) return;
      const params = new URLSearchParams({
        notificationId: notification.id,
        title: notification.title ?? '',
        body: notification.body ?? '',
      });
      router.replace(`/alarm?${params.toString()}` as Href);
    },
    [router],
  );

  useEffect(() => {
    void notifee.getInitialNotification().then((initial) => openAlarm(initial?.notification));
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        openAlarm(detail.notification);
      }
    });
  }, [openAlarm]);

  return null;
}
