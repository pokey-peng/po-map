import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode, isPreview }) => {
  const isDev = mode === 'development' ? true : false
  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      viteCompression(),
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
      UnoCSS(),
      AutoImport({
        include: [
          /\.[jt]sx?$/, // .js, .jsx, .ts, .tsx
          /\.vue\??/, // .vue
        ],
        dts: 'src/auto-imports.d.ts', // 配置文件生成位置
        imports: ['vue', 'vue-router', 'pinia', 'vue-i18n', '@vueuse/core'],
        resolvers: [PrimeVueResolver()],
        vueTemplate: true,
      }),

      Components({
        dts: 'src/components.d.ts', // 配置文件生成位置
        resolvers: [PrimeVueResolver()],
        extensions: ['vue'],
      }),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 6176,
      host: '0.0.0.0',
      hmr: {
        overlay: true,
      },
    },
    esbuild: {
      drop: mode === 'production' && !isPreview ? ['console', 'debugger'] : undefined,
    },
    build: {
      target: ['esnext', 'chrome58', 'firefox57', 'safari11'],
      outDir: 'dist',
      sourcemap: isDev,
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // 以 node_modules 为分割点，将 node_modules 中的模块打包到一个独立的 chunk 中， 一些较大的库可以单独打包如mapbox-gl
              // if (id.includes('mapbox-gl')) {
              //   return 'mapbox-gl'
              // }
              if (id.includes('prettier')) {
                return
              }
              return id.toString().split('node_modules/')[1].replace('.pnpm/', '').split('/')[0]
            }
          },
        },
      },
    },
  }
})
