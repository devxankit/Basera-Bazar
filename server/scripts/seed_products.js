require('dotenv').config();
const mongoose = require('mongoose');
const { SupplierListing } = require('../src/models/Listing');
const { Category, Brand, Unit } = require('../src/models/System');
const Partner = require('../src/models/Partner');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    // Fetch existing entities to link
    const partner = await Partner.findOne({ onboarding_status: 'approved' });
    if (!partner) {
       console.log("No approved partner found. Please create one first.");
       process.exit(1);
    }

    const category = await Category.findOne({ type: 'supplier', parent_id: null });
    const subcategory = await Category.findOne({ type: 'supplier', parent_id: { $ne: null } });
    const brand = await Brand.findOne({ is_active: true });
    const unit = await Unit.findOne({ is_active: true });

    if (!category || !brand || !unit) {
       console.log("Missing prerequisites (Category, Brand, or Unit). Attempting to use empty or fake references but they might fail validation if required fields are missing.");
    }

    // Clear existing supplier products just for clean slate if needed? 
    // Let's just insert a few.
    const newProducts = [
      {
        partner_id: partner._id,
        title: 'Premium OPC Cement 53 Grade',
        description: 'High quality cement for heavy construction.',
        category_id: category ? category._id : null,
        subcategory_id: subcategory ? subcategory._id : null,
        brand_id: brand ? brand._id : null,
        pricing: {
          unit_id: unit ? unit._id : null,
          price_per_unit: 420,
          min_order_qty: 50,
          bulk_discount_available: true
        },
        location: { type: 'Point', coordinates: [77.209, 28.6139] },
        delivery_radius_km: 100,
        status: 'active'
      },
      {
        partner_id: partner._id,
        title: 'High Strength TMT Bars 12mm',
        description: 'Corrosion resistant TMT bars.',
        category_id: category ? category._id : null,
        subcategory_id: subcategory ? subcategory._id : null,
        brand_id: brand ? brand._id : null,
        pricing: {
          unit_id: unit ? unit._id : null,
          price_per_unit: 65,
          min_order_qty: 100,
          bulk_discount_available: false
        },
        location: { type: 'Point', coordinates: [77.100, 28.500] },
        delivery_radius_km: 50,
        status: 'active'
      }
    ];

    await SupplierListing.insertMany(newProducts);
    console.log("Seeded 2 mock product listings.");
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
