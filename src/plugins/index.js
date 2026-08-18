/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

import router from '@/router'
import i18n from '../i18n'
// Plugins
import vuetify from './vuetify'

export function registerPlugins (app) {
  app
    .use(i18n)
    .use(vuetify)
    .use(router)
}
