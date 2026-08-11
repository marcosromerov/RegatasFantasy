import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function signVapidJwt(endpoint: string): Promise<string> {
  const privKeyB64 = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const pubKeyB64  = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const subject    = `mailto:${Deno.env.get('VAPID_EMAIL')!}`;

  const header  = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const origin  = new URL(endpoint).origin;
  const exp     = Math.floor(Date.now() / 1000) + 12 * 3600;
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({ aud: origin, exp, sub: subject })));

  const pubBytes = b64urlToBytes(pubKeyB64);
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: CORS });
    }

    const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;

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

    let customTitle = '¡Puntos cargados! 🏉';
    let customBody  = 'Los resultados de la fecha ya están disponibles. Revisá cómo rindió tu equipo.';
    let adminOnly   = true;
    try {
      const body = await req.json();
      if (body?.title) customTitle = body.title;
      if (body?.body)  customBody  = body.body;
      if (body?.adminOnly === false) adminOnly = false;
    } catch { /* body vacío */ }

    let subs: any[] = [];

    if (adminOnly) {
      const { data: adminUsers } = await adminClient
        .from('usuarios')
        .select('id')
        .eq('Role', 'admin');

      const adminIds = (adminUsers ?? []).map((u: any) => u.id);

      if (adminIds.length > 0) {
        const { data, error } = await adminClient
          .from('push_subscriptions')
          .select('id, endpoint, p256dh, auth')
          .in('user_id', adminIds);
        if (error) throw error;
        subs = data ?? [];
      }
    } else {
      const { data, error } = await adminClient
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth');
      if (error) throw error;
      subs = data ?? [];
    }

    if (subs.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, total: 0, message: adminOnly ? 'No hay admins suscriptos.' : 'Sin suscripciones activas.' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } },
      );
    }

    let sent = 0;
    let failed = 0;
    const expiredIds: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          const jwt = await signVapidJwt(sub.endpoint);
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
