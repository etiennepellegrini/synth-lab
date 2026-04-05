import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  // Use '/' for dev, '/synth-course/' for production (GitHub Pages)
  base: command === 'serve' ? '/' : '/synth-course/',

  // Serve from src/ directory
  root: 'src',

  // Public assets directory
  publicDir: '../public',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'fonts/*.woff2'],
      manifest: false,  // Use public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365  // 1 year
              }
            }
          }
        ]
      }
    })
  ],

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        synth: resolve(__dirname, 'src/synth.html'),
        course: resolve(__dirname, 'src/course.html')
      }
    }
  }
}));
