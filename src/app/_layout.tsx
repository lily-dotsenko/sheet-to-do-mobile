import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AlarmNavigationHandler } from '@/components/alarm-navigation-handler';
import { AppProvider } from '@/state/app-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AlarmNavigationHandler />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
