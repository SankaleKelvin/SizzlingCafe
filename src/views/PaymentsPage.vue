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
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="6" md="6">
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
          <v-btn text @click="closeDelete">Cancel</v-btn>
          <v-btn text color="error" @click="confirmDelete">OK</v-btn>
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

// ------------------ New: live calculation ------------------
// selected order object (assumes ordersStore.orders contains each order with a `total` or `amount` field)
const selectedOrder = computed(() => {
  const oid = paymentsStore.editedItem.order_id
  if (!oid) return null
  return ordersStore.orders.find((o) => String(o.id) === String(oid)) || null
})

// order total (fallbacks in case field names differ)
const orderTotal = computed(() => {
  const o = selectedOrder.value
  // try common names: total, amount, grand_total, price
  if (!o) return 0
  return Number(o.total ?? o.amount ?? o.grand_total ?? o.price ?? 0)
})

// sum of previous payments for this order (excluding current edited payment if editing)
const paidSoFar = computed(() => {
  const oid = paymentsStore.editedItem.order_id
  if (!oid || !paymentsStore.payments) return 0
  // sum all payments for that order
  const sum = paymentsStore.payments
    .filter((p) => String(p.order_id) === String(oid))
    // if editing an existing payment, exclude that payment's own previous amount to avoid double-counting
    .filter((p) => {
      if (paymentsStore.editedIndex > -1 && String(p.id) === String(paymentsStore.editedIndex)) {
        return false
      }
      return true
    })
    .reduce((acc, p) => acc + Number(p.amount_paid ?? 0), 0)
  return Number(sum)
})

// Balance brought forward (before this payment)
const balanceBF = computed(() => {
  return Number((orderTotal.value - paidSoFar.value).toFixed(2))
})

// amount the user is entering now (paymentsStore.editedItem.amount_paid)
const amountPaid = computed({
  get: () => {
    const v = paymentsStore.editedItem.amount_paid
    return v === '' || v == null ? 0 : Number(v)
  },
  set: (v) => {
    paymentsStore.editedItem.amount_paid = v
  },
})

// balance carried forward after applying amountPaid
const balanceCF = computed(() => {
  return Number((balanceBF.value - amountPaid.value).toFixed(2))
})

// formatted strings for display
const formattedBalanceBF = computed(() => Number(balanceBF.value).toFixed(2))
const formattedAmountPaid = computed(() => Number(amountPaid.value ?? 0).toFixed(2))
const formattedBalanceCF = computed(() => Number(balanceCF.value ?? 0).toFixed(2))

// lifecycle
onMounted(() => {
  paymentsStore.fetchPayments()
  ordersStore.fetchOrders()
  usersStore.fetchUsers()
})

// actions
function openCreate() {
  paymentsStore.openDialog()
}

async function onEdit(id) {
  await paymentsStore.editItem(id)
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
  // include fields expected by backend
  fd.append('amount_paid', editedItem.value.amount_paid || '')
  if (editedItem.value.order_id) fd.append('order_id', editedItem.value.order_id)

  try {
    if (paymentsStore.editedIndex > -1) {
      // update
      await paymentsStore.updatePayment(paymentsStore.editedIndex, fd)
      snackbarUpdate.value = true
      colors.setFooterColor('warning')
    } else {
      // create
      await paymentsStore.createPayment(fd)
      snackbarCreate.value = true
      colors.setFooterColor('success')
    }
    // refresh list to ensure consistent state
    await paymentsStore.fetchPayments()
    // reset form
    paymentsStore.closeDialog()
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
  if (!paymentsStore.deletingId) return
  try {
    await paymentsStore.deletePayment(paymentsStore.deletingId)
    snackbarDelete.value = true
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
