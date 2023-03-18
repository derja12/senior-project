import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/Main.vue'
import LoginView from '../views/Login.vue'
import RegisterView from '../views/Register.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'main',
            component: MainView
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView 
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView
        }
    ]
})

export default router
