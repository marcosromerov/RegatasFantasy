// Edge Function: send-notifications
// Envía Web Push a todos los dispositivos suscriptos.
// Solo puede llamarla un usuario con Role = 'admin'.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Helpers base64url ────────────────────────────────────────────────────────

function b64urlToBytes(b64url: string): Uint8Array {
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function bytesToB64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ─── VAPID JWT (ES256) ────────────────────────────────────────────────────────
// La clave privada VAPID es un raw P-256 scalar de 32 bytes en base64url.
// La clave pública VAPID es un punto no comprimido P-256: 0x04 + x(32) + y(32).

async function signVapidJwt(endpoint: string): Promise<string> {
  const privKeyB64  = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const pubKeyB64   = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const subject     = `mailto:${Deno.env.get('VAPID_EMAIL')!}`;

  const header  = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const origin  = new URL(endpoint).origin;
  const exp     = Math.floor(Date.now() / 1000) + 12 * 3600;
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({ aud: origin, exp, sub: subject })));

  // Construir JWK desde los bytes de las claves raw.
  const pubBytes = b64urlToBytes(pubKeyB64); // 65 bytes: 0x04 + x + y
  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: bytesToB64url(pubBytes.slice(1, 33)),
    y: bytesToB64url(pubBytes.slice(33, 65)),
    d: bytesToB64url(b64urlToBytes(privKeyB64)),
    ext: true,
  };

  const key = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign'],
  );

  const sigInput = new TextEncoder().encode(`${header}.${payload}`);
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, sigInput),
  );

  return `${header}.${payload}.${bytesToB64url(sig)}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: CORS });
    }

    const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;

    // Verificar que el llamante sea admin.
    const userClient = createClient(SUPABASE_URL, authHeader.slice(7), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response('Unauthorized', { status: 401, headers: CORS });

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userRow } = await adminClient
      .from('usuarios')
      .select('Role')
      .eq('id', user.id)
      .single();

    if (userRow?.Role !== 'admin') {
      return new Response('Forbidden', { status: 403, headers: CORS });
    }

    // Leer opciones del body.
    let customTitle: string | undefined;
    let customBody: string | undefined;
    let adminOnly = true; // por defecto: solo admins (modo testing)
    try {
      const body = await req.json();
      customTitle = body?.title;
      customBody  = body?.body;
      if (body?.adminOnly === false) adminOnly = false;
    } catch { /* body vacío, usamos defaults */ }

    // Traer suscripciones: solo admins o todas según el flag.
    let subsQuery = adminClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, user_id');

    if (adminOnly) {
      // Filtrar solo usuarios con Role = 'admin'.
      const { data: adminUsers } = await adminClient
        .from('usuarios')
        .select('id')
        .eq('Role', 'admin');
      const adminIds = (adminUsers ?? []).map((u: any) => u.id);
      if (adminIds.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, failed: 0, message: 'No hay admins suscriptos.' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } },
        );
      }
      subsQuery = subsQuery.in('user_id', adminIds) as any;
    }

    const { data: subs, error: subErr } = await subsQuery;

    if (subErr) throw subErr;
    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: 'Sin suscripciones activas.' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } },
      );
    }

    // Payload JSON que el service worker va a recibir.
    const notifPayload = JSON.stringify({
      title: customTitle ?? '¡Puntos cargados! 🏉',
      body:  customBody  ?? 'Los resultados de la fecha ya están disponibles.',
      url:   '/',
    });

    let sent = 0;
    let failed = 0;
    const expiredIds: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          const jwt = await signVapidJwt(sub.endpoint);

          // Nota: enviamos el payload SIN cifrar porque requeriría implementar
          // RFC 8291 (ECDH + AES-128-GCM) en Deno puro. El service worker tiene
          // un fallback estático para el caso event.data === null.
          // Para cifrado completo, ver supabase/functions/send-notifications/README.md
          const res = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
              TTL: '86400',
              Urgency: 'normal',
            },
          });

          if (res.ok || res.status === 201) {
            sent++;
          } else if (res.status === 410 || res.status === 404) {
            // Suscripción vencida: marcarla para eliminar.
            expiredIds.push(sub.id);
            failed++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }),
    );

    // Limpiar suscripciones vencidas.
    if (expiredIds.length > 0) {
      await adminClient.from('push_subscriptions').delete().in('id', expiredIds);
    }

    return new Response(
      JSON.stringify({ sent, failed, total: subs.length }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } },
    );
  }
});
