import { createI18n } from 'vue-i18n'
import { en as vuetifyEn, ja as vuetifyJa, zhHans as vuetifyZhHans, zhHant as vuetifyZhHant } from 'vuetify/locale'
import en from './en.json'
import ja from './ja.json'
import zhHans from './zhHans.json'
import zhHant from './zhHant.json'

export const languageOptions = [
  { text: 'English', value: 'en' },
  { text: '日本語', value: 'ja' },
  { text: '简体中文', value: 'zhHans' },
  { text: '繁体中文', value: 'zhHant' },
]

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
  zhHant: {
    ...zhHant,
    $vuetify: {
      ...vuetifyZhHant,
    },
  },
  ja: {
    ...ja,
    $vuetify: {
      ...vuetifyJa,
    },
  },
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n
