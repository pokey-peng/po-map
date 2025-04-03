import { defineConfig, presetWind3, presetIcons, presetAttributify, presetWebFonts } from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  presets: [
    presetWind3({
      dark: 'class',
      variants: [
        // 自定义变体 active: 为类名为 active 的元素添加的样式
        // 例如: active:bg-red-500 .active { background-color: red; }
        (matcher) => {
          // Custom active variant
          if (matcher.startsWith('active:')) {
            return {
              matcher: matcher.slice(7),
              selector: (s) => `${s}.active`,
            }
          }

          // Parent selector variant (for nested elements)
          if (matcher.startsWith('parent:')) {
            return {
              matcher: matcher.slice(7),
              selector: (s) => `.parent ${s}`,
            }
          }

          // Custom variant for selected items
          if (matcher.startsWith('selected:')) {
            return {
              matcher: matcher.slice(9),
              selector: (s) => `${s}.selected`,
            }
          }

          // Custom variant for open state
          if (matcher.startsWith('open:')) {
            return {
              matcher: matcher.slice(5),
              selector: (s) => `${s}[open]`,
            }
          }

          // First child variant
          if (matcher.startsWith('first:')) {
            return {
              matcher: matcher.slice(6),
              selector: (s) => `${s}:first-child`,
            }
          }
          return matcher
        },
      ],
    }),
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
