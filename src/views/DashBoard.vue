<template>
  <v-container class="pa-6">
    <h1 class="text-h4 font-weight-bold mb-6">Dashboard</h1>

    <v-row>
      <v-col cols="12" md="4">
        <v-card elevation="6" class="pa-4">
          <h2 class="text-h5 font-weight-bold">Pending Orders</h2>
          <p class="text-h3">{{ pending }}</p>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="6" class="pa-4">
          <h2 class="text-h5 font-weight-bold">Served Orders</h2>
          <p class="text-h3">{{ served }}</p>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="6" class="pa-4">
          <h2 class="text-h5 font-weight-bold">Today's Sales (Ksh)</h2>
          <p class="text-h3">{{ todaySales }}</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'   // if you use a custom axios instance  

const pending = ref(0)
const served = ref(0)
const todaySales = ref(0)

onMounted(async () => {
  try {
    // const res = await axios.get('/dashboard-stats')
    // pending.value = res.data.pending
    // served.value = res.data.served
    // todaySales.value = res.data.today_sales
  } catch (err) {
    console.error('Failed to load dashboard stats:', err)
  }
})
</script>
