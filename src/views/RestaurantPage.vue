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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useRolesStore } from '@/stores/roles'
import { useColorsStore } from '@/stores/colors'

const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const colors = useColorsStore()

// local reactive refs
const image = ref(null)            // holds the selected File (or null)
const filePreview = ref(null)      // blob URL for preview
const lastObjectUrl = ref(null)    // record to revoke when replaced
const snackbarTimeout = 1500

const snackbarCreate = computed({
  get: () => usersStore.snackbarCreate,
  set: (v) => (usersStore.snackbarCreate = v),
})
const snackbarUpdate = computed({
  get: () => usersStore.snackbarUpdate,
  set: (v) => (usersStore.snackbarUpdate = v),
})
const snackbarDelete = computed({
  get: () => usersStore.snackbarDelete,
  set: (v) => (usersStore.snackbarDelete = v),
})

const dialog = computed({
  get: () => usersStore.dialog,
  set: (v) => (usersStore.dialog = v),
})
const dialogDelete = computed({
  get: () => usersStore.dialogDelete,
  set: (v) => (usersStore.dialogDelete = v),
})

const users = computed(() => usersStore.users)
const editedItem = computed(() => usersStore.editedItem)
const formTitle = computed(() => (usersStore.editedIndex === -1 ? 'New User' : 'Edit User'))

const headers = [
  { title: 'Photo', key: 'user_image', sortable: false, align: 'start' },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// base url for server images
const BASE = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';

// ---------- Preview helpers ----------
function createPreview(file) {
  if (!file) return
  // revoke previous url
  if (lastObjectUrl.value) {
    try { URL.revokeObjectURL(lastObjectUrl.value) } catch (e) {}
    lastObjectUrl.value = null
  }
  const url = URL.createObjectURL(file)
  lastObjectUrl.value = url
  filePreview.value = url
}

function clearPreview() {
  if (lastObjectUrl.value) {
    try { URL.revokeObjectURL(lastObjectUrl.value) } catch (e) {}
    lastObjectUrl.value = null
  }
  filePreview.value = null
  image.value = null
}

// ---------- getImageUrl: handles File, Array<File>, or server path string ----------
const getImageUrl = (pathOrFile) => {
  if (!pathOrFile) return null

  // File or Blob
  if (pathOrFile instanceof File || pathOrFile instanceof Blob) {
    // ensure preview exists
    if (!filePreview.value || lastObjectUrl.value === null) createPreview(pathOrFile)
    return filePreview.value
  }

  // array (v-file-input sometimes stores an array)
  if (Array.isArray(pathOrFile) && pathOrFile.length) {
    const first = pathOrFile[0]
    if (first instanceof File || first instanceof Blob) {
      if (!filePreview.value || lastObjectUrl.value === null) createPreview(first)
      return filePreview.value
    }
    // if array of strings, take first as server path
    if (typeof first === 'string') return `${BASE}/storage/${first}`
  }

  // string => server path
  if (typeof pathOrFile === 'string') {
    return `${BASE}/storage/${pathOrFile}`
  }

  return null
}

// ---------- file input change handler (single file) ----------
function onFileChange(payload) {
  // payload can be File, Array<File>, or null
  const f = Array.isArray(payload) ? payload[0] : payload

  if (f instanceof File || f instanceof Blob) {
    image.value = f
    createPreview(f)

    // prefer calling store action if available, otherwise write directly
    if (typeof usersStore.setEditedUserImage === 'function') {
      usersStore.setEditedUserImage(f)
    } else {
      usersStore.editedItem.user_image = f
    }
  } else {
    // cleared selection
    clearPreview()
    if (typeof usersStore.clearEditedUserImage === 'function') {
      usersStore.clearEditedUserImage()
    } else {
      usersStore.editedItem.user_image = null
    }
  }
}

// ---------- password hint ----------
const passwordHint = computed(() =>
  usersStore.editedIndex === -1 ? 'Required' : 'Leave blank to keep current',
)

// lifecycle
onMounted(() => {
  usersStore.fetchUsers()
  rolesStore.fetchRoles()
})

// cleanup preview on unmount
onUnmounted(() => {
  clearPreview()
})

// actions (kept your original signatures/behavior)
function openCreate() {
  usersStore.openDialog()
  clearPreview()
}

async function onEdit(id) {
  await usersStore.editItem(id)
  // reset local preview - if the server returned a path string, we don't want the local preview
  clearPreview()
}

function onDelete(id) {
  usersStore.openDelete(id)
}

function closeDialog() {
  usersStore.closeDialog()
  clearPreview()
  if (typeof usersStore.clearEditedUserImage === 'function') {
    usersStore.clearEditedUserImage()
  } else {
    usersStore.editedItem.user_image = null
  }
}

function closeDelete() {
  usersStore.closeDelete()
}

async function save() {
  // build FormData
  const fd = new FormData()
  fd.append('name', editedItem.value.name || '')
  fd.append('email', editedItem.value.email || '')
  if (editedItem.value.password) fd.append('password', editedItem.value.password)
  fd.append('is_active', editedItem.value.is_active ? '1' : '0')
  if (editedItem.value.role_id) fd.append('role_id', editedItem.value.role_id)

  // only append when user_image is actually a File
  const img = editedItem.value.user_image
  if (img && (img instanceof File || (Array.isArray(img) && img[0] instanceof File))) {
    const file = Array.isArray(img) ? img[0] : img
    fd.append('user_image', file)
  }

  try {
    if (usersStore.editedIndex > -1) {
      // update
      await usersStore.updateUser(usersStore.editedIndex, fd)
      snackbarUpdate.value = true
      colors.setFooterColor('warning') // optional
    } else {
      // create
      if (!editedItem.value.password) {
        console.warn('Password required for create')
      }
      await usersStore.createUser(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success') // optional
    }

    // refresh list to ensure consistent state
    await usersStore.fetchUsers()
    // reset form
    clearPreview()
    usersStore.closeDialog()
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
  if (!usersStore.deletingId) return
  try {
    await usersStore.deleteUser(usersStore.deletingId)
    snackbarDelete.value = true
  } catch (err) {
    console.error('confirmDelete error', err)
  } finally {
    await usersStore.fetchUsers()
  }
}

function refresh() {
  usersStore.fetchUsers()
}
</script>

