<template>
  <div class="container">
    <h1>Enter User Details</h1>
    <form @submit.prevent="register">
      <div class="form-group">
        <label for="name">Username</label>
        <input type="text" id="name" v-model="name" required />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <div class="form-group">
        <label for="passwordConfirmation">Confirm Password</label>
        <input type="password" id="passwordConfirmation" v-model="passwordConfirmation" required />
      </div>

      <div class="form-group">
        <label for="roles">Roles</label>
        <ul class="badge-list">
          <li
            v-for="role in roles"
            :key="role.id"
            class="badge-item"
            @click="addToAwaitingRequest(role)"
            style="cursor:pointer"
          >
            <span class="badge">{{ role.name }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h2>Awaiting Request</h2>
        <ul>
          <li v-for="selectedRole in selectedRoles" :key="selectedRole.id">
            {{ selectedRole.name }}
            <button type="button" @click="removeFromAwaitingRequest(selectedRole)">X</button>
          </li>
        </ul>
      </div>

      <div class="button-container">
        <button type="submit">Register</button>
        <button class="btn btn-warning" type="button" @click="resetForm">Reset</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import '../assets/css/login.css';

// reactive state
const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const roles = ref([]);
const selectedRoles = ref([]);

// fetch roles
async function getAllRoles() {
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/role');
    // If your API wraps data (e.g. { data: [...] }) adapt accordingly
    roles.value = response.data;
  } catch (error) {
    console.error('Fetching roles error:', error);
  }
}

// register user
async function register() {
  try {
    const userPayload = {
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    };

    if (selectedRoles.value.length > 0) {
      userPayload.roles = selectedRoles.value.map(role => ({
        id: role.id,
        pivot: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }));
    }

    const response = await axios.post('http://127.0.0.1:8000/api/register', userPayload);

    console.log('User registered:', response.data);

    // Clear form after success
    resetForm();
  } catch (error) {
    console.error('Registration error:', error);
  }
}

function resetForm() {
  name.value = '';
  email.value = '';
  password.value = '';
  passwordConfirmation.value = '';
  selectedRoles.value = [];
}

function addToAwaitingRequest(role) {
  if (!selectedRoles.value.some(r => r.id === role.id)) {
    selectedRoles.value.push(role);
  }
}

function removeFromAwaitingRequest(selectedRole) {
  const idx = selectedRoles.value.findIndex(r => r.id === selectedRole.id);
  if (idx !== -1) selectedRoles.value.splice(idx, 1);
}

// lifecycle
onMounted(() => {
  getAllRoles();
});
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
