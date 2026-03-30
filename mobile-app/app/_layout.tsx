import { Stack } from 'expo-router';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout-exercise" />
      </Stack>
      <StatusBar style="auto" />
    </ProfileProvider>
  );
}
