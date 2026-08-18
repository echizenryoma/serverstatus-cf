/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// i18n
import i18n from '@/i18n'
// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

const app = createApp(App)

registerPlugins(app)

app.use(i18n)

app.mount('#app')
