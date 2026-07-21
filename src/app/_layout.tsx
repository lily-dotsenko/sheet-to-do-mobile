import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { AppProvider } from '@/state/app-context';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
