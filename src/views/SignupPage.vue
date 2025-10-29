<template>
  <v-container class="login-container mt-5">
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title class="headline">Please Sign Up ...</v-card-title>
          <form @submit.prevent="register">
            <v-text-field label="Username" v-model="name" required />
            <v-text-field label="email" type="email" v-model="email" required />
            <v-text-field label="Password" type="password" v-model="password" required />
            <v-text-field
              label="Password Confirmation"
              type="password"
              v-model="password_confirmation"
              required
            />
            <v-btn type="submit" color="primary">Sign Up</v-btn>
            <v-btn text @click="login">Already registered? Login</v-btn>
          </form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import '../assets/css/login.css'
import api from '../services/api';

// reactive state
const name = ref('')
const email = ref('')
const password = ref('')
const password_confirmation = ref('')


// register user
async function register() {
  try {
    const userPayload = {
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    }

    const response = await api.post('/register', userPayload)

    console.log('User registered:', response.data)

    // Clear form after success
    resetForm()
  } catch (error) {
    console.error('Registration error:', error)
  }
}

function resetForm() {
  name.value = ''
  email.value = ''
  password.value = ''
  password_confirmation.value = ''
}

</script>

<style scoped>
.badge-list {
  list-style: none;
  padding: 0;
}

.badge {
  display: inline-block;
  padding: 0.25em 0.5em;
  background-color: #007bff;
  color: #fff;
  border-radius: 0.25rem;
  margin-right: 0.5em;
}

.badge-item {
  display: inline-block;
}
</style>
