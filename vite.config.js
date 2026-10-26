import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/DinoWeb/',
  plugins: [
    react(),
    {
      name: 'inline-critical-styles',
      transformIndexHtml: {
        order: 'post',
        handler(html, { bundle }) {
          if (!bundle) return;
          // The homepage's small stylesheet is needed on every navigation.
          // Inline the built CSS to remove its extra blocking network trip;
          // section styles keep their existing deferred boundaries.
          const splineAssets = new Set(Object.values(bundle).filter(item => item.type === 'chunk' && item.fileName.startsWith('assets/spline/')).flatMap(item => [item.fileName, ...(item.viteMetadata?.importedCss || [])]));
          const assets = Object.keys(bundle).filter(name => name.startsWith('assets/') && !splineAssets.has(name) && !name.startsWith('assets/spline/'));
          const manifest = `<script id="portfolio-preload-manifest" type="application/json">${JSON.stringify(assets.map(name => `/DinoWeb/${name}`))}</script>`;
          return html.replace('</head>', `${manifest}</head>`).replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (link) => {
            const href = link.match(/href="([^"]+)"/)?.[1];
            const asset = href && bundle[href.replace(/^\/DinoWeb\//, '')];
            if (asset?.type !== 'asset' || !href.endsWith('.css')) return link;
            return `<style data-critical-styles>${asset.source}</style>`;
          });
        },
      },
    },
    VitePWA({
      // Keep the current worker and its chunks until the visitor accepts the
      // update. Activating immediately can strand an already-open lazy page.
      registerType: 'prompt',
      includeAssets: ['dino-icon.webp', 'favicon.svg'],
      manifest: {
        name: 'DinoWeb — Interactive 3D Portfolio',
        short_name: 'DinoWeb',
        description: 'Interactive 3D portfolio',
        theme_color: '#f2f2f2',
        background_color: '#f2f2f2',
        display: 'standalone',
        start_url: '/DinoWeb/',
        scope: '/DinoWeb/',
        icons: [
          { src: '/DinoWeb/pwa-192x192.webp', sizes: '192x192', type: 'image/webp' },
          { src: '/DinoWeb/pwa-512x512.webp', sizes: '512x512', type: 'image/webp' },
        ],
      },
      workbox: {
        importScripts: ['legacy-upgrade.js'],
        // A waiting update takes control only after visitor acceptance (or the
        // legacy migration). This triggers registerSW's reload callback.
        clientsClaim: true,
        // Registration follows the completed asset preloader. Reuse its cached
        // downloads without competing with the startup queue.
        globPatterns: ['**/*.{html,webmanifest,js,mjs,css,woff2,svg,webp,pdf}'],
        // The experimental Spline renderer is fetched only when its view loads.
        globIgnores: ['**/spline/**'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/DinoWeb/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(?:js|mjs)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dinoweb-lazy-code',
              expiration: { maxEntries: 24, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\/assets\/.*\.(?:css|woff2|woff|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dinoweb-static-assets',
              expiration: { maxEntries: 48, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\.(webp|pdf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dinoweb-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Separate files can be precached and shared between sections. Inlining
    // SVGs duplicated the same icons inside several JavaScript chunks.
    // Only the tiny, first-paint loader icon is embedded. Other assets stay
    // separate so section chunks can share their cached files.
    assetsInlineLimit: (filePath) => filePath.endsWith('/brand/dino-loader.webp'),
    target: 'es2020',
    cssTarget: 'chrome61',
    rollupOptions: {
      output: {
        chunkFileNames(chunk) {
          const spline = chunk.moduleIds.some(id => id.includes('/@splinetool/runtime/') || id.includes('/src/prototype/'));
          return spline ? 'assets/spline/[name]-[hash].js' : 'assets/[name]-[hash].js';
        },
        manualChunks(id) {
          // Only React's core stays in the entry's cacheable vendor chunk.
          // PDF and Three.js dependencies follow their lazy import boundaries;
          // forcing react-pdf into a manual chunk made Vite preload it at startup.
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-dom/')) {
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  }
})
