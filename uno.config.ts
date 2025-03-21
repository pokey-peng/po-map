import { defineConfig } from 'unocss'
import { presetWind3, presetIcons, presetAttributify, presetWebFonts } from 'unocss'
import {} from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        // 支持中文英文字体
        sans: ['Noto Sans SC', 'sans-serif', 'Roboto', 'Arial'],
        mono: ['Fira Code', 'Fira Mono:400,700', 'monospace'],
        lobster: 'Lobster',
        lato: [
          {
            name: 'Lato',
            weights: ['400', '700'],
            italic: true,
          },
          {
            name: 'sans-serif',
            provider: 'none',
          },
        ],
      },
    }),
  ],
})
