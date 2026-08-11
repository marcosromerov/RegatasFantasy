import { useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../../api/supabase';

// La clave pública VAPID se genera una sola vez con:
//   npx web-push generate-vapid-keys
// y se pega aquí (es pública, no es secreto).
// La clave privada va a Supabase como secreto VAPID_PRIVATE_KEY.
const VAPID_PUBLIC_KEY = 'BDDBraRRCso4QU4YbdwDsflMwKDRmikPzFNg5tq8dEkRJP6yf7GxqMU9H46k8R9e88RG5zc985A0ZfgEmFqAX40';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Registra la suscripción Web Push del dispositivo actual en Supabase.
 * Solo corre en web. Pide permiso al usuario si aún no lo otorgó.
 * Se llama desde _layout.tsx cuando hay sesión activa.
 */
export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!userId) return;
    if (VAPID_PUBLIC_KEY === 'REEMPLAZAR_CON_TU_VAPID_PUBLIC_KEY') return;

    const nav = (globalThis as any).navigator;
    if (!nav?.serviceWorker || !('PushManager' in (globalThis as any).window)) return;

    const setup = async () => {
      try {
        // Esperar a que el SW esté listo.
        const registration = await nav.serviceWorker.ready;

        // Si el usuario ya denegó, no volvemos a pedir.
        const perm = (globalThis as any).Notification?.permission;
        if (perm === 'denied') return;

        // Pedir permiso (si ya está granted, no muestra el diálogo).
        const result = await (globalThis as any).Notification.requestPermission();
        if (result !== 'granted') return;

        // Obtener suscripción existente o crear una nueva.
        let sub = await registration.pushManager.getSubscription();
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const json = sub.toJSON();
        const endpoint = json.endpoint!;
        const p256dh   = json.keys?.p256dh!;
        const auth     = json.keys?.auth!;

        // Guardar en Supabase (upsert por user_id + endpoint).
        await supabase.from('push_subscriptions').upsert(
          { user_id: userId, endpoint, p256dh, auth },
          { onConflict: 'user_id,endpoint', ignoreDuplicates: true },
        );
      } catch (err) {
        // Silencioso: no romper la app si falla el registro push.
        console.warn('[Push] Error registrando suscripción:', err);
      }
    };

    setup();
  }, [userId]);
}
