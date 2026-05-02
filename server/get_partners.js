const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://ujjawal:ujjawal2002@cluster0.jmyqtq6.mongodb.net/baserabazar?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('baserabazar');
    const partners = await db.collection('partners').find({ is_featured: true }).toArray();
    console.log("Featured partners count:", partners.length);
    console.log(partners.map(p => ({ name: p.name, partner_type: p.partner_type, roles: p.roles })));
    
    // Also log all partners to see if any exist
    const allPartners = await db.collection('partners').find({}).toArray();
    console.log("Total partners:", allPartners.length);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
