<template>
  <v-container>
    <!-- Snackbars -->
    <v-snackbar v-model="snackbarCreate" :timeout="snackbarTimeout" color="success">
      Category created successfully.
      <v-btn text @click="snackbarCreate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarUpdate" :timeout="snackbarTimeout" color="warning">
      Category updated successfully.
      <v-btn text @click="snackbarUpdate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarDelete" :timeout="snackbarTimeout" color="error">
      Category deleted successfully.
      <v-btn text @click="snackbarDelete = false">Close</v-btn>
    </v-snackbar>

    <!-- Data table -->
    <v-data-table :headers="headers" :items="categoriesStore.categories" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat color="blue">
          <v-toolbar-title>Categories</v-toolbar-title>
          <v-spacer></v-spacer>

          <v-btn color="white" style="background-color:gray;" @click="openCreate">New Category</v-btn>
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
    <v-dialog v-model="categoriesStore.dialog" max-width="600px" @click:outside="closeDialog">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="12">
                <v-text-field v-model="categoriesStore.editedItem.name" label="Name"></v-text-field>
              </v-col>
              <v-col cols="12" md="12">
                <v-textarea v-model="categoriesStore.editedItem.description" label="Description"></v-textarea>                            
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
import { ref, computed, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useColorsStore } from '@/stores/colors'

const categoriesStore = useCategoriesStore()
const colors = useColorsStore()

// local reactive refs
const image = ref(null)
const snackbarTimeout = 1500

const snackbarCreate = computed({
  get: () => categoriesStore.snackbarCreate,
  set: (v) => (categoriesStore.snackbarCreate = v),
})
const snackbarUpdate = computed({
  get: () => categoriesStore.snackbarUpdate,
  set: (v) => (categoriesStore.snackbarUpdate = v),
})
const snackbarDelete = computed({
  get: () => categoriesStore.snackbarDelete,
  set: (v) => (categoriesStore.snackbarDelete = v),
})

const dialog = computed({
  get: () => categoriesStore.dialog,
  set: (v) => (categoriesStore.dialog = v),
})
const dialogDelete = computed({
  get: () => categoriesStore.dialogDelete,
  set: (v) => (categoriesStore.dialogDelete = v),
})

const categories = computed(() => categoriesStore.categories)
const editedItem = computed(() => categoriesStore.editedItem)
const formTitle = computed(() => (categoriesStore.editedIndex === -1 ? 'New Category' : 'Edit Category'))

const headers = [
  { title: 'ID', key: 'id', sortable: true, align: 'start' },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// replace with categories source if available. For now an empty array
const BASE = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';

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
  categoriesStore.editedIndex === -1 ? 'Required' : 'Leave blank to keep current',
)

// lifecycle
onMounted(() => {
  categoriesStore.fetchCategories()
})

// actions
function openCreate() {
  categoriesStore.openDialog()
  image.value = null
}

async function onEdit(id) {
  await categoriesStore.editItem(id)
  image.value = null
}

function onDelete(id) {
  categoriesStore.openDelete(id)
}

function closeDialog() {
  categoriesStore.closeDialog()
  image.value = null
}

function closeDelete() {
  categoriesStore.closeDelete()
}

async function save() {
  // build FormData
  const fd = new FormData()
  fd.append('name', editedItem.value.name || '')
  fd.append('address', editedItem.value.address || '')
  fd.append('description', editedItem.value.description || '')

  try {
    if (categoriesStore.editedIndex > -1) {
      // update
      await categoriesStore.updateCategory(categoriesStore.editedIndex, fd)
      snackbarUpdate.value = true
      colors.setFooterColor('warning') // optional
    } else {
      // create
      // For create ensure password is present (frontend should validate)
      if (!editedItem.value.password) {
        // you can show an error or return
        console.warn('Password required for create')
      }
      await categoriesStore.createCategory(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success') // optional
    }

    // refresh list to ensure consistent state
    await categoriesStore.fetchCategories()
    categoriesStore.closeDialog()
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
  if (!categoriesStore.deletingId) return
  try {
    await categoriesStore.deleteCategory(categoriesStore.deletingId)
    snackbarDelete.value = true
  } catch (err) {
    console.error('confirmDelete error', err)
  } finally {
    await categoriesStore.fetchCategories()
  }
}

function refresh() {
  categoriesStore.fetchCategories()
}
</script>
