import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/DinoWeb/',
  plugins: [react()],
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