<template>
  <v-container>
    <!-- Snackbars -->
    <v-snackbar v-model="snackbarCreate" :timeout="snackbarTimeout" color="success">
      Food created successfully.
      <v-btn text @click="snackbarCreate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarUpdate" :timeout="snackbarTimeout" color="warning">
      Food updated successfully.
      <v-btn text @click="snackbarUpdate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarDelete" :timeout="snackbarTimeout" color="error">
      Food deleted successfully.
      <v-btn text @click="snackbarDelete = false">Close</v-btn>
    </v-snackbar>

    <!-- Data table -->
    <v-data-table :headers="headers" :items="foodsStore.foods" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat color="primary">
          <v-toolbar-title>Foods</v-toolbar-title>
          <v-spacer></v-spacer>

          <v-btn color="white" style="background-color: grey;" @click="openCreate">New Food</v-btn>
        </v-toolbar>
      </template>

      <template v-slot:[`item.food_image`]="{ item }">
        <v-img
          :src="getImageUrl(item.food_image)"
          alt="Food"
          width="48"
          height="48"
          v-if="item.food_image"
        ></v-img>
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
    <v-dialog v-model="foodsStore.dialog" max-width="600px" @click:outside="closeDialog">
      <v-card>
        <v-card-title style="background-color: cornflowerblue;">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="foodsStore.editedItem.name" label="Name"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="foodsStore.editedItem.food_code"
                  label="Food Code"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="foodsStore.editedItem.price"
                  label="Food Price"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  :items="restaurantsStore.restaurants"
                  v-model="foodsStore.editedItem.restaurant_id"
                  label="Restaurant"
                  item-value="id"
                  item-title="name"
                  :return-object="false"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  :items="categoriesStore.categories"
                  v-model="foodsStore.editedItem.category_id"
                  label="Categories"
                  item-value="id"
                  item-title="name"
                  :return-object="false"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-file-input
                  v-model="foodsStore.editedItem.food_image"
                  label="Upload Image"
                  accept="image/*"
                  show-size
                  @change="onFileChange"
                ></v-file-input>

                <!-- preview: new file if selected, otherwise existing image -->
                <v-img v-if="filePreview" :src="filePreview" width="200" height="200"></v-img>
                <v-img
                  v-else-if="foodsStore.editedItem.food_image"
                  :src="getImageUrl(foodsStore.editedItem.food_image)"
                  width="200"
                  height="200"
                ></v-img>
              </v-col>

              <v-col cols="12" md="12">
                <v-textarea
                  v-model="foodsStore.editedItem.description"
                  label="Description"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn style="background-color: coral;" text @click="closeDialog">Cancel</v-btn>
          <v-btn style="background-color: cornflowerblue;" text @click="save">Save</v-btn>
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
import { ref, computed, onMounted } from 'vue'
import { useFoodsStore } from '@/stores/foods'
import { useRestaurantsStore } from '@/stores/restaurants'
import { useColorsStore } from '@/stores/colors'
import { useCategoriesStore } from '@/stores/categories'

const foodsStore = useFoodsStore()
const restaurantsStore = useRestaurantsStore()
const categoriesStore = useCategoriesStore()
const colors = useColorsStore()

// local reactive refs
const image = ref(null)
const snackbarTimeout = 1500

const snackbarCreate = computed({
  get: () => foodsStore.snackbarCreate,
  set: (v) => (foodsStore.snackbarCreate = v),
})
const snackbarUpdate = computed({
  get: () => foodsStore.snackbarUpdate,
  set: (v) => (foodsStore.snackbarUpdate = v),
})
const snackbarDelete = computed({
  get: () => foodsStore.snackbarDelete,
  set: (v) => (foodsStore.snackbarDelete = v),
})

const dialog = computed({
  get: () => foodsStore.dialog,
  set: (v) => (foodsStore.dialog = v),
})
const dialogDelete = computed({
  get: () => foodsStore.dialogDelete,
  set: (v) => (foodsStore.dialogDelete = v),
})

const foods = computed(() => foodsStore.foods)
const editedItem = computed(() => foodsStore.editedItem)
const formTitle = computed(() => (foodsStore.editedIndex === -1 ? 'New Food' : 'Edit Food'))

const headers = [
  { title: 'Image', key: 'food_image', sortable: false, align: 'start' },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Code', key: 'food_code', sortable: true },
  { title: 'Price', key: 'price', sortable: true },
  { title: 'Restaurant', key: 'restaurant_name', sortable: true },
  { title: 'Category', key: 'category_name', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// replace with roles source if available. For now an empty array
const BASE = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000'

// preview computed
const filePreview = computed(() => {
  const f = image.value ? (Array.isArray(image.value) ? image.value[0] : image.value) : null
  return f ? URL.createObjectURL(f) : null
})

const getImageUrl = (path) => {
  if (!path) return null
  return `${BASE}/storage/${path}`
  // return `http://localhost:8000/storage/${path}`
}

const passwordHint = computed(() =>
  foodsStore.editedIndex === -1 ? 'Required' : 'Leave blank to keep current',
)

// lifecycle
onMounted(() => {
  foodsStore.fetchFoods()
  restaurantsStore.fetchRestaurants()
  categoriesStore.fetchCategories()
})

// actions
function openCreate() {
  foodsStore.openDialog()
  image.value = null
}

async function onEdit(id) {
  await foodsStore.editItem(id)
  image.value = null
}

function onDelete(id) {
  foodsStore.openDelete(id)
}

function closeDialog() {
  foodsStore.closeDialog()
  image.value = null
}

function closeDelete() {
  foodsStore.closeDelete()
}

async function save() {
  // build FormData
  const fd = new FormData()
  // include fields expected by backend
  fd.append('name', editedItem.value.name || '')
  fd.append('food_code', editedItem.value.food_code || '')
  fd.append('price', editedItem.value.price || '')
  fd.append('description', editedItem.value.description || '')  
  if (editedItem.value.restaurant_id) fd.append('restaurant_id', editedItem.value.restaurant_id)
  if (editedItem.value.category_id) fd.append('category_id', editedItem.value.category_id)

  if (editedItem.value.food_image) {
    // support either File or File[] (v-file-input returns array by default)
    const file = Array.isArray(editedItem.value.food_image)
      ? editedItem.value.food_image[0]
      : editedItem.value.food_image
    fd.append('food_image', file)
  }

  try {
    if (foodsStore.editedIndex > -1) {
      // update
      await foodsStore.updateFood(foodsStore.editedIndex, fd)
      snackbarUpdate.value = true
      colors.setFooterColor('warning') // optional
    } else {
      // create
      // For create ensure password is present (frontend should validate)
      if (!editedItem.value.password) {
        // you can show an error or return
        console.warn('Password required for create')
      }
      await foodsStore.createFood(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success') // optional
    }

    // refresh list to ensure consistent state
    await foodsStore.fetchFoods()
    // reset form
    image.value = null
    foodsStore.closeDialog()
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
  if (!foodsStore.deletingId) return
  try {
    await foodsStore.deleteFood(foodsStore.deletingId)
    snackbarDelete.value = true
  } catch (err) {
    console.error('confirmDelete error', err)
  } finally {
    await foodsStore.fetchFoods()
  }
}

function refresh() {
  foodsStore.fetchFoods()
}
</script>
