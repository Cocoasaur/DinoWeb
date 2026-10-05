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
          return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (link) => {
            const href = link.match(/href="([^"]+)"/)?.[1];
            const asset = href && bundle[href.replace(/^\/DinoWeb\//, '')];
            if (asset?.type !== 'asset' || !href.endsWith('.css')) return link;
            return `<style data-critical-styles>${asset.source}</style>`;
          });
        },
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['dino-icon.webp', 'favicon.svg'],
      manifest: {
        name: 'DinoWeb — Interactive 3D Portfolio',
        short_name: 'DinoWeb',
        description: 'Interactive 3D portfolio',
        theme_color: '#002451',
        background_color: '#002451',
        display: 'standalone',
        start_url: '/DinoWeb/',
        scope: '/DinoWeb/',
        icons: [
          { src: '/DinoWeb/pwa-192x192.webp', sizes: '192x192', type: 'image/webp' },
          { src: '/DinoWeb/pwa-512x512.webp', sizes: '512x512', type: 'image/webp' },
        ],
      },
      workbox: {
        // Registration runs after the first paint. Download the full portfolio
        // then, without evaluating WebGL/PDF code or delaying the homepage.
        globPatterns: ['**/*.{html,webmanifest,js,mjs,css,woff2,svg,webp,pdf}'],
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
