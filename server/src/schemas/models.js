/**
 * BaseraBazar Data Models and Schema Definitions
 * These schemas represent the core data structures for the platform.
 */

export const UserRole = {
  USER: 'user',
  PARTNER: 'partner',
  ADMIN: 'admin'
};

export const PartnerCategory = {
  PROPERTY: 'property',
  SERVICE: 'service',
  SUPPLIER: 'supplier'
};

export const ListingStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// USER MODEL
export const UserSchema = {
  id: '',
  name: '',
  email: '',
  phone: '',
  password: '', // Hashed
  role: UserRole.USER,
  avatar: '',
  createdAt: '',
  updatedAt: ''
};

// PARTNER MODEL (Extends User via userId)
export const PartnerSchema = {
  id: '',
  userId: '',
  category: PartnerCategory.PROPERTY,
  subscriptionId: '',
  businessName: '',
  businessLogo: '',
  businessAddress: '',
  kycStatus: 'pending',
  featureLimit: 0, // Number of featured listings allowed
  currentFeaturedCount: 0,
  createdAt: ''
};

// LISTING MODEL (Base)
export const ListingSchema = {
  id: '',
  partnerId: '',
  category: PartnerCategory.PROPERTY,
  title: '',
  description: '',
  price: 0,
  location: {
    address: '',
    city: '',
    state: '',
    zip: ''
  },
  images: [], // Array of URLs
  isFeatured: false,
  status: ListingStatus.PENDING,
  details: {}, // Category-specific details (Property/Service/Supplier)
  createdAt: '',
  updatedAt: ''
};

// SUBSCRIPTION PLAN MODEL
export const SubscriptionPlanSchema = {
  id: '',
  name: '', // e.g., 'Free', 'Silver', 'Gold', 'Platinum'
  price: 0,
  durationInDays: 30,
  features: {
    featureListingCount: 0,
    listingPriority: 'normal',
    analytics: false
  },
  description: ''
};

// LEAD MODEL
export const LeadSchema = {
  id: '',
  listingId: '',
  partnerId: '',
  userId: '', // Optional (guest lead or registered user)
  name: '',
  phone: '',
  email: '',
  message: '',
  status: 'new', // 'new', 'contacted', 'converted', 'closed'
  createdAt: ''
};

// BANNER MODEL
export const BannerSchema = {
  id: '',
  imageUrl: '',
  title: '',
  link: '', // Redirect for click
  order: 0,
  isActive: true,
  createdAt: ''
};
