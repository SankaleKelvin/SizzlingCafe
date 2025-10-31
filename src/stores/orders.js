import { defineStore } from 'pinia'
import api from '../services/api'
import api_2 from '../services/api_2'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
    // dialogs & UI state
    dialog: false,
    dialogDelete: false,
    // editedIndex will hold the order id when editing, -1 when creating
    editedIndex: -1,
    editedItem: {
      id: '',
      status: '',
      quantity: '',
      user_id: null,
      food_id: null,
    },
    defaultItem: {
      id: '',
      status: '',
      quantity: '',
      user_id: null,
      food_id: null,
    },
    // snackbars
    snackbarCreate: false,
    snackbarUpdate: false,
    snackbarDelete: false,
    // delete target id
    deletingId: null,
  }),

  actions: {
    async fetchOrders() {
      try {
        const resp = await api.get('/getOrder')
        // Expect array
        this.orders = resp.data.Order
      } catch (err) {
        console.error('fetchOrders error', err)
      }
    },

    async createOrder(formData) {
      try {
        const resp = await api_2.post('/saveOrder', formData)
        // if API returns created order object, push it otherwise re-fetch
        if (resp && resp.data) {
          this.orders.unshift(resp.data)
        } else {
          await this.fetchOrders()
        }
        this.snackbarCreate = true
      } catch (err) {
        console.error('createOrder error', err)
        throw err
      }
    },

    async updateOrder(id, formData) {
      try {
        const resp = await api_2.post(`/updateOrder/${id}`, formData)
        if (resp && resp.data) {
          const idx = this.orders.findIndex((u) => u.id == id)
          if (idx !== -1) this.orders.splice(idx, 1, resp.data)
        } else {
          await this.fetchOrders()
        }
        this.snackbarUpdate = true
      } catch (err) {
        console.error('updateOrder error', err)
        throw err
      }
    },

    async deleteOrder(id) {
      try {
        await api_2.delete(`/deleteOrder/${id}`)
        const idx = this.orders.findIndex((u) => u.id == id)
        if (idx !== -1) this.orders.splice(idx, 1)
        this.snackbarDelete = true
      } catch (err) {
        console.error('deleteOrder error', err)
        throw err
      } finally {
        this.dialogDelete = false
        this.deletingId = null
      }
    },

    async editItem(id) {
      try {
        // Get single order from API
        const resp = await api.get(`/getOrder/${id}`)
        const data = resp.data.Order
        // normalise to editedItem shape
        this.editedIndex = id
        this.editedItem = {
          id: data.id,
          quantity: data.quantity || '',
          status: data.status || '',
          user_id: data.user_id ?? null,
          food_id: data.food_id ?? null,
        }
        this.dialog = true
      } catch (err) {
        console.error('editItem error', err)
      }
    },

    async calculateTotal(food_id, quantity) {
      try {
        const resp = await api_2.post('/calculateOrder', { food_id, quantity })
        if (resp && resp.data) {
          return resp.data.total ?? resp.data
        }
        return null
      } catch (err) {
        console.error('calculateTotal error', err)
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
