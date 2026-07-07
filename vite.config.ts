import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoBase = '/Jarvis/'

export default defineConfig({
  base: repoBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Jarvis Eroica',
        short_name: 'Jarvis',
        description: 'PWA per monitorare gli allenamenti di ciclismo verso Eroica.',
        theme_color: '#f6efe2',
        background_color: '#f6efe2',
        display: 'standalone',
        scope: repoBase,
        start_url: repoBase,
        icons: [
          {
            src: `${repoBase}logo.jpg`,
            sizes: '1024x1024',
            type: 'image/jpeg',
          },
        ],
      },
    }),
  ],
})
