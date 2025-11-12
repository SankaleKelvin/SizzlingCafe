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
        <v-card-title style="background-color: cornflowerblue;">
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

              <v-col cols="4" md="4">
                <v-text-field
                  v-model.number="ordersStore.editedItem.quantity"
                  label="Quantity"
                  type="number"
                  min="1"
                  step="1"
                ></v-text-field>
              </v-col>

              <v-col cols="4" md="4">
                <v-text-field
                  v-model.number="ordersStore.editedItem.order_amount"
                  label="Order Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  :readonly="true"
                ></v-text-field>
              </v-col>

              <v-col cols="4" md="4">
                <v-select
                  :items="['SERVED', 'IN PROGRESS', 'DECLINED', 'COMPLETED']"
                  v-model="ordersStore.editedItem.status"
                  label="Status"
                  :return-object="false"
                ></v-select>
              </v-col>

              <!-- Balance chips row -->
              <v-col cols="12" md="12">
                <v-row class="align-center" dense>
                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Balance B/F</div>
                      <div v-if="loadingBalance" class="d-flex">
                        <v-skeleton-loader type="heading" width="90px" />
                      </div>
                      <v-chip v-else outlined small class="ma-0" aria-label="Balance brought forward">
                        <strong>{{ formattedBalanceBF }}</strong>
                      </v-chip>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Order Amount</div>
                      <v-chip color="primary" text-color="white" small class="ma-0" aria-label="Order amount">
                        <strong>{{ formattedClientTotal }}</strong>
                      </v-chip>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Balance C/F</div>
                      <v-chip outlined small class="ma-0" aria-label="Balance carried forward">
                        <strong :class="{ 'text-danger': expectedBalance < 0 }">{{ formattedExpectedBalance }}</strong>
                      </v-chip>
                    </div>
                  </v-col>
                </v-row>
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
import { computed, onMounted, watch, ref } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useFoodsStore } from '@/stores/foods'
import { useUsersStore } from '@/stores/users'
import { useColorsStore } from '@/stores/colors'

const ordersStore = useOrdersStore()
const foodsStore = useFoodsStore()
const usersStore = useUsersStore()
const colors = useColorsStore()

const snackbarTimeout = 1500

// snackbars bound to store
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

// dialog bindings
const dialog = computed({
  get: () => ordersStore.dialog,
  set: (v) => (ordersStore.dialog = v),
})
const dialogDelete = computed({
  get: () => ordersStore.dialogDelete,
  set: (v) => (ordersStore.dialogDelete = v),
})

// shorthand to edited item
const editedItem = computed(() => ordersStore.editedItem)
const formTitle = computed(() => (ordersStore.editedIndex === -1 ? 'New Order' : 'Edit Order'))

const headers = [
  { title: 'ID', key: 'id', sortable: false, align: 'start' },
  { title: 'Order', key: 'order_code', sortable: true },
  { title: 'Customer', key: 'user_name', sortable: true },
  { title: 'Food', key: 'food_name', sortable: true },
  { title: 'Quantity', key: 'quantity', sortable: true },
  { title: 'Order Amount', key: 'order_amount', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// --------- calculation (client-side) ---------
// selected food object from foodsStore based on editedItem.food_id
const selectedFood = computed(() => {
  const fid = ordersStore.editedItem.food_id
  if (!fid) return null
  return foodsStore.foods.find((f) => String(f.id) === String(fid)) || null
})

// unit price (number)
const unitPrice = computed(() => {
  const f = selectedFood.value
  return f ? Number(f.price ?? f.unit_price ?? 0) : 0
})

// quantity as number
const quantity = computed({
  get: () => {
    const q = ordersStore.editedItem.quantity
    return q === '' || q == null ? 0 : Number(q)
  },
  set: (v) => {
    ordersStore.editedItem.quantity = v
  },
})

// client-side order amount (unitPrice * quantity)
const clientTotal = computed(() => {
  return Number((unitPrice.value * (quantity.value || 0)).toFixed(2))
})

// keep editedItem.order_amount in sync with clientTotal (so save() sends it)
watch(
  () => clientTotal.value,
  (val) => {
    ordersStore.editedItem.order_amount = val
  },
  { immediate: true }
)

// formatted for UI
const formattedUnitPrice = computed(() => Number(unitPrice.value ?? 0).toFixed(2))
const formattedClientTotal = computed(() => Number(clientTotal.value ?? 0).toFixed(2))

// ------------------ User balance (server) ------------------
// balance refs used by chips
const balanceBFRef = ref(0)      // server-sent balance (current B/F)
const loadingBalance = ref(false)

// helper that asks the store for the user balance
async function loadUserBalance(userId) {
  if (!userId) {
    balanceBFRef.value = 0
    return
  }
  loadingBalance.value = true
  try {
    const data = await ordersStore.fetchUserBalance(userId)
    // data shape: { balance, total_orders, total_payments }
    balanceBFRef.value = Number(data?.balance ?? 0)
  } catch (err) {
    console.error('loadUserBalance error', err)
    balanceBFRef.value = 0
  } finally {
    loadingBalance.value = false
  }
}

// Expected balance after adding/updating this order: BalanceBF - clientTotal
const expectedBalance = computed(() => {
  return Number((balanceBFRef.value + clientTotal.value).toFixed(2))
})

const formattedBalanceBF = computed(() => Number(balanceBFRef.value ?? 0).toFixed(2))
const formattedExpectedBalance = computed(() => Number(expectedBalance.value ?? 0).toFixed(2))

// When modal opens (dialog true) and/or user_id changes, load current balance
watch(
  () => ordersStore.dialog,
  (isOpen) => {
    if (!isOpen) return
    // if a user is already selected when modal opens, fetch balance
    const uid = ordersStore.editedItem.user_id ?? null
    if (uid) loadUserBalance(uid)
    else balanceBFRef.value = 0
  },
  { immediate: true }
)

// also react when user_id inside form changes (user selects different customer in modal)
watch(
  () => ordersStore.editedItem.user_id,
  (uid) => {
    if (!uid) {
      balanceBFRef.value = 0
      return
    }
    loadUserBalance(uid)
  }
)

// lifecycle: fetch lists
onMounted(() => {
  ordersStore.fetchOrders()
  foodsStore.fetchFoods()
  usersStore.fetchUsers()
})

// --------- actions (unchanged behaviour, minimal) ----------
function openCreate() {
  ordersStore.openDialog()
}

async function onEdit(id) {
  await ordersStore.editItem(id)
  // when editing, the dialog will open and the watcher on dialog/user_id will trigger load
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
  const fd = new FormData()
  fd.append('quantity', editedItem.value.quantity || '')
  // ensure order_amount is numeric value (clientTotal watcher keeps this in sync)
  fd.append('order_amount', editedItem.value.order_amount ?? clientTotal.value)
  fd.append('status', editedItem.value.status || '')
  if (editedItem.value.food_id) fd.append('food_id', editedItem.value.food_id)
  if (editedItem.value.user_id) fd.append('user_id', editedItem.value.user_id)

  try {
    if (ordersStore.editedIndex > -1) {
      await ordersStore.updateOrder(ordersStore.editedIndex, fd)
      snackbarUpdate.value = true
      colors.setFooterColor('warning')
    } else {
      await ordersStore.createOrder(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success')
    }
    await ordersStore.fetchOrders()
    ordersStore.closeDialog()
  } catch (err) {
    console.error('save error', err)
  } finally {
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
</script>
