import { defineStore } from 'pinia';
import api from '../services/api';   
import api_2 from '../services/api_2'; 

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [],
    // dialogs & UI state
    dialog: false,
    dialogDelete: false,
    // editedIndex will hold the category id when editing, -1 when creating
    editedIndex: -1,
    editedItem: {
      id: '',
      name: '',
      description: '',
    },
    defaultItem: {
      id: '',
      name: '',
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
    async fetchCategories() {
      try {
        const resp = await api.get('/getCategory');
        // Expect array
        this.categories = resp.data.Category;
      } catch (err) {
        console.error('fetchCategories error', err);
      }
    },

    async createCategory(formData) {
      try {
        const resp = await api_2.post('/saveCategory', formData);
        // if API returns created category object, push it otherwise re-fetch
        if (resp && resp.data) {
          this.categories.unshift(resp.data);
        } else {
          await this.fetchCategories();
        }
        this.snackbarCreate = true;
      } catch (err) {
        console.error('createCategory error', err);
        throw err;
      }
    },

    async updateCategory(id, formData) {
      try {
        const resp = await api_2.post(`/updateCategory/${id}`, formData);
        if (resp && resp.data) {
          const idx = this.categories.findIndex(u => u.id == id);
          if (idx !== -1) this.categories.splice(idx, 1, resp.data);
        } else {
          await this.fetchCategories();
        }
        this.snackbarUpdate = true;
      } catch (err) {
        console.error('updateCategory error', err);
        throw err;
      }
    },

    async deleteCategory(id) {
      try {
        await api_2.delete(`/deleteCategory/${id}`);
        const idx = this.categories.findIndex(u => u.id == id);
        if (idx !== -1) this.categories.splice(idx, 1);
        this.snackbarDelete = true;
      } catch (err) {
        console.error('deleteCategory error', err);
        throw err;
      } finally {
        this.dialogDelete = false;
        this.deletingId = null;
      }
    },

    async editItem(id) {
      try {
        // Get single category from API
        const resp = await api.get(`/getCategory/${id}`);
        const data = resp.data.Category;
        // normalise to editedItem shape
        this.editedIndex = id;
        this.editedItem = {
          id: data.id,
          name: data.name || '',
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
