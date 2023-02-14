import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import App from './App.vue'
import router from './router'

// vuetify/mdi icons
import 'vuetify/styles'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

// custom css (if needed)
import './assets/main.css'

const app = createApp(App)



const vuetify = createVuetify({
  components,
  directives,
})

app.use(vuetify).use(router)

app.mount('#app')
