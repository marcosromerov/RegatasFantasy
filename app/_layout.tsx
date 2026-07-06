import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { setupPwa } from '../src/utils/pwa';

export default function RootLayout() {
  useEffect(() => {
    setupPwa();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
    </Stack>
  );
}