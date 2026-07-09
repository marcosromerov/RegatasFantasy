import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../api/supabase';
import { setupPwa } from '../src/utils/pwa';
import { SplashScreen } from '../src/components/SplashScreen';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // PWA (meta tags + service worker en web)
  useEffect(() => {
    setupPwa();
  }, []);

  // Tiempo mínimo del splash para que no "parpadee".
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1000);
    return () => clearTimeout(t);
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

  // Guard: sin sesión y fuera de login/register → login.
  // OJO: NO redirigimos al home con solo tener sesión, porque durante el registro
  // signUp crea una sesión transitoria y romperíamos el flujo de aprobación.
  // login.tsx (valida "aprobado") y register.tsx manejan su propia navegación.
  useEffect(() => {
    if (!ready) return;
    const enAuth = segments[0] === 'login' || segments[0] === 'register';

    if (!session && !enAuth) {
      router.replace('/login');
    }
  }, [ready, session, segments]);

  // Cold start: splash branded mientras leemos la sesión / despierta Supabase.
  if (!ready || !minElapsed) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
