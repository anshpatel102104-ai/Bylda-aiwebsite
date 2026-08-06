import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Builds the black hole as one self-contained file for the static site.
 *
 * inlineDynamicImports collapses the lazy chunk back in, because the static
 * site has no module preload graph to resolve a second request against — the
 * laziness that matters here is that index.html does not import this at all
 * until the hero isnear the viewport.
 */
export default defineConfig({
  plugins: [react()],
  // The static site owns its own assets; copying public/ here would dump
  // duplicates of the site's images into the output folder.
  publicDir: false,
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    outDir: path.resolve(__dirname, '../hero'),
    emptyOutDir: true,
    minify: true,
    target: 'es2020',
    assetsInlineLimit: 4096,
    cssCodeSplit: false,
    // Deliberately not `build.lib`. Library mode under Vite 8 / rolldown skips
    // minification here, which doubled the bundle; a plain app build with an
    // explicit entry minifies normally and produces the same single file.
    rollupOptions: {
      input: path.resolve(__dirname, 'src/island.tsx'),
      output: {
        format: 'es',
        entryFileNames: 'black-hole.js',
        inlineDynamicImports: true,
      },
    },
  },
})
