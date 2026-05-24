import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssTarget: 'chrome61',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          vendor: ['react', 'react-dom'],
        }
      }
    },
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 600,
  },
  // Optimize deps for faster dev and better tree-shaking
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  }
})