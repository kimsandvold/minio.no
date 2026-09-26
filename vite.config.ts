import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import apiDev from './scripts/vite-api-dev'

export default defineConfig({
  // apiDev() kjører Vercel-funksjonene under /api lokalt (kun i dev).
  plugins: [react(), tailwindcss(), apiDev()],
  base: '/',
  resolve: {
    // react-leaflet oppdages først når kartet lazy-lastes. Uten dedupe kan
    // Vite gi den sin egen React-kopi, og da feiler alle hooks i kartet.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Forhåndsbundle kart-avhengighetene sammen med resten, så dev-serveren
    // ikke må re-optimalisere midt i en lazy import.
    include: ['leaflet', 'react-leaflet', '@react-leaflet/core'],
  },
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
          // Må stå før react-reglene: react-leaflet inneholder «react» i stien,
          // og havner ellers i react-vendor – da lastes kartet for alle.
          if (id.includes('leaflet')) return 'leaflet'
          if (id.includes('react-router')) return 'react-router'
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
        },
      },
    },
  },
})
