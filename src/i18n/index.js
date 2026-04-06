import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhHans from './zhHans.json'
import zhHant from './zhHant.json'
import ja from './ja.json'

import { en as vuetifyEn, zhHans as vuetifyZhHans, zhHant as vuetifyZhHant, ja as vuetifyJa } from 'vuetify/locale'

export const languageOptions = [
  { text: 'English', value: 'en' },
  { text: '日本語', value: 'ja' },
  { text: '简体中文', value: 'zhHans' },
  { text: '繁体中文', value: 'zhHant' }
];

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
};

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});

export default i18n;
