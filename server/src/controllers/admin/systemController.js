const logger = require('../../utils/logger');
const { Partner } = require('../../models/Partner');
const { PropertyListing, ServiceListing, MandiListing } = require('../../models/Listing');
const { Category, SupplierCategory, Banner, AppConfig } = require('../../models/System');
const invalidate = require('../../utils/cacheInvalidator');
const pick = require('../../utils/pick');
const respondError = require('../../utils/respondError');

const sanitizeCategoryName = (name) => {
  if (!name) return name;
  return name.replace(/\s*supplier[s]?\s*/gi, '').trim();
};

const getSystemCategories = async (req, res) => {
  try {
    const { type, parent_id, include_inactive } = req.query;
    const query = include_inactive === 'true' ? {} : { is_active: true };
    if (type) query.type = type;
    if (parent_id !== undefined) query.parent_id = parent_id === 'null' ? null : parent_id;

    const categories = await Category.find(query).populate('parent_id').sort({ name: 1 });

    const processedCategories = await Promise.all(categories.map(async (cat) => {
      const catObj = cat.toObject();
      if (type === 'product' || cat.type === 'product' || type === 'supplier') {
        const mandiSellers = await MandiListing.distinct('partner_id', { category_id: cat._id, status: 'active' });
        catObj.mandi_count = mandiSellers.length;
        const bulkSuppliers = await Partner.countDocuments({ 'profile.supplier_profile.categories': cat._id, isActive: true });
        catObj.supplier_count = bulkSuppliers;
        catObj.count = catObj.mandi_count + catObj.supplier_count;
      } else {
        let ListingModel;
        if (cat.type === 'property') ListingModel = require('../../models/Listing').PropertyListing;
        else if (cat.type === 'service') ListingModel = require('../../models/Listing').ServiceListing;
        if (ListingModel) catObj.count = await ListingModel.countDocuments({ $or: [{ category_id: cat._id }, { subcategory_id: cat._id }], status: 'active' });
      }
      return catObj;
    }));

    res.status(200).json({ success: true, count: processedCategories.length, data: processedCategories });
  } catch (error) {
    logger.error({ err: error }, 'getSystemCategories ERROR:');
    res.status(500).json({ success: false, message: 'Error fetching categories.' });
  }
};

const createCategory = async (req, res) => {
  try {
    let { name, type, parent_id, icon, mandi_icon } = req.body;
    name = sanitizeCategoryName(name);
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Category name is required.' });
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const category = await Category.create({ name, slug, type, parent_id: parent_id || null, icon, mandi_icon });
    await invalidate.publicCategories();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    return respondError(res, error, 'Create category', 'Could not create category.');
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryUpdate = pick(req.body, ['name', 'slug', 'type', 'parent_id', 'icon', 'mandi_icon', 'is_active', 'description']);
    if (categoryUpdate.name) categoryUpdate.name = sanitizeCategoryName(categoryUpdate.name);
    const category = await Category.findByIdAndUpdate(req.params.id, { $set: categoryUpdate }, { new: true });
    await invalidate.publicCategories();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [propertyCount, serviceCount, supplierCount] = await Promise.all([
      PropertyListing.countDocuments({ $or: [{ category_id: id }, { subcategory_id: id }] }),
      ServiceListing.countDocuments({ $or: [{ category_id: id }, { subcategory_id: id }] }),
      MandiListing.countDocuments({ $or: [{ category_id: id }, { subcategory_id: id }] })
    ]);
    const totalListings = propertyCount + serviceCount + supplierCount;
    if (totalListings > 0) return res.status(400).json({ success: false, message: `Cannot delete category. It contains ${totalListings} active listings. Please delete or move those listings first.` });
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found.' });
    await invalidate.publicCategories();
    res.status(200).json({ success: true, message: 'Category permanently removed from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getCategoryDetail = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent_id');
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    const subcategories = await Category.find({ parent_id: req.params.id, is_active: true });
    const propertyCount = await PropertyListing.countDocuments({ category_id: req.params.id });
    res.status(200).json({ success: true, data: { ...category.toObject(), subcategories, stats: { properties: propertyCount } } });
  } catch (error) {
    return respondError(res, error, 'Get category detail', 'Could not fetch category details.');
  }
};

/* ── Supplier Categories ── */
const getSupplierCategories = async (req, res) => {
  try {
    const { parent_id, include_inactive } = req.query;
    const query = include_inactive === 'true' ? {} : { is_active: true };
    if (parent_id !== undefined) query.parent_id = parent_id === 'null' ? null : parent_id;

    const categories = await SupplierCategory.find(query).populate('parent_id').sort({ name: 1 });
    
    const processed = await Promise.all(categories.map(async (cat) => {
      const catObj = cat.toObject();
      catObj.supplier_count = await Partner.countDocuments({ 
        'profile.supplier_profile.material_categories': cat._id, 
        isActive: true 
      });
      catObj.count = catObj.supplier_count;
      return catObj;
    }));

    res.status(200).json({ success: true, count: processed.length, data: processed });
  } catch (error) {
    logger.error({ err: error }, 'getSupplierCategories ERROR:');
    res.status(500).json({ success: false, message: 'Error fetching supplier categories.' });
  }
};

const createSupplierCategory = async (req, res) => {
  try {
    let { name, parent_id, icon, description, is_active } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Category name is required.' });
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const category = await SupplierCategory.create({ name, slug, parent_id: parent_id || null, icon, description, is_active });
    await invalidate.publicCategories();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    return respondError(res, error, 'Create supplier category', 'Could not create supplier category.');
  }
};

const updateSupplierCategory = async (req, res) => {
  try {
    const categoryUpdate = pick(req.body, ['name', 'slug', 'parent_id', 'icon', 'is_active', 'description']);
    const category = await SupplierCategory.findByIdAndUpdate(req.params.id, { $set: categoryUpdate }, { new: true });
    await invalidate.publicCategories();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteSupplierCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const supplierCount = await Partner.countDocuments({ 'profile.supplier_profile.material_categories': id });
    if (supplierCount > 0) return res.status(400).json({ success: false, message: `Cannot delete category. It is assigned to ${supplierCount} suppliers.` });
    const deleted = await SupplierCategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found.' });
    await invalidate.publicCategories();
    res.status(200).json({ success: true, message: 'Supplier category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSupplierCategoryDetail = async (req, res) => {
  try {
    const category = await SupplierCategory.findById(req.params.id).populate('parent_id');
    if (!category) return res.status(404).json({ success: false, message: 'Supplier category not found.' });
    const subcategories = await SupplierCategory.find({ parent_id: req.params.id, is_active: true });
    res.status(200).json({ success: true, data: { ...category.toObject(), subcategories } });
  } catch (error) {
    return respondError(res, error, 'Get supplier category detail', 'Could not fetch supplier category details.');
  }
};

const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ priority: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(pick(req.body, ['title', 'image_url', 'link', 'is_active', 'priority', 'type', 'target_role']));
    await invalidate.publicBanners();
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    return respondError(res, error, 'Create banner', 'Could not create banner.');
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, { $set: pick(req.body, ['title', 'image_url', 'link', 'is_active', 'priority', 'type', 'target_role']) }, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    await invalidate.publicBanners();
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    await invalidate.publicBanners();
    res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMandiSettings = async (req, res) => {
  try {
    const tokenAmount = await AppConfig.findOne({ key: 'mandi_token_amount' });
    const commissionRate = await AppConfig.findOne({ key: 'mandi_commission_rate' });
    const categories = await Category.find({ type: 'supplier', parent_id: null }).select('name mandi_commission_percentage');
    res.status(200).json({ success: true, data: { token_amount: tokenAmount ? tokenAmount.value : 500, commission_rate: commissionRate ? commissionRate.value : 0, categories: categories.map(cat => ({ id: cat._id, name: cat.name, percentage: cat.mandi_commission_percentage || 0 })) } });
  } catch (error) {
    logger.error({ err: error }, "Get settings error:");
    res.status(500).json({ success: false, message: 'Error fetching Mandi settings.' });
  }
};

const updateMandiSettings = async (req, res) => {
  try {
    const { token_amount, commission_rate, category_commissions } = req.body;
    if (token_amount !== undefined) await AppConfig.findOneAndUpdate({ key: 'mandi_token_amount' }, { value: Number(token_amount), description: 'Non-refundable booking fee for Mandi items (Fallback)' }, { upsert: true, new: true });
    if (commission_rate !== undefined) await AppConfig.findOneAndUpdate({ key: 'mandi_commission_rate' }, { value: Number(commission_rate), description: 'Global default commission rate for Mandi Marketplace (%)' }, { upsert: true, new: true });
    if (category_commissions && Array.isArray(category_commissions)) {
      const bulkOps = category_commissions.map(cc => ({ updateOne: { filter: { _id: cc.id }, update: { $set: { mandi_commission_percentage: Number(cc.percentage) } } } }));
      if (bulkOps.length > 0) await Category.bulkWrite(bulkOps);
    }
    await invalidate.adminDashboard();
    res.status(200).json({ success: true, message: 'Mandi settings updated successfully.' });
  } catch (error) {
    logger.error({ err: error }, "Update settings error:");
    res.status(500).json({ success: false, message: 'Error updating Mandi settings.' });
  }
};

const getOfferConfig = async (req, res) => {
  try {
    const configs = await AppConfig.find({ key: { $in: ['OFFER_1_PLUS_1', 'FREE_TRIAL_CONFIG', 'PROMOTIONAL_BANNER', 'ROLE_UPGRADE_FEE'] } });
    const result = {};
    configs.forEach(c => result[c.key] = c.value);
    if (!result.OFFER_1_PLUS_1) result.OFFER_1_PLUS_1 = { is_active: false, expiry: null, min_amount: 100 };
    else if (result.OFFER_1_PLUS_1.min_amount === undefined) result.OFFER_1_PLUS_1.min_amount = 100;
    if (!result.FREE_TRIAL_CONFIG) result.FREE_TRIAL_CONFIG = { duration_days: 30, listings_limit: 1, featured_listings_limit: 0 };
    if (!result.PROMOTIONAL_BANNER) result.PROMOTIONAL_BANNER = { image_url: null, is_active: false };
    if (result.ROLE_UPGRADE_FEE === undefined) result.ROLE_UPGRADE_FEE = 200;
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateOfferConfig = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ success: false, message: 'Please provide key and value' });
    await AppConfig.findOneAndUpdate({ key }, { value, updated_by: req.user._id }, { upsert: true, new: true });
    await invalidate.publicOffers();
    await invalidate.adminDashboard();
    res.status(200).json({ success: true, message: `${key} updated successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getSystemCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryDetail,
  getSupplierCategories,
  createSupplierCategory,
  updateSupplierCategory,
  deleteSupplierCategory,
  getSupplierCategoryDetail,
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getMandiSettings,
  updateMandiSettings,
  getOfferConfig,
  updateOfferConfig
};
