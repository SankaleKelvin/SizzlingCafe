<template>
  <v-navigation-drawer
    v-model="drawer"
    :color="computedColor"
    dark
    app
    class="red darken-4"
    v-if="shouldShowFooter"
  >
    <v-layout column align-center>
      <v-flex class="my-2 mx-auto text-center">
        <v-avatar size="100">
          <v-img src="/img1.png" />
        </v-avatar>
        <p class="white--text subheading mt-1 text-center">Username</p>
      </v-flex>
    </v-layout>

    <v-list flat>
      <v-list-item
        v-for="link in links"
        :key="link.text"
        :to="link.route"
        router
        active-class="border"
      >
        <v-list-item-content v-if="!link.children" class="d-flex align-center">
          <v-icon>{{ link.icon }}</v-icon>
          <span class="ml-2">{{ link.text }}</span>
        </v-list-item-content>

        <v-list-item-content v-else>
          <v-list-group :value="link.text">
            <template v-slot:activator="{ props }">
              <v-list-item class="pl-0" v-bind="props">
                <v-icon>{{ link.icon }}</v-icon>
                <span class="ml-2">{{ link.text }}</span>
              </v-list-item>
            </template>

            <v-list-item
              v-for="child in link.children"
              :key="child.text"
              :to="child.route"
              router
              class="d-flex align-center"
            >
              <v-list-item-content :to="child.route" class="d-flex align-center">
                <v-icon>{{ child.icon }}</v-icon>
                <span class="ml-2">{{ child.text }}</span>
              </v-list-item-content>
            </v-list-item>
          </v-list-group>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar color="blue" dark app>
    <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
    <v-toolbar-title class="text-uppercase">
      <span class="font-weight-light">Sizzling Cafe</span>
    </v-toolbar-title>
    <v-spacer />
    <v-menu offset-y>
      <template v-slot:activator="{ props }">
        <v-btn text v-bind="props">
          <v-icon left>mdi-chevron-down</v-icon>
          <span>Menu</span>
        </v-btn>
      </template>
      <v-list flat>
        <v-list-item
          v-for="link in links"
          :key="link.text + '-menu'"
          :to="link.route"
          router
          active-class="border"
        >
          <v-list-item-title>{{ link.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn text @click="toggleAuthentication">
      <span>{{ authenticated ? 'Logout' : 'Login' }}</span>
      <v-icon right>{{ authenticated ? 'mdi-logout' : 'mdi-login' }}</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useColorsStore } from '../stores/colors'
import TokenService from '@/services/TokenService'

const router = useRouter()
const route = useRoute()
const colors = useColorsStore()

// local state
const drawer = ref(true)
const authenticated = ref(false)

// links (same shape as your original)
const links = ref([
  { icon: 'mdi-home', text: 'Home', route: '/' },
  {
    icon: 'mdi-tools',
    text: 'User Access',
    children: [
      { icon: 'mdi-account-card', text: 'Users', route: '/users' },
      { icon: 'mdi-clipboard-text', text: 'Roles', route: '/roles' },
      { icon: 'mdi-progress-wrench', text: 'Categories', route: '/categories' },
    ],
  },
  { icon: 'mdi-account', text: 'Restaurant', route: '/restaurants' },
])

// computed color from store
const computedColor = computed(() => colors.footerColor)

// show footer logic (mirrors your computed)
const shouldShowFooter = computed(() => {
  // authenticated.value = !!TokenService.getToken()
  return route.name !== 'Home'
})

function toggleAuthentication() {
  
  if (authenticated.value) {
    router.push('/login')
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.border {
  border-left: 4px solid #0ba518;
}
</style>
