import { createApp } from 'vue'

import VueEasymde from 'vue3-easymde'
import "easymde/dist/easymde.min.css"

import './style.css'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')
app.use(VueEasymde)
