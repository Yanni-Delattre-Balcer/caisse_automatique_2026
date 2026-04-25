import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// Base path : '/' en dev local, '/caisse_automatique_2026/' sur GitHub Pages
// Configurable via la variable d'env VITE_BASE_PATH dans le workflow CI
const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base,
  plugins: [
    react(),
    // HTTPS uniquement en dev local (nécessaire pour WebRTC / caméra)
    ...(mode === 'development' ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Heryze — Caisse Enregistreuse',
        short_name: 'Heryze',
        description: 'La caisse enregistreuse SaaS offline-first sans compromis.',
        theme_color: '#0055ff',
        background_color: '#151515',
        display: 'standalone',
        orientation: 'any',
        // start_url relatif à la base — vite-plugin-pwa l'ajuste automatiquement
        start_url: base + 'pos/quick',
        scope: base,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['business', 'productivity'],
        lang: 'fr',
        // Raccourcis PWA — apparaissent sur l'écran d'accueil (appui long)
        shortcuts: [
          {
            name: 'Caisse Rapide',
            short_name: 'Caisse',
            url: base + 'pos/quick',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Z-Caisse',
            short_name: 'Z-Caisse',
            url: base + 'z-caisse',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        navigateFallback: base + 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10000000,
        // Mise en cache des pages critiques offline
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Désactivé en dev pour éviter les conflits avec HMR
      },
    }),
    cloudflare()
  ],
  server: {
    host: true,
    https: true,
    port: 5177,
    strictPort: true,
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
    },
  },
}))