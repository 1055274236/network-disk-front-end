import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
// import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(router).use(createPinia())
app.mount('#app')
