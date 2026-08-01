import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ui-buttons';
import { stopAlarm } from '@/services/notifications';
import { useApp } from '@/state/app-context';

export default function AlarmScreen() {
  const params = useLocalSearchParams<{
    notificationId?: string | string[];
    title?: string | string[];
    body?: string | string[];
  }>();
  const router = useRouter();
  const { t } = useApp();
  const [busy, setBusy] = useState(false);
  const notificationId = first(params.notificationId);
  const title = first(params.title) || t('alarmRinging');
  const body = first(params.body);

  const handleStop = async () => {
    setBusy(true);
    try {
      if (notificationId) await stopAlarm(notificationId);
    } finally {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.icon}>⏰</Text>
        <Text style={styles.heading}>{t('alarmRinging')}</Text>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {busy ? (
          <ActivityIndicator color="#ffffff" size="large" />
        ) : (
          <ActionButton
            label={t('stopAlarm')}
            onPress={() => void handleStop()}
            style={styles.button}
            variant="danger"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#9f3f32' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 18,
  },
  icon: { fontSize: 82 },
  heading: { color: '#ffe8d9', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  title: { color: '#ffffff', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  body: { color: '#ffe8d9', fontSize: 18, lineHeight: 26, textAlign: 'center' },
  button: { minWidth: 220, marginTop: 20, backgroundColor: '#ffffff' },
});
