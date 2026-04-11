const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const { PropertyListing, ServiceListing, SupplierListing } = require('./server/src/models/Listing');
const { Category } = require('./server/src/models/System');
const { Partner } = require('./server/src/models/Partner');
const { User } = require('./server/src/models/User');

const seedProductionData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for production seeding...");

        // 1. Ensure Categories exist
        const categoriesData = [
            { name: "Residential", type: "property", slug: "residential" },
            { name: "Commercial", type: "property", slug: "commercial" },
            { name: "Plumbing", type: "service", slug: "plumbing" },
            { name: "Cement", type: "material", slug: "cement" }
        ];

        for (const cat of categoriesData) {
            await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
        }

        const propCat = await Category.findOne({ slug: 'residential' });
        const servCat = await Category.findOne({ slug: 'plumbing' });
        const matCat = await Category.findOne({ slug: 'cement' });

        // 2. Find or create Partners
        let agent = await Partner.findOne({ email: 'agent@demo.com' });
        if (!agent) {
            agent = await Partner.create({
                name: 'Jaipur Real Estate',
                email: 'agent@demo.com',
                phone: '9888877777',
                password: 'password123',
                role: 'Agent',
                partner_type: 'property_agent',
                onboarding_status: 'approved'
            });
        }

        let provider = await Partner.findOne({ email: 'service@demo.com' });
        if (!provider) {
            provider = await Partner.create({
                name: 'QuickFix Services',
                email: 'service@demo.com',
                phone: '9111122222',
                password: 'password123',
                role: 'Service Provider',
                partner_type: 'service_provider',
                onboarding_status: 'approved'
            });
        }

        // 3. Create Samples
        // Properties
        await PropertyListing.create({
            partner_id: agent._id,
            category_id: propCat._id,
            title: "Premium 3BHK Apartment - Jagatpura",
            property_type: "apartment",
            listing_intent: "sell",
            pricing: { amount: 6500000 },
            address: { state: "Rajasthan", district: "Jaipur", full_address: "Jagatpur Extension", pincode: "302017" },
            details: { bhk: 3, bathrooms: 2, area: { value: 1450, unit: "sqft" } },
            images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"],
            status: 'active',
            location: { type: 'Point', coordinates: [75.8185, 26.9124] }
        });

        // Services
        await ServiceListing.create({
            partner_id: provider._id,
            category_id: servCat._id,
            title: "Expert Leak Repair & Fitting",
            description: "24/7 plumbing services across Jaipur",
            location: { type: 'Point', coordinates: [75.8185, 26.9124] },
            service_radius_km: 20,
            status: 'active'
        });

        // Products
        await SupplierListing.create({
            partner_id: provider._id,
            title: "Ultra-Strong Portland Cement (Grade 53)",
            description: "Premium quality cement for structural work",
            material_category: "cement",
            pricing: { unit: "bag", price_per_unit: 450, min_order_qty: 50 },
            location: { type: 'Point', coordinates: [75.8185, 26.9124] },
            delivery_radius_km: 50,
            status: 'active'
        });

        console.log("✅ Multi-category production seed successful!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedProductionData();
