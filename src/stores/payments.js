import { defineStore } from 'pinia'
import api from '../services/api'
import api_2 from '../services/api_2'

export const usePaymentsStore = defineStore('payments', {
  state: () => ({
    payments: [],
    // dialogs & UI state
    dialog: false,
    dialogDelete: false,
    // editedIndex will hold the payment id when editing, -1 when creating
    editedIndex: -1,
    editedItem: {
      id: '',
      amount_paid: '',
      receipt_no: '',
      order_id: null,
      user_id: null,
    },
    defaultItem: {
      id: '',
      amount_paid: '',
      receipt_no: '',
      order_id: null,
      user_id: null,
    },
    // snackbars
    snackbarCreate: false,
    snackbarUpdate: false,
    snackbarDelete: false,
    // delete target id
    deletingId: null,
  }),

  actions: {
    async fetchPayments() {
      try {
        const resp = await api.get('/getPayment')
        // Expect array
        this.payments = resp.data.Payment
      } catch (err) {
        console.error('fetchPayments error', err)
      }
    },

    async createPayment(formData) {
      try {
        const resp = await api_2.post('/savePayment', formData)
        // if API returns created payment object, push it otherwise re-fetch
        if (resp && resp.data) {
          this.payments.unshift(resp.data)
        } else {
          await this.fetchPayments()
        }
        this.snackbarCreate = true
      } catch (err) {
        console.error('createPayment error', err)
        throw err
      }
    },

    async updatePayment(id, formData) {
      try {
        const resp = await api_2.post(`/updatePayment/${id}`, formData)
        if (resp && resp.data) {
          const idx = this.payments.findIndex((u) => u.id == id)
          if (idx !== -1) this.payments.splice(idx, 1, resp.data)
        } else {
          await this.fetchPayments()
        }
        this.snackbarUpdate = true
      } catch (err) {
        console.error('updatePayment error', err)
        throw err
      }
    },

    async deletePayment(id) {
      try {
        await api_2.delete(`/deletePayment/${id}`)
        const idx = this.payments.findIndex((u) => u.id == id)
        if (idx !== -1) this.payments.splice(idx, 1)
        this.snackbarDelete = true
      } catch (err) {
        console.error('deletePayment error', err)
        throw err
      } finally {
        this.dialogDelete = false
        this.deletingId = null
      }
    },

    async editItem(id) {
      try {
        // Get single payment from API
        const resp = await api.get(`/getPayment/${id}`)
        const data = resp.data.Payment
        // normalise to editedItem shape
        this.editedIndex = id
        this.editedItem = {
          id: data.id,
          amount_paid: data.amount_paid || '',
          receipt_no: data.receipt_no || '',
          order_id: data.order_id ?? null,
        }
        this.dialog = true
      } catch (err) {
        console.error('editItem error', err)
      }
    },
    async calculateUserBalance(user_id) {
      try {
        const resp = await api_2.post('/calculate-user-balance', user_id)
        return resp?.data ?? null
      } catch (err) {
        console.error('calculateUserBalance error', err)
        return null
      }
    },

    openDialog() {
      this.editedIndex = -1
      this.editedItem = { ...this.defaultItem }
      this.dialog = true
    },

    closeDialog() {
      this.dialog = false
      this.editedItem = { ...this.defaultItem }
      this.editedIndex = -1
    },

    openDelete(id) {
      this.deletingId = id
      this.dialogDelete = true
    },

    closeDelete() {
      this.dialogDelete = false
      this.deletingId = null
    },
  },
})
