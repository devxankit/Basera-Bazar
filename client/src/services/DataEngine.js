const STORAGE_KEY = 'baserabazar_db';

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
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      featured: true, details: { propertyType: 'plot', area: '2,040', areaUnit: 'sqft', facing: 'East', description: 'Prime residential plot.' },
      owner: { name: 'Sanjeev Singh', phone: '+91 98765 43210' }
    },
    {
      id: 'l4', title: 'Modern 3BHK Apartment', category: 'property', type: 'FOR RENT',
      price: { value: '15,000', unit: '/mo' }, location: 'Patna, Bihar',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      details: { propertyType: 'apartment', bedrooms: 3, bathrooms: 2, description: 'Fully furnished modern apartment in heart of city.' }
    },
    {
      id: 'prop_com_1', title: 'Retail Shop Space', category: 'property', type: 'FOR RENT',
      price: { value: '25,000', unit: '/mo' }, location: 'Kankarbagh, Patna',
      image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80',
      details: { propertyType: 'commercial', area: '500', areaUnit: 'sqft', description: 'High footfall retail shop space on main road.' }
    },
    {
      id: 'prop_villa_1', title: 'Luxury Villa', category: 'property', type: 'FOR SALE',
      price: { value: '1.20', unit: 'Cr' }, location: 'Danapur, Patna',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      featured: true, details: { propertyType: 'villa', bedrooms: 4, bathrooms: 4, description: 'Premium luxury villa with private garden and pool.' }
    },

    // --- SERVICES ---
    {
      id: 'l3', title: 'CCTV & Computers Service', category: 'service', type: 'BOOKING',
      price: { value: '500', unit: '/visit' }, location: 'Muzaffarpur, Bihar',
      businessName: 'NEW PATNA COMPUTER', rating: 5.0, experience: '10 years of experience',
      image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=800&q=80',
      featured: true, details: { propertyType: 'ac maintenance', description: 'All types of AC repair and maintenance services.' },
      owner: { 
        name: 'Ravi Kumar', 
        phone: '8969321391', 
        email: 'pcomputer@basera.com',
        fullAddress: 'CHHOTI KALYANI ROAD, CHHOTI KALYANI, Muzaffarpur, Bihar, 842001',
        businessAddress: 'CHHOTI KALYANI ROAD, CHHOTI KALYANI, Muzaffarpur, Bihar, 842001'
      },
      portfolio: [
        'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=800&q=80',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
        'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&q=80',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80'
      ],
      about: 'CCTV Dealers Laptop Dealers Laptop Repair & Services Cartridge Ink Dealers Cartridge Ink Dealers-HP Computer & Printer Sales Repairing Services Computer Accessory Dealers Computer Dealers Computer Dealers-Del...'
    },
    {
      id: 'srv_plumb_1', title: 'Shanawaz AC Services', category: 'service', type: 'BOOKING',
      price: { value: '300', unit: '/visit' }, location: 'Damodarpur, Muzaffarpur, Bihar',
      businessName: 'Shahnwaz AC Services', rating: 4.5, experience: '5 years of experience',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
      featured: true, details: { propertyType: 'ac maintenance', description: 'Expert plumbing services for residential and commercial.' },
      owner: { 
        name: 'Shanawaz', 
        phone: '9876543210',
        email: 'shanawaz@basera.com',
        fullAddress: 'Damodarpur, Muzaffarpur, Bihar'
      },
      portfolio: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80'
      ],
      about: 'Specialized in AC maintenance and deep cleaning.'
    },
    {
      id: 'srv_elec_1', title: 'Bright Light Electricians', category: 'service', type: 'BOOKING',
      price: { value: '400', unit: '/visit' }, location: 'Gaya, Bihar',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
      details: { propertyType: 'electrical', description: 'Wiring, appliance repair, and general electrical works.' }
    },
    {
      id: 'srv_clean_1', title: 'Sparkle Deep Cleaning', category: 'service', type: 'BOOKING',
      price: { value: '2,500', unit: '/home' }, location: 'Muzaffarpur, Bihar',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
      details: { propertyType: 'cleaning', description: 'Complete home deep cleaning services with professional equipment.' }
    },

    // --- SUPPLIERS ---
    {
      id: 'l2', title: 'Thakur Enterprises', category: 'supplier', type: 'SUPPLIER',
      location: 'Muzaffarpur, Bihar',
      image: 'https://images.unsplash.com/photo-1590060417631-41961919d873?w=800&q=80',
      details: { propertyType: 'bricks', skuCount: 3, description: 'Quality bricks and construction materials supplier.' },
      owner: { name: 'Amit Thakur', phone: '+91 91234 56789' }
    },
    {
      id: 'l5', title: 'Bihar Construction Materials', category: 'supplier', type: 'SUPPLIER',
      location: 'Patna, Bihar',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
      featured: true, details: { propertyType: 'aggregate', skuCount: 12, description: 'Sand, stone, and aggregate wholesale supplier.' }
    },
    {
      id: 'sup_cement_1', title: 'Ultra Cements Dealer', category: 'supplier', type: 'SUPPLIER',
      location: 'Hajipur, Bihar',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
      details: { propertyType: 'cement', skuCount: 5, description: 'Authorized dealer for top cement brands.' }
    },
    {
      id: 'sup_paint_1', title: 'Colors & Co. Hardware', category: 'supplier', type: 'SUPPLIER',
      location: 'Bhagalpur, Bihar',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
      details: { propertyType: 'paint', skuCount: 150, description: 'Interior and exterior paints, primers, and painting tools.' }
    }
  ],
  leads: [],
  banners: [
    { id: 'b1', title: 'Find Your Dream Home', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6199f7ea8f?w=1200&q=80', isActive: true },
    { id: 'b2', title: 'Expert Property Consultants', imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80', isActive: true },
    { id: 'b3', title: 'Verified Service Partners', imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dee3f?w=1200&q=80', isActive: true }
  ]
};

class DataEngine {
  constructor() {
    this.data = this._load();
    // Migration: ensure banners exist if they were added later
    if (!this.data.banners || this.data.banners.length === 0) {
      this.data.banners = initialData.banners;
      this._save();
    }
    // Migration: Ensure we have all sample data loaded (if new items were added to initialData)
    if ((this.data.listings?.length || 0) < initialData.listings.length) {
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
