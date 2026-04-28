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

    // Check if this is a partner object (Supplier)
    if (item.roles || item.partner_type) {
      const profile = item.profile || {};
      const businessName = profile.supplier_profile?.business_name || 
                          profile.mandi_profile?.business_name || 
                          item.name;

      normalized.title = businessName;
      normalized.businessName = businessName;
      normalized.category = 'supplier';
      // Clear out the old flaticon bell icon if it exists in the DB
      const imageFallback = "https://images.unsplash.com/photo-1586864387917-f579ae5259fb?q=80&w=400&auto=format&fit=crop";
      let rawImage = profile.business_logo || item.profileImage || item.image;
      if (rawImage && rawImage.includes('3119338.png')) rawImage = null;
      
      normalized.image = rawImage || imageFallback;
      normalized.price = { value: 0, unit: 'Contact for Quote', currency: 'INR' };
      normalized.isPartner = true;

      // For partners, the "owner" is the partner itself
      normalized.owner = {
        id: item._id || item.id,
        name: item.name,
        phone: item.phone,
        email: item.email,
        profileImage: item.profileImage || profile.mandi_profile?.business_logo,
        experience: profile.supplier_profile?.delivery_radius_km ? `${profile.supplier_profile.delivery_radius_km}km Radius` : 'Verified Supplier',
        role: item.active_role || item.partner_type || 'Supplier',
        location: item.district && item.state ? `${item.district}, ${item.state}` : (item.city ? `${item.city}, ${item.state}` : 'Muzaffarpur, Bihar'),
        memberSince: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A',
        contactPerson: item.name
      };
      
      // Also map some fields to the root for consistency
      normalized.location = normalized.owner.location;
      
      const materials = profile.supplier_profile?.material_categories;
      const serviceCat = profile.service_profile?.category_id;
      normalized.details = {
        skuCount: 0, 
        propertyType: (materials && materials.length > 0) ? materials.join(', ') : 
                     (serviceCat && typeof serviceCat === 'object' ? serviceCat.name : 
                     (item.category || 'Building Materials'))
      };
    } else {
      // Normalize Pricing for listings
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
        normalized.image = (item.thumbnail && item.thumbnail.trim() !== '') ? item.thumbnail : 
                          ((item.images && item.images.length > 0) ? item.images[0] : 
                          ((item.portfolio_images && item.portfolio_images.length > 0) ? item.portfolio_images[0] : null));
      }

      // Normalize Category (CRITICAL FOR ENQUIRIES)
      // Identify category based on unique structural markers in the document
      normalized.category_id = (item.category_id && typeof item.category_id === 'object' ? item.category_id._id : item.category_id);
      normalized.subcategory_id = (item.subcategory_id && typeof item.subcategory_id === 'object' ? item.subcategory_id._id : item.subcategory_id);
      normalized.category_name = (item.category_id && typeof item.category_id === 'object' ? item.category_id.name : item.category);
      normalized.subcategory_name = (item.subcategory_id && typeof item.subcategory_id === 'object' ? item.subcategory_id.name : item.subcategory);

      if (item.category) {
        normalized.category = item.category;
      } else if (item.listing_type || item.listing_intent || item.property_type) {
        normalized.category = 'property';
        normalized.serviceType = item.property_type || item.listing_type || 'Property';
      } else if (item.service_type || item.portfolio_images || item.years_of_experience !== undefined || item.experience !== undefined) {
        normalized.category = 'service';
        normalized.serviceType = item.service_type || 'Service';
      } else if (item.material_name || item.quality_grade) {
        normalized.category = 'mandi';
      } else if (item.pricing?.min_order_qty || item.brand_id) {
        normalized.category = 'supplier';
      } else {
        normalized.category = 'property'; // default fallback
      }
    }

    // Normalize Location Display (PREVENTS OBJECT INJECTION CRASH)
    const district = item.district || item.address?.district || item.location_text?.split(',')[0];
    const state = item.state || item.address?.state || item.location_text?.split(',')[1];
    
    normalized.display_location = district && state 
      ? `${district}, ${state}` 
      : (district || state || item.location_text || 'Muzaffarpur, Bihar');
    
    // Crucial: Overwrite root location with string to prevent React rendering crashes
    normalized.location = normalized.display_location;
    
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

  async getCategories(type, parentId = null) {
    try {
      const response = await api.get('/listings/categories', {
        params: { type, parent_id: parentId }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching categories:`, error);
      return [];
    }
  }

  async getAll(table, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();

      // Mapping table names to backend routes
      if (table === 'listings') {
        const response = await api.get(`/listings?${queryParams}`);
        return (response.data.data || []).map(this._normalize).filter(Boolean);
      }
      
      if (table === 'partners') {
        const response = await api.get(`/partners/public?${queryParams}`);
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
      if (table === 'partners') {
        const response = await api.get(`/partners/public/${id}`);
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
      const { compressImage } = await import('../utils/imageUtils');
      const optimizedFile = await compressImage(file);
      
      const formData = new FormData();
      formData.append('image', optimizedFile);
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
        if (item.category === 'service' || item.listing_type === 'service') endpoint = '/listings/services';
        if (item.category === 'supplier' || item.listing_type === 'supplier') endpoint = '/listings/suppliers';

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

  async update(table, id, data) {
    try {
      if (table === 'listings') {
        const response = await api.put(`/listings/${id}`, data);
        return this._normalize(response.data.data || response.data);
      }
      return null;
    } catch (error) {
      console.error(`Error updating ${table} ${id}:`, error);
      throw error;
    }
  }

  async recordInteraction(id, type) {
    try {
      await api.post(`/listings/${id}/interaction`, { type });
    } catch (error) {
      console.error(`Error recording interaction ${type} for ${id}:`, error);
    }
  }
}

export const db = new DataEngine();
