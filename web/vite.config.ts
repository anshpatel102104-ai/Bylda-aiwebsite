import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app is the homepage, served from the site root.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: { outDir: 'dist', assetsInlineLimit: 0, target: 'es2020' },
})
