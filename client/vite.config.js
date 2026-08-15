import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Dev server proxy ─────────────────────────────────────────────────────
  // When running `npm run dev`, any request to /api/* is forwarded to the
  // local Express server. This means .env stays as-is for local dev and
  // .env.production is used for `npm run build` (Render deployment).
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ── Build optimisation ────────────────────────────────────────────────────
  build: {
    chunkSizeWarningLimit: 600,

    rolldownOptions: {
      output: {
        // Rolldown (Vite 8) requires manualChunks as a function
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react|react-dom|react-router-dom/.test(id))   return 'vendor-react';
            if (/@tanstack|axios/.test(id))                     return 'vendor-query';
            if (/recharts/.test(id))                           return 'vendor-charts';
            if (/framer-motion/.test(id))                      return 'vendor-motion';
            if (/jspdf|jspdf-autotable|xlsx/.test(id))         return 'vendor-export';
            if (/react-toastify|react-hook-form|react-icons|date-fns/.test(id)) return 'vendor-ui';
          }
        },
      },
    },
  },
})
