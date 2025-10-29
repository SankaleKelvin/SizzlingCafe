import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutUs from '../views/AboutView.vue'
import LoginPage from '../views/LoginPage.vue'
import WelcomePage from '@/views/WelcomePage.vue'
import TokenService from '@/services/TokenService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',      
      component: AboutUs,
    },
    {
      path: '/login',
      name: 'LoginPage',      
      component: LoginPage,
    },
    {
      path: '/welcome',
      name: 'WelcomePage',      
      component: WelcomePage,
      meta:{
        requiresAuth: true
      }
    }
  ],
})

router.beforeEach((to,from,next)=>{
  if(to.matched.some(path=> path.meta.requiresAuth)){
    if(!TokenService.getToken())
      return next('/login')
  }
  next()
})

export default router
