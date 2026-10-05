import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const local = loadEnv(mode, root, '')
  const parent = loadEnv(mode, path.resolve(root, '..'), '')
  const key =
    process.env.VITE_GEMINI_API_KEY ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    local.VITE_GEMINI_API_KEY ||
    local.EXPO_PUBLIC_GEMINI_API_KEY ||
    parent.EXPO_PUBLIC_GEMINI_API_KEY ||
    ''

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icon.png', 'favicon.png'],
        manifest: {
          id: '/',
          name: 'Care',
          short_name: 'Care',
          description: 'Подбор уходовой косметики',
          lang: 'ru',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f1eeea',
          theme_color: '#f1eeea',
          icons: [
            { src: 'favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,jpg,svg,webp,woff2}'],
          navigateFallback: 'index.html',
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: [
        { find: 'expo-constants', replacement: path.resolve(root, 'src/shims/expo-constants.ts') },
        { find: 'expo-image-manipulator', replacement: path.resolve(root, 'src/shims/expo-image-manipulator.ts') },
        { find: /^@\//, replacement: `${path.resolve(root, '../src').replace(/\\/g, '/')}/` },
      ],
    },
    define: {
      'process.env.EXPO_PUBLIC_GEMINI_API_KEY': JSON.stringify(key),
    },
    server: {
      fs: { allow: [path.resolve(root, '..')] },
      host: true,
      port: 4173,
    },
    preview: { host: true, port: 4173 },
  }
})
