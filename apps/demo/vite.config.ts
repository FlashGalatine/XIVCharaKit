import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const headers = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'self' https://v2.xivapi.com; img-src 'self' blob:; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
const legalFiles = [
  ['LICENSE', 'LICENSE.txt'],
  ['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.txt'],
] as const;
export default defineConfig({
  plugins: [
    {
      name: 'project-legal-notices',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const file = legalFiles.find(
            ([, target]) => request.url?.split('?')[0] === `/${target}`,
          );
          if (!file) {
            next();
            return;
          }
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          response.end(
            readFileSync(new URL(`../../${file[0]}`, import.meta.url), 'utf8'),
          );
        });
      },
      generateBundle() {
        for (const [source, target] of legalFiles)
          this.emitFile({
            type: 'asset',
            fileName: target,
            source: readFileSync(
              new URL(`../../${source}`, import.meta.url),
              'utf8',
            ),
          });
      },
    },
  ],
  build: { target: 'es2022', sourcemap: false },
  worker: { format: 'es' },
  preview: { headers },
});
