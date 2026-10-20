import { defineConfig } from 'vite';

const headers = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'self' https://v2.xivapi.com; img-src 'self' blob:; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
export default defineConfig({
  build: { target: 'es2022', sourcemap: false },
  worker: { format: 'es' },
  preview: { headers },
});
