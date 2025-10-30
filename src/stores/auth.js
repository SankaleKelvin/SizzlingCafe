import router from '@/router';
import TokenService from '@/services/TokenService'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    
    token: TokenService.getToken(),
    user: TokenService.getUser()
    
  }),
  actions: {
    login(token) {
      this.token = token;
      TokenService.setToken(token)
      router.push('/welcome')
    },
    logout() {
        this.token = null
        TokenService.logout()
    },
  },
})
