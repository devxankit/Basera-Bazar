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
  _normalize = (item) => {
    if (!item) return null;
    
    // Check if this is an enquiry/lead object
    if (item.enquiry_type || item.listing_snapshot) {
      return this._normalizeEnquiry(item);
    }

    // Create a copy to avoid mutating cache if any
    const normalized = {
      ...item,
      id: item._id || item.id
    };

    // Normalize Pricing
    if (item.pricing && (item.pricing.amount !== undefined || item.pricing.price_per_unit !== undefined)) {
      normalized.price = {
        value: item.pricing.amount || item.pricing.price_per_unit || 0,
        unit: item.pricing.unit || '',
        currency: item.pricing.currency || 'INR'
      };
    } else {
      normalized.price = { value: 0, unit: 'Contact for Price', currency: 'INR' };
    }

    // Normalize Images
    if (!normalized.image) {
      normalized.image = item.thumbnail || (item.images && item.images[0]) || (item.portfolio_images && item.portfolio_images[0]);
    }

    // Normalize Category (CRITICAL FOR ENQUIRIES)
    // Identify category based on unique structural markers in the document
    if (item.category) {
      normalized.category = item.category;
    } else if (item.listing_type || item.listing_intent || item.property_type) {
      normalized.category = 'property';
      normalized.serviceType = item.property_type || item.listing_type || 'Property';
    } else if (item.service_type || item.portfolio_images || item.years_of_experience !== undefined) {
      normalized.category = 'service';
    } else if (item.material_name || item.quality_grade) {
      normalized.category = 'mandi';
    } else if (item.pricing?.min_order_qty || item.brand_id) {
      normalized.category = 'supplier';
    } else {
      normalized.category = 'property'; // default fallback
    }

    // Normalize Location Display (PREVENTS OBJECT INJECTION CRASH)
    const district = item.address?.district || item.location_text?.split(',')[0];
    const state = item.address?.state || item.location_text?.split(',')[1];
    
    normalized.display_location = district && state 
      ? `${district}, ${state}` 
      : (district || state || item.location_text || 'Muzaffarpur, Bihar');
    
    // Normalize Area (PREVENTS OBJECT RENDERING CRASH)
    if (normalized.details && typeof normalized.details.area === 'object' && normalized.details.area !== null) {
      normalized.details.areaUnit = normalized.details.area.unit || 'sq.ft';
      normalized.details.area = normalized.details.area.value || ''; // Overwrite with string/number for UI
    }
    
    // Add BHK and Area to root for easy access
    normalized.bhk = item.details?.bhk || item.bhk || '';
    normalized.area = item.details?.areaValue || item.details?.area || item.area || '';
    normalized.areaUnit = item.details?.areaUnit || item.areaUnit || 'Sqft';

    // Legacy support for components using .location as a string
    if (item.location && typeof item.location === 'object') {
       normalized.location_coords = item.location.coordinates;
       normalized.location = String(normalized.display_location || '');
    } else {
        normalized.location = item.location_text || item.location?.address || '';
     }
 
     // Extract coordinates for mapping
     if (item.location && item.location.coordinates) {
       normalized.lng = item.location.coordinates[0];
       normalized.lat = item.location.coordinates[1];
     }

    // Normalize Owner/Partner Data
    const ownerData = item.partner_id || {};
    const profile = ownerData.profile || {};
    
    // Extract Business Name based on partner type
    const businessName = profile.property_profile?.agency_name || 
                        profile.mandi_profile?.business_name || 
                        profile.supplier_profile?.business_name || // fallback if exists
                        ownerData.name;

    normalized.owner = {
      id: ownerData._id || ownerData.id,
      name: businessName || 'Basera Properties',
      display_name: ownerData.name || 'Admin',
      phone: ownerData.phone || '9322910004',
      email: ownerData.email || 'contact@baserabazar.com',
      role: ownerData.role || (ownerData.partner_type?.replace('_', ' ') || 'Partner'),
      profileImage: ownerData.profileImage || profile.mandi_profile?.business_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(businessName || ownerData.name || 'Basera')}&background=f1f5f9&color=64748b`,
      location: ownerData.default_location ? `${ownerData.default_location.city || ''}, ${ownerData.default_location.state || ''}`.trim().replace(/^,/, '').trim() || 'Muzaffarpur, Bihar' : (ownerData.city ? `${ownerData.city}, ${ownerData.state}` : 'Muzaffarpur, Bihar'),
      joinedAt: ownerData.createdAt
    };

    return normalized;
  }

  _normalizeEnquiry(item) {
    return {
      id: item._id,
      category: item.enquiry_type,
      type: item.inquiry_type || 'enquiry',
      listingId: item.listing_id,
      listingTitle: item.listing_snapshot?.title || item.listing_snapshot?.serviceName || 'Listing Deleted',
      date: item.createdAt,
      content: item.content,
      status: item.status || 'sent',
      userId: item.user_id,
      phone: item.user_details?.phone,
      email: item.user_details?.email,
      name: item.user_details?.name
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
        return (response.data.data || []).map(this._normalize).filter(Boolean);
      }
      
      if (table === 'banners') {
        const response = await api.get('/listings/banners');
        return (response.data.data || []).map(this._normalize.bind(this)).filter(Boolean);
      }

      if (table === 'leads') {
        const response = await api.get('/users/enquiries');
        return (response.data.data || []).map(this._normalize.bind(this)).filter(Boolean);
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
          inquiry_type: item.inquiry_type || 'General Inquiry',
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
