<template>
  <v-container>
    <h1>WelcomePage</h1>
    <v-btn @click="logout">Logout</v-btn>
  </v-container>
</template>

<script setup>
import router from '@/router';
import TokenService from '../services/TokenService';

function logout(){
  TokenService.logout();
  router.push('/login')
}
</script>
