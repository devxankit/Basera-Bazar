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
    const categories = await Category.find({ type: { $in: ['product', 'supplier', 'material'] }, parent_id: null }).select('name mandi_commission_percentage');
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
    if (!result.OFFER_1_PLUS_1) result.OFFER_1_PLUS_1 = { is_active: false, expiry: null, min_amount: 1 };
    else if (result.OFFER_1_PLUS_1.min_amount === undefined) result.OFFER_1_PLUS_1.min_amount = 1;
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

/* ── Page Content (Help & Privacy) ── */
const VALID_CONTENT_KEYS = [
  'CONTENT_HELP_CUSTOMER',
  'CONTENT_HELP_PARTNER',
  'CONTENT_HELP_EXECUTIVE',
  'CONTENT_PRIVACY_CUSTOMER',
  'CONTENT_PRIVACY_PARTNER',
  'CONTENT_PRIVACY_EXECUTIVE',
];

const DEFAULT_CONTENT = {
  CONTENT_HELP_CUSTOMER: {
    contact_phone: '918969321391',
    contact_email: 'support@baserabazar.com',
    contact_whatsapp: '918969321391',
    response_time: 'under 2 hours',
    faqs: [
      { question: 'How do I enquire about a property or service?', answer: 'Open the listing you\'re interested in and tap the \'Enquire Now\' or \'Contact\' button. Fill in your details and your enquiry goes directly to the provider.' },
      { question: 'How do I track my enquiries?', answer: 'Go to Profile → My Enquiries to see all the enquiries you have sent, along with their status.' },
      { question: 'Can I place an order for mandi products?', answer: 'Yes! Add items to your cart from the Mandi Bazar section and checkout. You can track your orders from Profile → My Orders.' },
      { question: 'How do I update my profile details?', answer: 'Tap the edit icon on your Profile page to update your name, phone number, email, and location.' },
      { question: 'Is Basera Bazar available across India?', answer: 'We are currently focused on Bihar and expanding rapidly to other states. Stay tuned for updates.' },
      { question: 'How do I report a problem or fraudulent listing?', answer: 'Contact our support team via WhatsApp or email with the listing details and we\'ll investigate promptly.' },
    ],
  },
  CONTENT_HELP_PARTNER: {
    contact_phone: '918969321391',
    contact_email: 'support@baserabazar.com',
    contact_whatsapp: '918969321391',
    response_time: 'under 2 hours',
    faqs: [
      { category: 'listing', question: 'How do I add a new service or product?', answer: 'Navigate to your Home dashboard and click the \'Add Service\' floating button. Fill in the details, upload photos, and your listing will be live instantly.' },
      { category: 'account', question: 'How can I update my business name?', answer: 'Visit your Profile section and click the pencil icon next to your profile card. You can edit your name, email, phone, and business name there.' },
      { category: 'inquiry', question: 'Where are my customer inquiries located?', answer: 'All leads and messages from users are stored in the \'Inquiries\' tab on your Home dashboard. You will also receive real-time notifications for new leads.' },
      { category: 'payment', question: 'Are there any hidden charges?', answer: 'Currently, Basera Bazar is in a free pre-launch phase. All basic partner features are free to use. Premium plans will be announced as we scale.' },
      { category: 'account', question: 'How do I verify my partner account?', answer: 'Go to Profile > Settings > Account Verification. Upload your business license or ID proof. Our team will verify it within 24 working hours.' },
      { category: 'listing', question: 'Can I hide my listing temporarily?', answer: 'Yes, you can toggle the status of any listing to \'Inactive\' from your Inventory page to stop showing it to users without deleting it.' },
    ],
  },
  CONTENT_HELP_EXECUTIVE: {
    contact_phone: '918969321391',
    contact_email: 'support@baserabazar.com',
    contact_whatsapp: '918969321391',
    response_time: 'under 2 hours',
    faqs: [
      { category: 'partners', question: 'How do I onboard a new partner?', answer: 'Navigate to the Partners section from your dashboard. Tap the \'Add Partner\' button, fill in the partner\'s business details, and submit for verification. You\'ll receive commission once they are approved.' },
      { category: 'account', question: 'How do I update my profile details?', answer: 'Go to your Profile page and tap the edit icon. You can update your name, phone number, email, and bank details for payouts.' },
      { category: 'attendance', question: 'How does the attendance system work?', answer: 'Attendance is tracked via GPS check-in from your dashboard. Make sure your location services are enabled. Check in at the start of your work and check out when done.' },
      { category: 'earnings', question: 'When do I receive my earnings?', answer: 'Earnings from partner onboarding commissions are credited to your wallet. You can request a payout from the Wallet section. Payouts are processed within 3-5 business days.' },
      { category: 'account', question: 'What happens during verification?', answer: 'After signing up, your Aadhaar and other documents are verified by the admin team. You\'ll be notified once your account is approved. Verification typically takes 24-48 hours.' },
      { category: 'partners', question: 'Can I see the status of partners I onboarded?', answer: 'Yes! Go to the Partners section in your dashboard to see all partners you\'ve onboarded, their verification status, and your earned commissions.' },
    ],
  },
  CONTENT_PRIVACY_CUSTOMER: {
    last_updated: 'January 2025',
    intro: 'Basera Bazar values your privacy. This policy explains what data we collect and how we use it to provide you the best experience.',
    sections: [
      { title: '1. Information We Collect', content: 'We collect your name, phone number, email address, and location when you register or use our services. We also collect usage data to improve the platform.' },
      { title: '2. How We Use Your Data', content: 'Your data is used to provide and improve our services, send relevant notifications, and connect you with the right businesses in your area.' },
      { title: '3. Data Sharing', content: 'We do not sell your personal data. Your contact details are shared with partners only when you make an enquiry or place an order.' },
      { title: '4. Your Rights', content: 'You can request access to, correction of, or deletion of your personal data by contacting us at support@baserabazar.com.' },
    ],
  },
  CONTENT_PRIVACY_PARTNER: {
    last_updated: 'January 2025',
    intro: 'Basera Bazar values your privacy. This policy explains what data we collect from partners and how we use it.',
    sections: [
      { title: '1. Information We Collect', content: 'We collect your name, phone number, email address, business details, location, and uploaded documents (ID proof, business license) when you register as a partner. We also collect usage data and listing analytics.' },
      { title: '2. How We Use Your Data', content: 'Your data is used to verify your identity, manage your listings, process inquiries and orders, provide analytics, and improve the platform experience for you and your customers.' },
      { title: '3. Data Sharing', content: 'We do not sell your personal or business data. Your business information and contact details are shown to users only on your public listings and when they make an enquiry or order.' },
      { title: '4. Your Rights', content: 'You can request access to, correction of, or deletion of your personal data by contacting us at support@baserabazar.com. You can also deactivate your account from your profile settings.' },
    ],
  },
  CONTENT_PRIVACY_EXECUTIVE: {
    last_updated: 'January 2025',
    intro: 'Basera Bazar values your privacy. This policy explains what data we collect from field executives and how we use it.',
    sections: [
      { title: '1. Information We Collect', content: 'We collect your name, phone number, email address, Aadhaar details, bank account information, GPS location data (for attendance), and uploaded verification documents when you register as a field executive.' },
      { title: '2. How We Use Your Data', content: 'Your data is used to verify your identity, track attendance and performance, process salary and commission payouts, manage partner onboarding records, and improve the platform.' },
      { title: '3. Data Sharing', content: 'We do not sell your personal data. Your identity documents are stored securely and accessible only to authorized admin personnel. Your basic details may be visible to partners you onboard.' },
      { title: '4. Your Rights', content: 'You can request access to, correction of, or deletion of your personal data by contacting us at support@baserabazar.com. You can also request account deactivation through your team leader.' },
    ],
  },
};

const getPageContent = async (req, res) => {
  try {
    const { key } = req.query;
    if (!key || !VALID_CONTENT_KEYS.includes(key)) {
      return res.status(400).json({ success: false, message: 'Invalid content key.' });
    }
    const config = await AppConfig.findOne({ key });
    const data = config ? config.value : (DEFAULT_CONTENT[key] || {});
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error({ err: error }, 'getPageContent ERROR:');
    res.status(500).json({ success: false, message: 'Error fetching page content.' });
  }
};

const updatePageContent = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !VALID_CONTENT_KEYS.includes(key)) {
      return res.status(400).json({ success: false, message: 'Invalid content key.' });
    }
    if (!value || typeof value !== 'object') {
      return res.status(400).json({ success: false, message: 'Please provide valid content value.' });
    }
    await AppConfig.findOneAndUpdate(
      { key },
      { value, description: `Page content for ${key}`, updated_by: req.user._id },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, message: `${key} updated successfully.` });
  } catch (error) {
    logger.error({ err: error }, 'updatePageContent ERROR:');
    res.status(500).json({ success: false, message: 'Error updating page content.' });
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
  updateOfferConfig,
  getPageContent,
  updatePageContent
};
