/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import { createHead } from '@vueuse/head'

// Styles
import 'unfonts.css'

// i18n
import i18n from '@/i18n'

const app = createApp(App)
const head = createHead()

registerPlugins(app)

app.use(i18n)
app.use(head)

app.mount('#app')
