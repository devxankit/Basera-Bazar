const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'server/.env' });

const { User } = require('../models/User');
const { Partner } = require('../models/Partner');
const { AdminUser } = require('../models/Admin');

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const password = await bcrypt.hash('password123', 10);

    const usersToCreate = [
      // 3 x Customers
      { name: 'Ujjawal Customer', phone: '9000000001', email: 'ujjawal@cust.com', role: 'Customer', password },
      { name: 'Ankit Customer', phone: '9000000002', email: 'ankit@cust.com', role: 'Customer', password },
      { name: 'Rahul Customer', phone: '9000000003', email: 'rahul@cust.com', role: 'Customer', password },
    ];

    const partnersToCreate = [
      // 3 x Agents
      { name: 'Agent X', phone: '9100000001', email: 'agent1@pro.com', role: 'Agent', partner_type: 'property_agent', password, onboarding_status: 'approved' },
      { name: 'Agent Y', phone: '9100000002', email: 'agent2@pro.com', role: 'Agent', partner_type: 'property_agent', password, onboarding_status: 'approved' },
      { name: 'Agent Z', phone: '9100000003', email: 'agent3@pro.com', role: 'Agent', partner_type: 'property_agent', password, onboarding_status: 'approved' },
      // 3 x Suppliers
      { name: 'Supplier A', phone: '9200000001', email: 'sup1@mat.com', role: 'Supplier', partner_type: 'supplier', password, onboarding_status: 'approved' },
      { name: 'Supplier B', phone: '9200000002', email: 'sup2@mat.com', role: 'Supplier', partner_type: 'supplier', password, onboarding_status: 'approved' },
      { name: 'Supplier C', phone: '9200000003', email: 'sup3@mat.com', role: 'Supplier', partner_type: 'supplier', password, onboarding_status: 'approved' },
      // 3 x Service Providers
      { name: 'Pro Service 1', phone: '9300000001', email: 'ser1@fix.com', role: 'Service Provider', partner_type: 'service_provider', password, onboarding_status: 'approved' },
      { name: 'Pro Service 2', phone: '9300000002', email: 'ser2@fix.com', role: 'Service Provider', partner_type: 'service_provider', password, onboarding_status: 'approved' },
      { name: 'Pro Service 3', phone: '9300000003', email: 'ser3@fix.com', role: 'Service Provider', partner_type: 'service_provider', password, onboarding_status: 'approved' },
      // 3 x Mandi Sellers (Bulk Suppliers)
      { name: 'Mandi Bulk Alpha', phone: '9500000001', email: 'mandi1@bulk.com', role: 'Supplier', partner_type: 'mandi_seller', password, onboarding_status: 'approved' },
      { name: 'Mandi Bulk Beta', phone: '9500000002', email: 'mandi2@bulk.com', role: 'Supplier', partner_type: 'mandi_seller', password, onboarding_status: 'approved' },
      { name: 'Mandi Bulk Gamma', phone: '9500000003', email: 'mandi3@bulk.com', role: 'Supplier', partner_type: 'mandi_seller', password, onboarding_status: 'approved' },
    ];

    const adminsToCreate = [
      // 3 x Admins
      { name: 'Admin One', phone: '9400000001', email: 'admin1@basera.com', role: 'Admin', password },
      { name: 'Admin Two', phone: '9400000002', email: 'admin2@basera.com', role: 'Admin', password },
      { name: 'Admin Three', phone: '9400000003', email: 'admin3@basera.com', role: 'Admin', password },
    ];

    console.log('Seeding Customers...');
    for (const u of usersToCreate) {
      await User.findOneAndUpdate({ phone: u.phone }, u, { upsert: true, new: true });
    }

    console.log('Seeding Partners...');
    for (const p of partnersToCreate) {
      await Partner.findOneAndUpdate({ phone: p.phone }, p, { upsert: true, new: true });
    }

    console.log('Seeding Admins...');
    for (const a of adminsToCreate) {
      await AdminUser.findOneAndUpdate({ email: a.email }, a, { upsert: true, new: true });
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
