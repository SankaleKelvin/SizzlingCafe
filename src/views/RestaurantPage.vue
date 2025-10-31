<template>
  <v-container>
    <!-- Snackbars -->
    <v-snackbar v-model="snackbarCreate" :timeout="snackbarTimeout" color="success">
      Restaurant created successfully.
      <v-btn text @click="snackbarCreate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarUpdate" :timeout="snackbarTimeout" color="warning">
      Restaurant updated successfully.
      <v-btn text @click="snackbarUpdate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarDelete" :timeout="snackbarTimeout" color="error">
      Restaurant deleted successfully.
      <v-btn text @click="snackbarDelete = false">Close</v-btn>
    </v-snackbar>

    <!-- Data table -->
    <v-data-table :headers="headers" :items="restaurantsStore.restaurants" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat color="blue">
          <v-toolbar-title>Restaurants</v-toolbar-title>
          <v-spacer></v-spacer>

          <v-btn color="white" style="background-color:gray;" @click="openCreate">New Restaurant</v-btn>
        </v-toolbar>
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <v-icon small class="me-2" @click="onEdit(item.id)">mdi-pencil</v-icon>
        <v-icon small @click="onDelete(item.id)">mdi-delete</v-icon>
      </template>

      <template v-slot:no-data>
        <v-btn color="primary" @click="refresh">Reload</v-btn>
      </template>
    </v-data-table>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="restaurantsStore.dialog" max-width="600px" @click:outside="closeDialog">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="restaurantsStore.editedItem.name" label="Name"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="restaurantsStore.editedItem.address" label="Address"></v-text-field>                            
              </v-col>
              <v-col cols="12" md="12">
                <v-textarea v-model="restaurantsStore.editedItem.description" label="Description"></v-textarea>                            
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog">Cancel</v-btn>
          <v-btn text @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="dialogDelete" max-width="400px" @click:outside="closeDelete">
      <v-card>
        <v-card-title class="text-h6">Confirm delete?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDelete">Cancel</v-btn>
          <v-btn text color="error" @click="confirmDelete">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRestaurantsStore } from '@/stores/restaurants'
import { useColorsStore } from '@/stores/colors'

const restaurantsStore = useRestaurantsStore()
const colors = useColorsStore()

const snackbarTimeout = 1500

const snackbarCreate = computed({
  get: () => restaurantsStore.snackbarCreate,
  set: (v) => (restaurantsStore.snackbarCreate = v),
})
const snackbarUpdate = computed({
  get: () => restaurantsStore.snackbarUpdate,
  set: (v) => (restaurantsStore.snackbarUpdate = v),
})
const snackbarDelete = computed({
  get: () => restaurantsStore.snackbarDelete,
  set: (v) => (restaurantsStore.snackbarDelete = v),
})

const dialog = computed({
  get: () => restaurantsStore.dialog,
  set: (v) => (restaurantsStore.dialog = v),
})
const dialogDelete = computed({
  get: () => restaurantsStore.dialogDelete,
  set: (v) => (restaurantsStore.dialogDelete = v),
})

const editedItem = computed(() => restaurantsStore.editedItem)
const formTitle = computed(() => (restaurantsStore.editedIndex === -1 ? 'New Restaurant' : 'Edit Restaurant'))

const headers = [
  { title: 'ID', key: 'id', sortable: false, align: 'start' },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Address', key: 'address', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// base url for server images
const BASE = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';

// lifecycle
onMounted(() => {
  restaurantsStore.fetchRestaurants()
})


// actions (kept your original signatures/behavior)
function openCreate() {
  restaurantsStore.openDialog()
}

async function onEdit(id) {
  await restaurantsStore.editItem(id)
}

function onDelete(id) {
  restaurantsStore.openDelete(id)
}

function closeDialog() {
  restaurantsStore.closeDialog()
}

function closeDelete() {
  restaurantsStore.closeDelete()
}

async function save() {
  // build FormData
  const fd = new FormData()
  fd.append('name', editedItem.value.name || '')
  fd.append('address', editedItem.value.address || '')
  fd.append('description', editedItem.value.description || '')


  try {
    if (restaurantsStore.editedIndex > -1) {
      // update
      await restaurantsStore.updateRestaurant(restaurantsStore.editedIndex, fd)
      snackbarUpdate.value = true
      colors.setFooterColor('warning') // optional
    } else {
      // create
      if (!editedItem.value.password) {
        console.warn('Password required for create')
      }
      await restaurantsStore.createRestaurant(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success') // optional
    }

    // refresh list to ensure consistent state
    await restaurantsStore.fetchRestaurants()
    restaurantsStore.closeDialog()
  } catch (err) {
    console.error('save error', err)
  } finally {
    // reset color after timeout (optional)
    setTimeout(() => {
      colors.setFooterColor('info')
    }, snackbarTimeout + 200)
  }
}

async function confirmDelete() {
  if (!restaurantsStore.deletingId) return
  try {
    await restaurantsStore.deleteRestaurant(restaurantsStore.deletingId)
    snackbarDelete.value = true
  } catch (err) {
    console.error('confirmDelete error', err)
  } finally {
    await restaurantsStore.fetchRestaurants()
  }
}

function refresh() {
  restaurantsStore.fetchRestaurants()
}
</script>

