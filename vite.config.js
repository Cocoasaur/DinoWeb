import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/DinoWeb/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['dino-icon.png', 'favicon.svg'],
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
          { src: '/DinoWeb/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/DinoWeb/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg}'],
        navigateFallback: '/DinoWeb/index.html',
        runtimeCaching: [
          {
            urlPattern: /\.(webp|png|pdf)$/,
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
    target: 'es2020',
    cssTarget: 'chrome61',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three')) {
            return 'three'
          }
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')) {
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