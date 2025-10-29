import { defineStore } from 'pinia';
import api from '../services/api';   
import api_2 from '../services/api_2'; 

export const useRolesStore = defineStore('roles', {
  state: () => ({
    roles: [],
    // dialogs & UI state
    dialog: false,
    dialogDelete: false,
    // editedIndex will hold the role id when editing, -1 when creating
    editedIndex: -1,
    editedItem: {
      id: '',
      name: '',
      slug: '',
      description: '',
    },
    defaultItem: {
      id: '',
      name: '',
      slug: '',
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
    async fetchRoles() {
      try {
        const resp = await api.get('/getRoles');
        // Expect array
        this.roles = resp.data.Roles;
      } catch (err) {
        console.error('fetchRoles error', err);
      }
    },

    async createRole(formData) {
      try {
        const resp = await api_2.post('/saveRole', formData);
        // if API returns created role object, push it otherwise re-fetch
        if (resp && resp.data) {
          this.roles.unshift(resp.data);
        } else {
          await this.fetchRoles();
        }
        this.snackbarCreate = true;
      } catch (err) {
        console.error('createRole error', err);
        throw err;
      }
    },

    async updateRole(id, formData) {
      try {
        const resp = await api_2.post(`/updateRole/${id}`, formData);
        if (resp && resp.data) {
          const idx = this.roles.findIndex(u => u.id == id);
          if (idx !== -1) this.roles.splice(idx, 1, resp.data);
        } else {
          await this.fetchRoles();
        }
        this.snackbarUpdate = true;
      } catch (err) {
        console.error('updateRole error', err);
        throw err;
      }
    },

    async deleteRole(id) {
      try {
        await api_2.delete(`/deleteRole/${id}`);
        const idx = this.roles.findIndex(u => u.id == id);
        if (idx !== -1) this.roles.splice(idx, 1);
        this.snackbarDelete = true;
      } catch (err) {
        console.error('deleteRole error', err);
        throw err;
      } finally {
        this.dialogDelete = false;
        this.deletingId = null;
      }
    },

    async editItem(id) {
      try {
        // Get single role from API
        const resp = await api.get(`/getRole/${id}`);
        const data = resp.data.Role;
        // normalise to editedItem shape
        this.editedIndex = id;
        this.editedItem = {
          id: data.id,
          name: data.name || '',
          slug: data.slug || '',
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
