<template>
  <v-container class="login-container mt-5">
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title class="headline">Please Login ...</v-card-title>
          <v-form @submit.prevent="login">
            <v-text-field label="Username" v-model="username" required />
            <v-text-field label="Password" type="password" v-model="password" required />
            <v-btn type="submit" color="primary">Login</v-btn>
            <v-btn text @click="register">Not yet registered? Register</v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '../services/api'
import router from '@/router'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')

async function login() {
  try {
    console.log('Trying to authenticate', username.value)
    const response = await api.post('login', {
      email: username.value,
      password: password.value,
    })

    authStore.login(response?.data)
    // Clear the form inputs
    username.value = ''
    password.value = ''
    router.push('/welcome')
  } catch (error) {
    console.error('Login failed', error)
  }
}

onMounted(()=>{
  if (!sessionStorage.getItem('reloaded')) {
    sessionStorage.setItem('reloaded', 'true')
    window.location.reload()
  } else {
    sessionStorage.removeItem('reloaded')
  }
})

function register() {
  router.push('/signup')
}
</script>
