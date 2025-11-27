/* eslint-env node */

import { configure } from 'quasar/wrappers';

export default configure((/* ctx */) => {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/supporting-ts
    supportTS: true,

    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['pinia'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.scss'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#extras
    extras: [
      'roboto-font',
      'material-icons',
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
        node: 'node20'
      },

      vueRouterMode: 'history',

      vitePlugins: [
        ['@vitejs/plugin-vue', {
          template: {
            compilerOptions: {}
          }
        }]
      ]
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      open: true
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        dark: 'auto',
        brand: {
          primary: '#7c3aed',
          secondary: '#38bdf8',
          accent: '#22d3ee',
          dark: '#0f172a',
          positive: '#22c55e',
          negative: '#ef4444',
          info: '#38bdf8',
          warning: '#f59e0b'
        }
      },

      plugins: [
        'Dialog',
        'Notify',
        'Loading',
        'LocalStorage',
        'SessionStorage',
        'Dark',
        'AppFullscreen'
      ]
    },

    // animations: 'all', // --- includes all animations
    animations: ['fadeIn', 'fadeOut', 'slideInUp', 'slideOutDown'],

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      pwa: false
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,

      manifest: {
        name: 'TicTacStick Quote Engine',
        short_name: 'TicTacStick',
        description: 'Professional quoting tool for 925 Pressure Glass - Window & Pressure Cleaning',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0f172a',
        theme_color: '#7c3aed',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        categories: ['business', 'productivity', 'finance']
      },

      workboxOptions: {
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
              }
            }
          }
        ]
      }
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      bundler: 'packager'
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      contentScripts: ['my-content-script']
    }
  };
});
