<template>
  <v-container>
    <!-- Snackbars -->
    <v-snackbar v-model="snackbarCreate" :timeout="snackbarTimeout" color="success">
      Payment created successfully.
      <v-btn text @click="snackbarCreate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarUpdate" :timeout="snackbarTimeout" color="warning">
      Payment updated successfully.
      <v-btn text @click="snackbarUpdate = false">Close</v-btn>
    </v-snackbar>

    <v-snackbar v-model="snackbarDelete" :timeout="snackbarTimeout" color="error">
      Payment deleted successfully.
      <v-btn text @click="snackbarDelete = false">Close</v-btn>
    </v-snackbar>

    <!-- Data table -->
    <v-data-table :headers="headers" :items="paymentsStore.payments" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat color="primary">
          <v-toolbar-title>Payments</v-toolbar-title>
          <v-spacer></v-spacer>

          <v-btn color="white" style="background-color: grey" @click="openCreate"
            >New Payment</v-btn
          >
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
    <v-dialog v-model="paymentsStore.dialog" max-width="600px" @click:outside="closeDialog">
      <v-card>
        <v-card-title style="background-color: cornflowerblue;">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" md="12">
                <v-select
                  :items="ordersStore.orders"
                  v-model="paymentsStore.editedItem.order_id"
                  label="Orders"
                  item-value="id"
                  item-title="order_code"
                  :return-object="false"
                ></v-select>
              </v-col>
              <v-col cols="6" md="6">
                <v-select
                  :items="usersStore.users"
                  v-model="paymentsStore.editedItem.user_id"
                  label="User"
                  item-value="id"
                  item-title="name"
                  :return-object="false"
                ></v-select>
              </v-col>
              <v-col cols="6" md="6">
                <v-text-field
                  v-model.number="paymentsStore.editedItem.amount_paid"
                  label="Amount Paid"
                  type="number"
                  min="1"
                  step="1"
                ></v-text-field>
              </v-col>

              <!-- put after the Quantity field (inside same v-col group or new col) -->
              <!-- Replace your previous Unit Price / Total v-cols with this block -->
              <v-col cols="12" md="12">
                <v-row class="align-center" dense>
                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Balance B/F</div>
                      <v-chip outlined small class="ma-0" aria-label="Balance brought forward">
                        <strong>{{ formattedBalanceBF }}</strong>
                      </v-chip>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Amount Paid</div>
                      <v-chip
                        color="primary"
                        text-color="white"
                        small
                        class="ma-0"
                        aria-label="Amount paid"
                      >
                        <strong>{{ formattedAmountPaid }}</strong>
                      </v-chip>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="4" class="d-flex align-center">
                    <div>
                      <div class="text-caption mb-1">Balance C/F</div>
                      <v-chip outlined small class="ma-0" aria-label="Balance carried forward">
                        <strong :class="{ 'text-danger': balanceCF < 0 }">{{
                          formattedBalanceCF
                        }}</strong>
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
          <v-btn style="background-color: coral;" text @click="closeDialog">Cancel</v-btn>
          <v-btn style="background-color: cornflowerblue;" text @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { usePaymentsStore } from '@/stores/payments'
import { useUsersStore } from '@/stores/users'
import { useColorsStore } from '@/stores/colors'
import { useOrdersStore } from '@/stores/orders'

const paymentsStore = usePaymentsStore()
const usersStore = useUsersStore()
const ordersStore = useOrdersStore()
const colors = useColorsStore()

// local reactive refs
const snackbarTimeout = 1500

const snackbarCreate = computed({
  get: () => paymentsStore.snackbarCreate,
  set: (v) => (paymentsStore.snackbarCreate = v),
})
const snackbarUpdate = computed({
  get: () => paymentsStore.snackbarUpdate,
  set: (v) => (paymentsStore.snackbarUpdate = v),
})
const snackbarDelete = computed({
  get: () => paymentsStore.snackbarDelete,
  set: (v) => (paymentsStore.snackbarDelete = v),
})

const dialog = computed({
  get: () => paymentsStore.dialog,
  set: (v) => (paymentsStore.dialog = v),
})
const dialogDelete = computed({
  get: () => paymentsStore.dialogDelete,
  set: (v) => (paymentsStore.dialogDelete = v),
})

const editedItem = computed(() => paymentsStore.editedItem)
const formTitle = computed(() =>
  paymentsStore.editedIndex === -1 ? 'New Payment' : 'Edit Payment',
)

const headers = [
  { title: 'ID', key: 'id', sortable: false, align: 'start' },
  { title: 'Order', key: 'order_code', sortable: true },
  { title: 'Amount Paid', key: 'amount_paid', sortable: true },
  { title: 'Receipt', key: 'receipt_no', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// ----- local refs for user-balance -------
const userOrdersSum = ref(0)     // total of user's orders
const userPaymentsSum = ref(0)   // total payments made by user
const balanceBFRef = ref(0)      // server-sent balance (your controller returns balance)
const loadingBalance = ref(false)

// fetch user balance from your controller route GET /api/getUserBalance/{id}
async function loadUserBalance(userId) {
  if (!userId) {
    balanceBFRef.value = 0
    return
  }
  loadingBalance.value = true
  try {
    const data = await paymentsStore.fetchUserBalance(userId)
    // store action returns controller JSON: { balance, total_orders, total_payments }
    balanceBFRef.value = Number(data?.balance ?? 0)
  } catch (e) {
    console.error(e)
    balanceBFRef.value = 0
  } finally {
    loadingBalance.value = false
  }
}

// watch order selection: set user and load balance
watch(
  () => paymentsStore.editedItem.order_id,
  (orderId) => {
    if (!orderId) {
      paymentsStore.editedItem.user_id = null
      balanceBFRef.value = 0
      return
    }
    // find order (ordersStore should already be loaded)
    let order = ordersStore.orders.find((o) => String(o.id) === String(orderId))
    if (!order) {
      // try one fetch then re-find (only if necessary)
      ordersStore.fetchOrders().then(() => {
        order = ordersStore.orders.find((o) => String(o.id) === String(orderId))
        const uid = order?.user_id ?? null
        paymentsStore.editedItem.user_id = uid
        loadUserBalance(uid)
      })
      return
    }
    const uid = order.user_id ?? null
    paymentsStore.editedItem.user_id = uid
    loadUserBalance(uid)
  },
  { immediate: true }
)

// -------- existing computed chips mapping --------
const amountPaid = computed({
  get: () => {
    const v = paymentsStore.editedItem.amount_paid
    return v === '' || v == null ? 0 : Number(v)
  },
  set: (v) => {
    paymentsStore.editedItem.amount_paid = v
  },
})

const balanceCF = computed(() => {
  // carried forward after applying current amountPaid
  return Number((balanceBFRef.value + amountPaid.value).toFixed(2))
})

const formattedBalanceBF = computed(() => Number(balanceBFRef.value ?? 0).toFixed(2))
const formattedAmountPaid = computed(() => Number(amountPaid.value ?? 0).toFixed(2))
const formattedBalanceCF = computed(() => Number(balanceCF.value ?? 0).toFixed(2))

// lifecycle
onMounted(() => {
  paymentsStore.fetchPayments()
  ordersStore.fetchOrders()
  usersStore.fetchUsers()
})

// actions (unchanged)
function openCreate() {
  paymentsStore.openDialog()
}

async function onEdit(id) {
  await paymentsStore.editItem(id)
  const uid = paymentsStore.editedItem.user_id ?? null
  if (uid) loadUserBalance(uid)
}

function onDelete(id) {
  paymentsStore.openDelete(id)
}

function closeDialog() {
  paymentsStore.closeDialog()
}

function closeDelete() {
  paymentsStore.closeDelete()
}

async function save() {
  // build FormData
  const fd = new FormData()
  fd.append('amount_paid', editedItem.value.amount_paid || '')
  if (editedItem.value.order_id) fd.append('order_id', editedItem.value.order_id)
  if (editedItem.value.user_id) fd.append('user_id', editedItem.value.user_id)

  try {
    if (paymentsStore.editedIndex > -1) {
      await paymentsStore.updatePayment(paymentsStore.editedIndex, fd)
    } else {
      await paymentsStore.createPayment(fd)
    }
    // refresh and close
    await paymentsStore.fetchPayments()
    paymentsStore.closeDialog()
  } catch (err) {
    console.error('save error', err)
  } finally {
    setTimeout(() => {
      colors.setFooterColor('info')
    }, snackbarTimeout + 200)
  }
}

async function confirmDelete() {
  if (!paymentsStore.deletingId) return
  try {
    await paymentsStore.deletePayment(paymentsStore.deletingId)
  } catch (err) {
    console.error('confirmDelete error', err)
  } finally {
    await paymentsStore.fetchPayments()
  }
}

function refresh() {
  paymentsStore.fetchPayments()
}
</script>

