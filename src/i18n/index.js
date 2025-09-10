import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhHans from './zhHans.json'
import zhHant from './zhHant.json'

import { en as vuetifyEn, zhHans as vuetifyZhHans, zhHant as vuetifyZhHant } from 'vuetify/locale'

export const languageOptions = [
  { text: '简体中文', value: 'zhHans' },
  { text: '繁体中文', value: 'zhHant' },
  { text: 'English', value: 'en' }
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
};

export const i18n = createI18n({
  legacy: false,
  locale: 'zhHans',
  fallbackLocale: 'en',
  messages,
});

export default i18n;
