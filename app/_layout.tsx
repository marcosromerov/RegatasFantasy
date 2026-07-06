import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../api/supabase';
import { setupPwa } from '../src/utils/pwa';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // PWA (meta tags + service worker en web)
  useEffect(() => {
    setupPwa();
  }, []);

  // Leemos la sesión persistida (AsyncStorage) y escuchamos cambios (login/logout).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Guard: sin sesión → login; con sesión estando en login/register → home.
  useEffect(() => {
    if (!ready) return;
    const enAuth = segments[0] === 'login' || segments[0] === 'register';

    if (!session && !enAuth) {
      router.replace('/login');
    } else if (session && enAuth) {
      router.replace('/');
    }
  }, [ready, session, segments]);

  // Mientras leemos la sesión, mostramos un loader (evita el flash de la Home).
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#283a82', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFEA00" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
