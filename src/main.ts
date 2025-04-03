import '@unocss/reset/sanitize/sanitize.css'
import '@unocss/reset/sanitize/assets.css'
import './assets/main.css'
import 'virtual:uno.css'
import 'mapbox-gl/dist/mapbox-gl.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'zh',
  messages: {
    zh: {
      message: {
        hello: '你好，世界',
      },
    },
    en: {
      message: {
        hello: 'Hello World',
      },
    },
  },
})

const app = createApp(App)

app.use(i18n)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
    },
  },
})

app.use(createPinia())
app.use(router)

app.mount('#app')
