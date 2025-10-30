import { defineStore } from 'pinia';
import api from '../services/api';   
import api_2 from '../services/api_2'; 

export const useFoodsStore = defineStore('foods', {
  state: () => ({
    foods: [],
    // dialogs & UI state
    dialog: false,
    dialogDelete: false,
    // editedIndex will hold the food id when editing, -1 when creating
    editedIndex: -1,
    editedItem: {
      id: '',
      name: '',
      food_code: '',
      price: '',
      description: true,
      restaurant_id: null,
      category_id: null,
      food_image: null,
    },
    defaultItem: {
      id: '',
      name: '',
      food_code: '',
      price: '',
      description: true,
      restaurant_id: null,
      category_id: null,
      food_image: null,
    },
    // snackbars
    snackbarCreate: false,
    snackbarUpdate: false,
    snackbarDelete: false,
    // delete target id
    deletingId: null,
  }),

  actions: {
    async fetchFoods() {
      try {
        const resp = await api.get('/getFood');
        // Expect array
        this.foods = resp.data.Food;
      } catch (err) {
        console.error('fetchFoods error', err);
      }
    },

    async createFood(formData) {
      try {
        const resp = await api_2.post('/saveFood', formData);
        // if API returns created food object, push it otherwise re-fetch
        if (resp && resp.data) {
          this.foods.unshift(resp.data);
        } else {
          await this.fetchFoods();
        }
        this.snackbarCreate = true;
      } catch (err) {
        console.error('createFood error', err);
        throw err;
      }
    },

    async updateFood(id, formData) {
      try {
        const resp = await api_2.post(`/updateFood/${id}`, formData);
        if (resp && resp.data) {
          const idx = this.foods.findIndex(u => u.id == id);
          if (idx !== -1) this.foods.splice(idx, 1, resp.data);
        } else {
          await this.fetchFoods();
        }
        this.snackbarUpdate = true;
      } catch (err) {
        console.error('updateFood error', err);
        throw err;
      }
    },

    async deleteFood(id) {
      try {
        await api_2.delete(`/deleteFood/${id}`);
        const idx = this.foods.findIndex(u => u.id == id);
        if (idx !== -1) this.foods.splice(idx, 1);
        this.snackbarDelete = true;
      } catch (err) {
        console.error('deleteFood error', err);
        throw err;
      } finally {
        this.dialogDelete = false;
        this.deletingId = null;
      }
    },

    async editItem(id) {
      try {
        // Get single food from API
        const resp = await api.get(`/getFood/${id}`);
        const data = resp.data.Food;
        // normalise to editedItem shape
        this.editedIndex = id;
        this.editedItem = {
          id: data.id,
          name: data.name || '',
          food_code: data.food_code || '',
          price: data.price || '',
          description: data.description || '',
          restaurant_id: data.restaurant_id ?? null,
          category_id: data.category_id ?? null,
          food_image: data.food_image ?? null,
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
