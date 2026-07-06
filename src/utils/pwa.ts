import { Platform } from 'react-native';

/**
 * Configura la PWA en web: agrega el manifest, los meta tags de iOS y registra
 * el service worker. En modo SPA (output: "single") Expo no usa +html.tsx, así
 * que inyectamos esto en runtime. En native no hace nada.
 */
export function setupPwa() {
  if (Platform.OS !== 'web') return;

  const doc: any = (globalThis as any).document;
  const nav: any = (globalThis as any).navigator;
  if (!doc?.head) return;

  const ensure = (selector: string, crear: () => any) => {
    if (!doc.head.querySelector(selector)) doc.head.appendChild(crear());
  };
  const meta = (name: string, content: string) => {
    const m = doc.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', content);
    return m;
  };
  const link = (rel: string, href: string) => {
    const l = doc.createElement('link');
    l.setAttribute('rel', rel);
    l.setAttribute('href', href);
    return l;
  };

  ensure('link[rel="manifest"]', () => link('manifest', '/manifest.json'));
  ensure('meta[name="theme-color"]', () => meta('theme-color', '#283a82'));
  ensure('meta[name="mobile-web-app-capable"]', () => meta('mobile-web-app-capable', 'yes'));
  ensure('meta[name="apple-mobile-web-app-capable"]', () => meta('apple-mobile-web-app-capable', 'yes'));
  ensure('meta[name="apple-mobile-web-app-status-bar-style"]', () => meta('apple-mobile-web-app-status-bar-style', 'default'));
  ensure('meta[name="apple-mobile-web-app-title"]', () => meta('apple-mobile-web-app-title', 'Regatas Fantasy'));
  ensure('link[rel="apple-touch-icon"]', () => link('apple-touch-icon', '/icon.jpg'));

  if (nav?.serviceWorker) {
    nav.serviceWorker.register('/sw.js').catch(() => {});
  }
}
