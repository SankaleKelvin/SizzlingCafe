<template>
  <v-container fluid class="pa-6 fill-height d-flex align-center justify-center bg-blue-grey-lighten-5">
    <v-card elevation="8" max-width="600" class="pa-8 text-center rounded-xl">
      <v-img src="/img1.png" max-width="120" class="mx-auto mb-4"></v-img>

      <h1 class="text-h4 font-weight-bold mb-3">Welcome to Sizzling Cafe</h1>
      <p class="text-body-1 mb-6">
        Welcome for a variety of meals.
      </p>

      <v-divider class="my-4"></v-divider>

      <v-row justify="center" class="mt-4">
        <v-col cols="12" sm="4">
          <v-btn
            block
            color="blue"
            dark
            @click="goTo('LoginPage')"
            prepend-icon="mdi-login"
          >
            Login
          </v-btn>
        </v-col>

        <v-col cols="12" sm="4">
          <v-btn
            block
            color="green"
            dark
            @click="goTo('SignupPage')"
            prepend-icon="mdi-account-plus"
          >
            Register
          </v-btn>
        </v-col>

        <v-col cols="12" sm="4" v-if="isAuthenticated">
          <v-btn
            block
            color="deep-purple"
            dark
            @click="goTo('dashboard')"
            prepend-icon="mdi-view-dashboard"
          >
            Dashboard
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Check login status from store
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Navigation helper
const goTo = (routeName) => {
  router.push({ name: routeName })
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
