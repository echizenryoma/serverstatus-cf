import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
// Plugins
import Components from 'unplugin-vue-components/vite'
// Utilities
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

import pkg from './package.json' with { type: 'json' }

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 2000, // in kB
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
  ],
  optimizeDeps: {
    exclude: [
      'vue-router',
    ],
    // Vuetify 4: keep overlay modules pre-bundled together so the shared
    // z-index stack (useStack) is not duplicated in dev mode.
    // https://vuetifyjs.com/en/getting-started/upgrade-guide/#vite-overlay-z-index-in-dev-mode
    include: [
      'vuetify/components/VOverlay',
      'vuetify/components/VDialog',
      'vuetify/components/VMenu',
      'vuetify/components/VSelect',
      'vuetify/components/VTooltip',
    ],
  },
  define: {
    'process.env': {},
    '__APP_VERSION__': JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'if-function'],
      },
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'if-function'],
      },
    },
  },
})
