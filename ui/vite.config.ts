import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/ping': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/session': 'http://localhost:5000',
      '/callback': 'http://localhost:5000',
      '/history': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
    }
  }
})
