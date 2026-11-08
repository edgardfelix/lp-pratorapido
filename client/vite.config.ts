import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:8787';

// On Vercel, absolute URLs (canonical, Open Graph, JSON-LD) follow the
// project's production domain unless VITE_SITE_URL is set explicitly.
if (!process.env.VITE_SITE_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.VITE_SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: { '/api': { target: API_TARGET, changeOrigin: false } },
  },

  preview: {
    port: 4173,
    proxy: { '/api': { target: API_TARGET, changeOrigin: false } },
  },

  build: {
    target: 'es2022',
    // No source maps in production: the shipped code is minified and mangled.
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
    modulePreload: { polyfill: false },
    minify: isSsrBuild ? false : 'terser',
    terserOptions: {
      ecma: 2020,
      module: true,
      toplevel: true,
      compress: {
        passes: 2,
        drop_console: true,
        drop_debugger: true,
        pure_getters: true,
      },
      mangle: { toplevel: true },
      format: { comments: false },
    },
  },

  ssr: {
    // Bundle these into the prerender build so the server render uses the
    // exact same module instances and CSS-in-JS ids as the browser bundle.
    noExternal: ['styled-components', '@base-ui/react', 'input-otp'],
  },
}));
