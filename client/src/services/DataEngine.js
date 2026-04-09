import api from './api';

/**
 * ------------------------------------------------------------------------------------------
 * 🚀 DATA ENGINE (REFACTORED FOR REAL BACKEND)
 * ------------------------------------------------------------------------------------------
 * This service layer bridges the Frontend with our Express/MongoDB backend.
 * It replaces the previous localStorage logic with real async Axios calls.
 */

class DataEngine {
  // -----------------------------------------------------
  // HELPERS
  // -----------------------------------------------------
  
  // MongoDB uses _id, but our frontend (framer-motion, etc) often uses id.
  // We normalize this globally here to prevent UI crashes!
  _normalize(item) {
    if (!item) return null;
    return {
      ...item,
      id: item._id || item.id
    };
  }

  // -----------------------------------------------------
  // READ OPERATIONS
  // -----------------------------------------------------

  async getAll(table, params = {}) {
    try {
      // Mapping table names to backend routes
      if (table === 'listings') {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/listings?${queryParams}`);
        return (response.data.data || []).map(this._normalize);
      }
      
      if (table === 'banners') {
        // Return empty so the UI component uses its bundled defaults
        return [];
      }

      return [];
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      return [];
    }
  }

  async getById(table, id) {
    try {
      if (table === 'listings') {
        const response = await api.get(`/listings/${id}`);
        return this._normalize(response.data.data);
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${table} by id:`, error);
      return null;
    }
  }

  // -----------------------------------------------------
  // WRITE OPERATIONS
  // -----------------------------------------------------

  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data; // { success: true, url: "..." }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  async create(table, item) {
    try {
      if (table === 'leads') {
        const payload = {
          enquiry_type: item.category,
          listing_id: item.listingId,
          content: item.message,
          user_details: {
            name: item.name,
            phone: item.phone,
            email: item.email
          }
        };
        const response = await api.post('/enquiries', payload);
        return this._normalize(response.data.data);
      }

      if (table === 'listings') {
        let endpoint = '/listings/properties';
        if (item.category === 'service') endpoint = '/listings/services';
        if (item.category === 'supplier') endpoint = '/listings/suppliers';

        // Mapping for Property intention
        if (item.intention) {
           item.listing_type = item.intention === 'For Sale' ? 'sale' : 'rent';
        }

        // Mapping for Location
        if (item.latitude && item.longitude) {
           item.location = {
              type: 'Point',
              coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)]
           };
        }

        const response = await api.post(endpoint, item);
        return this._normalize(response.data.data);
      }

      return null;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      throw error;
    }
  }
}

export const db = new DataEngine();
