# send-notifications — Setup

## 1. Generar claves VAPID

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key:  BExamplePublicKeyBase64url...
Private Key: ExamplePrivateKeyBase64url...
```

## 2. Agregar secretos en Supabase

En el dashboard: Settings → Edge Functions → Secrets, agregar:

| Nombre             | Valor                          |
|--------------------|--------------------------------|
| VAPID_PUBLIC_KEY   | (la clave pública del paso 1)  |
| VAPID_PRIVATE_KEY  | (la clave privada del paso 1)  |
| VAPID_EMAIL        | marcosrvictorica@gmail.com     |

## 3. Pegar la clave pública en el hook del cliente

En `src/hooks/usePushNotifications.ts`, reemplazar:

```ts
const VAPID_PUBLIC_KEY = 'REEMPLAZAR_CON_TU_VAPID_PUBLIC_KEY';
```

con la clave pública generada en el paso 1.

## 4. Correr la migración

```bash
supabase db push
```

o pegar `supabase/migrations/20260811_push_subscriptions.sql` en el SQL Editor del dashboard.

## 5. Deploy de la Edge Function

```bash
supabase functions deploy send-notifications
```

## Sobre el payload

La función actual envía un push **sin payload cifrado** (protocolo RFC 8291).
El service worker tiene un mensaje estático hardcodeado como fallback.

Esto es compatible con Chrome/Android y Firefox. En iOS (PWA añadida al home screen,
iOS 16.4+) también funciona.

Si en el futuro querés enviar el payload dinámico al SW (para mostrar el texto
del servidor en la notificación), hay que implementar ECDH + AES-128-GCM en la
Edge Function o usar `npm:web-push` si Deno lo soporta en ese momento.
