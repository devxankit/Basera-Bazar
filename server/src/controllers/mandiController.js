const { MandiListing } = require('../models/Listing');
const { escapeRegex } = require('../utils/listingUtils');
const logger = require('../utils/logger');
const Order = require('../models/Order');
const { Partner } = require('../models/Partner');
const { Category } = require('../models/System');

/**
 * @desc    Get Mandi Seller Dashboard Stats
 * @route   GET /api/mandi/dashboard
 * @access  Private (Mandi Seller Only)
 */
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // 1. Get recent orders count
    const ordersCount = await Order.countDocuments({ 'items.seller_id': sellerId });
    
    // 2. Get active products count
    const productsCount = await MandiListing.countDocuments({ partner_id: sellerId, status: 'active' });

    // 3. Get total earnings (withdrawable balance)
    const partner = await Partner.findById(sellerId);
    const penalty_due = partner?.profile?.mandi_profile?.penalty_due || 0;

    res.status(200).json({
      success: true,
      data: {
        total_orders: ordersCount,
        active_products: productsCount,
        penalty_due: penalty_due
      }
    });

  } catch (error) {
    logger.error({ err: error }, "Mandi Dashboard Error:")
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats.' });
  }
};

/**
 * @desc    Update Price and Stock for a Mandi Product
 * @route   PATCH /api/mandi/products/:id
 * @access  Private (Mandi Seller Only)
 */
const updateProductInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, stock, availability, status } = req.body;
    const sellerId = req.user.id;

    const product = await MandiListing.findOne({ _id: id, partner_id: sellerId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (price !== undefined) {
      product.pricing.price_per_unit = price;
      product.pricing.effective_date = Date.now();
    }
    if (stock !== undefined) product.stock_quantity = stock;
    if (availability !== undefined) product.availability_status = availability;
    if (status !== undefined) product.status = status;

    await product.save();

    res.status(200).json({ success: true, message: 'Inventory updated successfully.', data: product });

  } catch (error) {
    logger.error({ err: error }, "Update Inventory Error:")
    res.status(500).json({ success: false, message: 'Error updating inventory.' });
  }
};

/**
 * @desc    Get Lowest Prices for Marketplace Home
 * @route   GET /api/mandi/marketplace/home
 * @access  Public
 */
const getMarketplaceHome = async (req, res) => {
  try {
    // 1. Fetch Categories (Unified under "product" type for Materials)
    const categories = await Category.find({ 
      type: { $in: ['product', 'supplier', 'material'] }, 
      is_active: true 
    });

    const { district, state } = req.query;
    const locationFilter = {};
    if (district) {
      locationFilter['address.district'] = { $regex: new RegExp(escapeRegex(district), 'i') };
    } else if (state) {
      locationFilter['address.state'] = { $regex: new RegExp(escapeRegex(state), 'i') };
    }

    // 2. Fetch "Best Deal" for each category to show on the main marketplace
    const featuredDeals = await Promise.all(categories.map(async (cat) => {
      // Match products by category OR sub-category
      const catMatch = { status: 'active', $or: [{ category_id: cat._id }, { subcategory_id: cat._id }] };

      let bestPrice = await MandiListing.findOne({ ...catMatch, ...locationFilter })
        .sort({ 'pricing.price_per_unit': 1 })
        .select('title pricing material_name thumbnail address');

      // Fallback: if there's no local deal but the category does have products
      // elsewhere, show the best national deal so the category isn't shown as
      // empty / "coming soon" when products actually exist.
      if (!bestPrice && Object.keys(locationFilter).length > 0) {
        bestPrice = await MandiListing.findOne(catMatch)
          .sort({ 'pricing.price_per_unit': 1 })
          .select('title pricing material_name thumbnail address');
      }

      return {
        category: cat.name,
        category_id: cat._id,
        slug: cat.slug, // Include slug for frontend image mapping
        icon: cat.icon,
        mandi_icon: cat.mandi_icon, // NEW: Specific image for Mandi
        deal: bestPrice
      };
    }));

    res.status(200).json({ 
      success: true, 
      data: featuredDeals
    });

  } catch (error) {
    logger.error({ err: error }, "Marketplace Home Error:")
    res.status(500).json({ success: false, message: 'Error fetching marketplace data.' });
  }
};

/**
 * @desc    Get Products within a Category sorted by price
 * @route   GET /api/mandi/marketplace/category/:id
 * @access  Public
 */
const getCategoryListings = async (req, res) => {
  try {
    const { id } = req.params;
    const { district, state } = req.query;
    // Match products whose category OR sub-category is the requested id, so items
    // listed under a sub-category still appear on the parent category page.
    const baseQuery = {
      status: 'active',
      $or: [{ category_id: id }, { subcategory_id: id }]
    };

    const locationFilter = {};
    if (district) {
      locationFilter['address.district'] = { $regex: new RegExp(escapeRegex(district), 'i') };
    } else if (state) {
      locationFilter['address.state'] = { $regex: new RegExp(escapeRegex(state), 'i') };
    }

    const fetch = (q) => MandiListing.find(q)
      .sort({ 'pricing.price_per_unit': 1 })
      .populate('partner_id', 'name profile');

    const [category, localListings] = await Promise.all([
      Category.findById(id),
      fetch({ ...baseQuery, ...locationFilter }),
    ]);

    // Location is a preference, not a hard wall: if nothing is listed in the
    // buyer's area, fall back to ALL products in the category so the page is
    // never mysteriously empty (bug: "click a category → no products shown").
    let listings = localListings;
    let nationwide = false;
    if (listings.length === 0 && (district || state)) {
      listings = await fetch(baseQuery);
      nationwide = listings.length > 0;
    }

    res.status(200).json({
      success: true,
      data: {
        category,
        listings,
        nationwide, // true => results are from all areas (no local sellers found)
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Category Listings Error:")
    res.status(500).json({ success: false, message: 'Error fetching category products.' });
  }
};

module.exports = {
  getSellerDashboard,
  updateProductInventory,
  getMarketplaceHome,
  getCategoryListings
};
