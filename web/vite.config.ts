import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Milestone 1 ships at /next/ so the live homepage is untouched until the
// showreel is approved. Change base to '/' when this replaces index.html.
export default defineConfig({
  base: '/next/',
  plugins: [react()],
  build: { outDir: 'dist', assetsInlineLimit: 0, target: 'es2020' },
})
