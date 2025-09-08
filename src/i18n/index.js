import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhHans from './zhHans.json'

import { en as vuetifyEn, zhHans as vuetifyZhHans } from 'vuetify/locale'

export const messages = {
  en: {
    ...en,
    $vuetify: {
      ...vuetifyEn,
    },
  },
  zhHans: {
    ...zhHans,
    $vuetify: {
      ...vuetifyZhHans,
    },
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: 'zhHans',
  fallbackLocale: 'en',
  messages,
})

export default i18n
