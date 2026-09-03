import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import apiDev from './scripts/vite-api-dev'

export default defineConfig({
  // apiDev() kjører Vercel-funksjonene under /api lokalt (kun i dev).
  plugins: [react(), tailwindcss(), apiDev()],
  base: '/',
  server: {
    fs: {
      allow: ['..'],
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three')) return 'three'
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('@splidejs')) return 'splide'
          if (id.includes('react-router')) return 'react-router'
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
        },
      },
    },
  },
})
