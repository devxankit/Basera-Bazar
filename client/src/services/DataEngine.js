const STORAGE_KEY = 'baserabazar_db_v3';

import heroRealEstate from '../assets/images/hero_real_estate.png';
import heroSupplier from '../assets/images/hero_supplier.png';
import heroHomeService from '../assets/images/hero_home_service.png';
import propFeatured1 from '../assets/images/prop_featured_1.png';
import srvAcFix from '../assets/images/srv_ac_fix.png';
import srvSecurityCam from '../assets/images/srv_security_cam.png';

const initialData = {
  users: [
    { id: 'u1', name: 'Premium User', email: 'user@example.com', role: 'user' }
  ],
  partners: [
    { id: 'p1', name: 'Ravi Kumar', email: 'partner@example.com', role: 'partner', category: 'property' }
  ],
  listings: [
    // --- PROPERTIES ---
    {
      id: 'l1', title: 'Residential Plot For Sale', category: 'property', type: 'FOR SALE',
      price: { value: '52.00', unit: 'L' }, location: 'Muzaffarpur, Bihar',
      image: propFeatured1,
      featured: true, details: { propertyType: 'plot', area: '2,040', areaUnit: 'sqft', facing: 'East', description: 'Prime residential plot.' },
      owner: { name: 'Sanjeev Singh', phone: '+91 98765 43210' }
    },
    {
      id: 'l4', title: 'Modern 3BHK Apartment', category: 'property', type: 'FOR RENT',
      price: { value: '15,000', unit: '/mo' }, location: 'Muzaffarpur, Bihar',
      image: heroRealEstate,
      details: { propertyType: 'apartment', bedrooms: 3, bathrooms: 2, description: 'Fully furnished modern apartment in heart of city.' }
    },
    {
      id: 'prop_com_1', title: 'Retail Shop Space', category: 'property', type: 'FOR RENT',
      price: { value: '25,000', unit: '/mo' }, location: 'Muzaffarpur, Bihar',
      image: heroRealEstate,
      details: { propertyType: 'commercial', area: '500', areaUnit: 'sqft', description: 'High footfall retail shop space on main road.' }
    },
    {
      id: 'prop_villa_1', title: 'Luxury Villa', category: 'property', type: 'FOR SALE',
      price: { value: '1.20', unit: 'Cr' }, location: 'Muzaffarpur, Bihar',
      image: propFeatured1,
      featured: true, details: { propertyType: 'villa', bedrooms: 4, bathrooms: 4, description: 'Premium luxury villa with private garden and pool.' }
    },

    // --- SERVICES ---
    {
      id: 'l3', title: 'CCTV & Computers Service', category: 'service', type: 'BOOKING',
      price: { value: '500', unit: '/visit' }, location: 'Muzaffarpur, Bihar',
      businessName: 'NEW PATNA COMPUTER', rating: 5.0, experience: '10 years of experience',
      image: srvSecurityCam,
      featured: true, details: { propertyType: 'ac maintenance', description: 'All types of AC repair and maintenance services.' },
      owner: { 
        name: 'Ravi Kumar', 
        phone: '8969321391', 
        email: 'pcomputer@basera.com',
        fullAddress: 'CHHOTI KALYANI ROAD, CHHOTI KALYANI, Muzaffarpur, Bihar, 842001',
        businessAddress: 'CHHOTI KALYANI ROAD, CHHOTI KALYANI, Muzaffarpur, Bihar, 842001'
      },
      portfolio: [
        srvSecurityCam,
        srvAcFix,
        heroHomeService
      ],
      about: 'Specialized in AC maintenance and deep cleaning.'
    },
    {
      id: 'srv_elec_1', title: 'Bright Light Electricians', category: 'service', type: 'BOOKING',
      price: { value: '400', unit: '/visit' }, location: 'Gaya, Bihar',
      image: heroHomeService,
      details: { propertyType: 'electrical', description: 'Wiring, appliance repair, and general electrical works.' }
    },
    {
      id: 'srv_clean_1', title: 'Sparkle Deep Cleaning', category: 'service', type: 'BOOKING',
      price: { value: '2,500', unit: '/home' }, location: 'Muzaffarpur, Bihar',
      image: heroHomeService,
      details: { propertyType: 'cleaning', description: 'Complete home deep cleaning services with professional equipment.' }
    },

    // --- SUPPLIERS ---
    {
      id: 'l2', title: 'Thakur Enterprises', category: 'supplier', type: 'SUPPLIER',
      location: 'Muzaffarpur, Bihar',
      image: heroSupplier,
      details: { propertyType: 'bricks', skuCount: 3, description: 'Quality bricks and construction materials supplier.' },
      owner: { 
        name: 'Thakur Enterprises',
        contactPerson: 'Ashish Kumar', 
        phone: '7070966162',
        email: 'thakur@basera.com',
        memberSince: 'Mar 2026',
        fullAddress: 'Pandit Pakri Chowk, Subhankarpur, Muzaffarpur Bihar',
        district: 'Muzaffarpur',
        state: 'Bihar',
        verificationStatus: 'Active',
        experience: 'New'
      }
    },
    {
      id: 'l5', title: 'Bihar Construction Materials', category: 'supplier', type: 'SUPPLIER',
      location: 'Patna, Bihar',
      image: heroSupplier,
      featured: true, 
      details: { propertyType: 'aggregate', skuCount: 12, description: 'Sand, stone, and aggregate wholesale supplier.' },
      owner: {
        name: 'Bihar Construction Materials',
        contactPerson: 'Rajesh Sharma',
        phone: '9876543210',
        email: 'bihar.const@gmail.com',
        memberSince: 'Jan 2025',
        fullAddress: 'Boring Road, Patna, Bihar',
        district: 'Patna',
        state: 'Bihar',
        verificationStatus: 'Active',
        experience: '5+ Years'
      }
    },
    {
      id: 'sup_cement_1', title: 'Ultra Cements Dealer', category: 'supplier', type: 'SUPPLIER',
      location: 'Hajipur, Bihar',
      image: heroSupplier,
      details: { propertyType: 'cement', skuCount: 5, description: 'Authorized dealer for top cement brands.' },
      owner: {
        name: 'Ultra Cements Dealer',
        contactPerson: 'Manoj Singh',
        phone: '9988776655',
        email: 'ultra.hajipur@gmail.com',
        memberSince: 'Jun 2024',
        fullAddress: 'Station Road, Hajipur, Bihar',
        district: 'Vaishali',
        state: 'Bihar',
        verificationStatus: 'Active',
        experience: '2+ Years'
      }
    },
    {
      id: 'sup_paint_1', title: 'Colors & Co. Hardware', category: 'supplier', type: 'SUPPLIER',
      location: 'Bhagalpur, Bihar',
      image: heroSupplier,
      details: { propertyType: 'paint', skuCount: 150, description: 'Interior and exterior paints, primers, and painting tools.' },
      owner: {
        name: 'Colors & Co. Hardware',
        contactPerson: 'Vikram Sahay',
        phone: '8877665544',
        email: 'colors bhagalpur@gmail.com',
        memberSince: 'Feb 2023',
        fullAddress: 'Khali Market, Bhagalpur, Bihar',
        district: 'Bhagalpur',
        state: 'Bihar',
        verificationStatus: 'Active',
        experience: '8+ Years'
      }
    }
  ],
  leads: [],
  banners: [
    { id: 'b1', title: 'Find Your Dream Home', imageUrl: heroRealEstate, isActive: true },
    { id: 'b2', title: 'Expert Property Consultants', imageUrl: heroSupplier, isActive: true },
    { id: 'b3', title: 'Verified Service Partners', imageUrl: heroHomeService, isActive: true }
  ]
};

class DataEngine {
  constructor() {
    this.data = this._load();
    
    // Migration: Force update banners if they use old Unsplash URLs
    const hasExternalBanners = this.data.banners?.some(b => 
      typeof b.imageUrl === 'string' && b.imageUrl.includes('unsplash.com')
    );

    if (!this.data.banners || this.data.banners.length === 0 || hasExternalBanners) {
      this.data.banners = initialData.banners;
      this._save();
    }

    // Migration: Force update listings if they use old Unsplash URLs
    const hasExternalListings = this.data.listings?.some(l => 
      typeof l.image === 'string' && l.image.includes('unsplash.com')
    );

    if ((this.data.listings?.length || 0) < initialData.listings.length || hasExternalListings) {
      this.data.listings = initialData.listings;
      this._save();
    }
  }

  _load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialData;
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  async getAll(table) {
    return this.data[table] || [];
  }

  async getById(table, id) {
    return (this.data[table] || []).find(item => item.id === id);
  }

  async create(table, item) {
    const newItem = { ...item, id: Date.now().toString() };
    this.data[table] = [...(this.data[table] || []), newItem];
    this._save();
    return newItem;
  }
}

export const db = new DataEngine();
