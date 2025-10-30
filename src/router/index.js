import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutUs from '../views/AboutView.vue'
import LoginPage from '../views/LoginPage.vue'
import WelcomePage from '@/views/WelcomePage.vue'
import TokenService from '@/services/TokenService'
import UsersPage from '@/views/UsersPage.vue'
import SignupPage from '@/views/SignupPage.vue'
import RolesPage from '@/views/RolesPage.vue'
import RestaurantPage from '@/views/RestaurantPage.vue'
import CategoriesPage from '@/views/CategoriesPage.vue'

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
      path: '/signup',
      name: 'SignupPage',      
      component: SignupPage,
    },
    {
      path: '/welcome',
      name: 'WelcomePage',      
      component: WelcomePage,
      meta:{
        requiresAuth: true
      }
    },
    {
      path: '/users',
      name: 'UsersPage',      
      component: UsersPage,
      meta:{
        requiresAuth: true
      }
    },
    {
      path: '/roles',
      name: 'RolesPage',      
      component: RolesPage,
      meta:{
        requiresAuth: true
      }
    },
    {
      path: '/restaurants',
      name: 'RestaurantsPage',      
      component: RestaurantPage,
      meta:{
        requiresAuth: true
      }
    },
    {
      path: '/categories',
      name: 'CategoriesPage',      
      component: CategoriesPage,
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
