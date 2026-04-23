import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Gold ERP POS',
        short_name: 'GoldERP',
        theme_color: '#000000',
        icons: []
      }
    })
  ],
})
