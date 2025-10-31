<template>
  <v-container>
    <!-- Snackbars -->
    <v-snackbar v-model="snackbarCreate" :timeout="snackbarTimeout" color="success">
      Order created successfully.
      <v-btn text @click="snackbarCreate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarUpdate" :timeout="snackbarTimeout" color="warning">
      Order updated successfully.
      <v-btn text @click="snackbarUpdate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarDelete" :timeout="snackbarTimeout" color="error">
      Order deleted successfully.
      <v-btn text @click="snackbarDelete = false">Close</v-btn>
    </v-snackbar>

    <!-- Data table -->
    <v-data-table :headers="headers" :items="ordersStore.orders" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat color="primary">
          <v-toolbar-title>Orders</v-toolbar-title>
          <v-spacer></v-spacer>

          <v-btn color="white" style="background-color: grey" @click="openCreate">New Order</v-btn>
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
    <v-dialog v-model="ordersStore.dialog" max-width="600px" @click:outside="closeDialog">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="6" md="6">
                <v-select
                  :items="usersStore.users"
                  v-model="ordersStore.editedItem.user_id"
                  label="Users"
                  item-value="id"
                  item-title="name"
                  :return-object="false"
                ></v-select>
              </v-col>
              <v-col cols="6" md="6">
                <v-select
                  :items="foodsStore.foods"
                  v-model="ordersStore.editedItem.food_id"
                  label="Food"
                  item-value="id"
                  item-title="name"
                  :return-object="false"
                ></v-select>
              </v-col>
              <v-col cols="6" md="6">
                <v-text-field
                  v-model.number="ordersStore.editedItem.quantity"
                  label="Quantity"
                  type="number"
                  min="1"
                  step="1"
                ></v-text-field>
              </v-col>

              <v-col cols="6" md="6">
                <v-select
                  :items="['SERVED', 'IN PROGRESS', 'DECLINED', 'COMPLETED']"
                  v-model="ordersStore.editedItem.status"
                  label="Status"
                  :return-object="false"
                ></v-select>
              </v-col>

              <!-- put after the Quantity field (inside same v-col group or new col) -->
              <!-- Replace your previous Unit Price / Total v-cols with this block -->
              <v-col cols="12" md="12">
                <v-row class="align-center" dense>
                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Unit price</div>
                      <v-chip outlined small class="ma-0" aria-label="Unit price">
                        <strong>{{ formattedUnitPrice }}</strong>
                      </v-chip>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Total (client)</div>
                      <v-chip
                        color="primary"
                        text-color="white"
                        small
                        class="ma-0"
                        aria-label="Client total"
                      >
                        <strong>{{ formattedClientTotal }}</strong>
                      </v-chip>
                    </div>
                  </v-col>

                  <v-col cols="6" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Total (server)</div>

                      <!-- show skeleton while loading -->
                      <div v-if="serverTotalLoading" class="d-flex">
                        <v-skeleton-loader type="heading" width="100px" />
                      </div>

                      <!-- show server total (if available) -->
                      <div v-else-if="serverTotal !== null">
                        <v-chip outlined small class="ma-0" aria-label="Server total">
                          <strong>{{ formattedServerTotal }}</strong>
                          <v-icon
                            small
                            class="ms-2"
                            v-if="serverTotalDiffers"
                            title="Server differs from client"
                            >mdi-alert-circle</v-icon
                          >
                        </v-chip>
                      </div>

                      <!-- fallback when server total not available -->
                      <div v-else>
                        <v-chip small class="ma-0">—</v-chip>
                      </div>
                    </div>
                  </v-col>
                </v-row>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useFoodsStore } from '@/stores/foods'
import { useColorsStore } from '@/stores/colors'
import { useUsersStore } from '@/stores/users'
import debounce from 'just-debounce-it'

const ordersStore = useOrdersStore()
const foodsStore = useFoodsStore()
const usersStore = useUsersStore()
const colors = useColorsStore()

// local reactive refs
const snackbarTimeout = 1500

const snackbarCreate = computed({
  get: () => ordersStore.snackbarCreate,
  set: (v) => (ordersStore.snackbarCreate = v),
})
const snackbarUpdate = computed({
  get: () => ordersStore.snackbarUpdate,
  set: (v) => (ordersStore.snackbarUpdate = v),
})
const snackbarDelete = computed({
  get: () => ordersStore.snackbarDelete,
  set: (v) => (ordersStore.snackbarDelete = v),
})

const dialog = computed({
  get: () => ordersStore.dialog,
  set: (v) => (ordersStore.dialog = v),
})
const dialogDelete = computed({
  get: () => ordersStore.dialogDelete,
  set: (v) => (ordersStore.dialogDelete = v),
})

const editedItem = computed(() => ordersStore.editedItem)
const formTitle = computed(() => (ordersStore.editedIndex === -1 ? 'New Order' : 'Edit Order'))

const headers = [
  { title: 'ID', key: 'id', sortable: false, align: 'start' },
  { title: 'User', key: 'user_id', sortable: true },
  { title: 'Food', key: 'food_id', sortable: true },
  { title: 'Quantity', key: 'quantity', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// ------------------ New: live calculation ------------------
// selected food object (reactive)
const selectedFood = computed(() => {
  const fid = ordersStore.editedItem.food_id
  if (!fid) return null
  // foodsStore.foods expected to be array of { id, name, price, ... }
  return foodsStore.foods.find((f) => String(f.id) === String(fid)) || null
})

// unit price (number)
const unitPrice = computed(() => {
  const f = selectedFood.value
  return f ? Number(f.price ?? f.unit_price ?? 0) : 0
})

// quantity getter/setter : keep editedItem synced (ensures reactivity)
const quantity = computed({
  get: () => {
    const q = ordersStore.editedItem.quantity
    return q === '' || q == null ? 0 : Number(q)
  },
  set: (v) => {
    ordersStore.editedItem.quantity = v
  },
})

// client-side total, formatted
const clientTotal = computed(() => {
  return Number((unitPrice.value * (quantity.value || 0)).toFixed(2))
})

// ------------------ New: async server-validated total ------------------
// show serverTotal while loading spinner if desired
const serverTotal = ref(null)
const serverTotalLoading = ref(false)

// debounce server call to avoid hammering backend while user types
const fetchServerTotalDebounced = debounce(async (food_id, qty) => {
  if (!food_id || !qty) {
    serverTotal.value = null
    serverTotalLoading.value = false
    return
  }
  serverTotalLoading.value = true
  try {
    // call a new action on ordersStore (or call API directly)
    const resp = await ordersStore.calculateTotal(food_id, qty)
    serverTotal.value = Number(resp ?? 0)
  } catch (err) {
    console.error('calculate total error', err)
    serverTotal.value = null
  } finally {
    serverTotalLoading.value = false
  }
}, 400) // 400ms debounce

// watch food_id and quantity changes
watch(
  () => [ordersStore.editedItem.food_id, ordersStore.editedItem.quantity],
  ([fid, qty]) => {
    // immediately show client total; then call server
    if (fid && qty && !isNaN(Number(qty))) {
      fetchServerTotalDebounced(fid, Number(qty))
    } else {
      serverTotal.value = null
    }
  },
  { immediate: true },
)

// lifecycle
onMounted(() => {
  ordersStore.fetchOrders()
  foodsStore.fetchFoods()
  usersStore.fetchUsers()
})

// actions
function openCreate() {
  ordersStore.openDialog()
}

async function onEdit(id) {
  await ordersStore.editItem(id)
}

function onDelete(id) {
  ordersStore.openDelete(id)
}

function closeDialog() {
  ordersStore.closeDialog()
}

function closeDelete() {
  ordersStore.closeDelete()
}

async function save() {
  // build FormData
  const fd = new FormData()
  // include fields expected by backend
  fd.append('quantity', editedItem.value.quantity || '')
  fd.append('status', editedItem.value.status || '')
  if (editedItem.value.food_id) fd.append('food_id', editedItem.value.food_id)
  if (editedItem.value.user_id) fd.append('user_id', editedItem.value.user_id)

  try {
    if (ordersStore.editedIndex > -1) {
      // update
      await ordersStore.updateOrder(ordersStore.editedIndex, fd)
      snackbarUpdate.value = true
      colors.setFooterColor('warning')
    } else {
      // create
      await ordersStore.createOrder(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success')
    }
    // refresh list to ensure consistent state
    await ordersStore.fetchOrders()
    // reset form
    ordersStore.closeDialog()
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
  if (!ordersStore.deletingId) return
  try {
    await ordersStore.deleteOrder(ordersStore.deletingId)
    snackbarDelete.value = true
  } catch (err) {
    console.error('confirmDelete error', err)
  } finally {
    await ordersStore.fetchOrders()
  }
}

function refresh() {
  ordersStore.fetchOrders()
}

const formattedUnitPrice = computed(() => {
  // show two decimals; fall back to 0.00
  return Number(unitPrice.value ?? 0).toFixed(2)
})

const formattedClientTotal = computed(() => {
  return Number(clientTotal.value ?? 0).toFixed(2)
})

const formattedServerTotal = computed(() => {
  return serverTotal.value != null ? Number(serverTotal.value).toFixed(2) : '—'
})

// show a visual flag when server total exists and differs (2-decimal compare)
const serverTotalDiffers = computed(() => {
  if (serverTotal.value == null) return false
  return (
    Number(Number(serverTotal.value).toFixed(2)) !== Number(Number(clientTotal.value).toFixed(2))
  )
})
</script>
