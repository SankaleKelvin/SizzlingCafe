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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TokenService from '../services/TokenService';
import api from '../services/api';

const router = useRouter();

const username = ref('');
const password = ref('');

// on mount, if token exists redirect
onMounted(() => {
  const t = TokenService.getToken();
  if (t !== null && t !== '') {
    router.push('/welcome');
  }
});

async function login() {
  try {
    console.log('Trying to authenticate', username.value);
    const response = await api.post('login', {
      email: username.value,
      password: password.value,
    });

    const token = response?.data;
    if (!token) {
      console.error('No token returned from login response', response);
      return;
    }

    TokenService.setToken(token);

    // if TokenService.userInfo() is synchronous it will run immediately,
    // if it returns a promise we await it to ensure user info is fetched
    try {
      const maybePromise = TokenService.userInfo();
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
    } catch (err) {
      // non-fatal — log and continue
      console.warn('TokenService.userInfo() failed', err);
    }

    // Clear the form inputs
    username.value = '';
    password.value = '';

    console.log('Login successful');
    router.push('/welcome');
  } catch (error) {
    console.error('Login failed', error);
  }
}

function register() {
  router.push('/signup');
}
</script>

