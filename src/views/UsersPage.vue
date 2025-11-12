<template>
  <v-container>
    <!-- Snackbars -->
    <v-snackbar v-model="snackbarCreate" :timeout="snackbarTimeout" color="success">
      User created successfully.
      <v-btn text @click="snackbarCreate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarUpdate" :timeout="snackbarTimeout" color="warning">
      User updated successfully.
      <v-btn text @click="snackbarUpdate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarDelete" :timeout="snackbarTimeout" color="error">
      User deleted successfully.
      <v-btn text @click="snackbarDelete = false">Close</v-btn>
    </v-snackbar>

    <!-- Data table -->
    <v-data-table :headers="headers" :items="usersStore.users" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat color="blue">
          <v-toolbar-title>Users</v-toolbar-title>
          <v-spacer></v-spacer>

          <v-btn color="white" style="background-color: grey;" @click="openCreate">New User</v-btn>
        </v-toolbar>
      </template>

      <template v-slot:[`item.user_image`]="{ item }">
        <v-img
          :src="getImageUrl(item.user_image)"
          alt="User"
          width="48"
          height="48"
          v-if="item.user_image"
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
    <v-dialog v-model="usersStore.dialog" max-width="600px" @click:outside="closeDialog">
      <v-card>
        <v-card-title style="background-color: cornflowerblue;">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="usersStore.editedItem.name" label="Name"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="usersStore.editedItem.email" label="Email"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="usersStore.editedItem.password"
                  label="Password"
                  type="password"
                  :hint="passwordHint"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  :items="rolesStore.roles"
                  v-model="usersStore.editedItem.role_id"
                  label="Role"
                  item-value="id"
                  item-title="name"
                  :return-object="false"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch v-model="usersStore.editedItem.is_active" label="Active"></v-switch>
              </v-col>

              <v-col cols="12" md="6">
                <v-file-input
                  v-model="usersStore.editedItem.user_image"
                  label="Upload Image"
                  accept="image/*"
                  show-size
                  @change="onFileChange"
                ></v-file-input>

                <!-- preview: new file if selected, otherwise existing image -->
                <v-img v-if="filePreview" :src="filePreview" width="200" height="200"></v-img>
                <v-img
                  v-else-if="usersStore.editedItem.user_image"
                  :src="getImageUrl(usersStore.editedItem.user_image)"
                  width="200"
                  height="200"
                ></v-img>
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
import { useUsersStore } from '@/stores/users'
import { useRolesStore } from '@/stores/roles'
import { useColorsStore } from '@/stores/colors'

const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const colors = useColorsStore()

// local reactive refs
const image = ref(null)
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
  { title: '', key: 'user_image', sortable: false, align: 'start' },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// replace with roles source if available. For now an empty array
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
  usersStore.editedIndex === -1 ? 'Required' : 'Leave blank to keep current',
)

// lifecycle
onMounted(() => {
  usersStore.fetchUsers()
  rolesStore.fetchRoles()
})

// actions
function openCreate() {
  usersStore.openDialog()
  image.value = null
}

async function onEdit(id) {
  await usersStore.editItem(id)
  image.value = null
}

function onDelete(id) {
  usersStore.openDelete(id)
}

function closeDialog() {
  usersStore.closeDialog()
  image.value = null
}

function closeDelete() {
  usersStore.closeDelete()
}

async function save() {
  // build FormData
  const fd = new FormData()
  // include fields expected by backend
  fd.append('name', editedItem.value.name || '')
  fd.append('email', editedItem.value.email || '')
  // password: only append if provided (create requires, update optional)
  if (editedItem.value.password) fd.append('password', editedItem.value.password)
  fd.append('is_active', editedItem.value.is_active ? '1' : '0')
  if (editedItem.value.role_id) fd.append('role_id', editedItem.value.role_id)

  if (editedItem.value.user_image) {
    // support either File or File[] (v-file-input returns array by default)
    const file = Array.isArray(editedItem.value.user_image)
      ? editedItem.value.user_image[0]
      : editedItem.value.user_image
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
      // For create ensure password is present (frontend should validate)
      if (!editedItem.value.password) {
        // you can show an error or return
        console.warn('Password required for create')
      }
      await usersStore.createUser(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success') 
    }

    // refresh list to ensure consistent state
    await usersStore.fetchUsers()
    // reset form
    image.value = null
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
