import { defineStore } from 'pinia';
import api from '../services/api';   
import api_2 from '../services/api_2'; 

export const useRestaurantsStore = defineStore('restaurants', {
  state: () => ({
    restaurants: [],
    // dialogs & UI state
    dialog: false,
    dialogDelete: false,
    // editedIndex will hold the restaurant id when editing, -1 when creating
    editedIndex: -1,
    editedItem: {
      id: '',
      name: '',
      address: '',
      description: '',
    },
    defaultItem: {
      id: '',
      name: '',
      address: '',
      description: '',
    },
    // snackbars
    snackbarCreate: false,
    snackbarUpdate: false,
    snackbarDelete: false,
    // delete target id
    deletingId: null,
  }),

  actions: {
    async fetchRestaurants() {
      try {
        const resp = await api.get('/getRestaurant');
        // Expect array
        this.restaurants = resp.data.Restaurant;
      } catch (err) {
        console.error('fetchRestaurants error', err);
      }
    },

    async createRestaurant(formData) {
      try {
        const resp = await api_2.post('/saveRestaurant', formData);
        // if API returns created restaurant object, push it otherwise re-fetch
        if (resp && resp.data) {
          this.restaurants.unshift(resp.data);
        } else {
          await this.fetchRestaurants();
        }
        this.snackbarCreate = true;
      } catch (err) {
        console.error('createRestaurant error', err);
        throw err;
      }
    },

    async updateRestaurant(id, formData) {
      try {
        const resp = await api_2.post(`/updateRestaurant/${id}`, formData);
        if (resp && resp.data) {
          const idx = this.restaurants.findIndex(u => u.id == id);
          if (idx !== -1) this.restaurants.splice(idx, 1, resp.data);
        } else {
          await this.fetchRestaurants();
        }
        this.snackbarUpdate = true;
      } catch (err) {
        console.error('updateRestaurant error', err);
        throw err;
      }
    },

    async deleteRestaurant(id) {
      try {
        await api_2.delete(`/deleteRestaurant/${id}`);
        const idx = this.restaurants.findIndex(u => u.id == id);
        if (idx !== -1) this.restaurants.splice(idx, 1);
        this.snackbarDelete = true;
      } catch (err) {
        console.error('deleteRestaurant error', err);
        throw err;
      } finally {
        this.dialogDelete = false;
        this.deletingId = null;
      }
    },

    async editItem(id) {
      try {
        // Get single restaurant from API
        const resp = await api.get(`/getRestaurant/${id}`);
        const data = resp.data.Restaurant;
        // normalise to editedItem shape
        this.editedIndex = id;
        this.editedItem = {
          id: data.id,
          name: data.name || '',
          address: data.address || '',
          description: data.description || '',
        };
        this.dialog = true;
      } catch (err) {
        console.error('editItem error', err);
      }
    },

    openDialog() {
      this.editedIndex = -1;
      this.editedItem = { ...this.defaultItem };
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
      this.editedItem = { ...this.defaultItem };
      this.editedIndex = -1;
    },

    openDelete(id) {
      this.deletingId = id;
      this.dialogDelete = true;
    },

    closeDelete() {
      this.dialogDelete = false;
      this.deletingId = null;
    },
  },
});
