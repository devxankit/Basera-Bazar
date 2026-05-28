const { z } = require('zod');

// ---------------------------------------------------------
// PARTNER SCHEMAS
// ---------------------------------------------------------

const partnerRegistrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name should only contain letters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  businessName: z.string().min(2, "Business name is required"),
  address: z.string().min(5, "Complete address is required"),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  category: z.array(z.string()).optional(),
  service_radius_km: z.number().positive("Service radius must be a positive number"),
  aadhar: z.string().regex(/^\d{12}$/, "Aadhar must be exactly 12 digits").optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").optional()
});

// ---------------------------------------------------------
// EXECUTIVE SCHEMAS
// ---------------------------------------------------------

// Used for PUT /executive/register/step2 (nested structure from signup flow)
const executiveRegisterStep2Schema = z.object({
  address: z.object({
    address_line: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.union([z.literal(''), z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits")]).optional(),
  }).optional(),
  bank_details: z.object({
    account_number: z.string().min(9, "Account number too short").max(18, "Account number too long"),
    ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
    bank_name: z.string().min(2, "Bank name is required"),
    account_holder_name: z.string().min(2, "Account holder name is required"),
  }),
});

// Used for PUT /executive/bank-details (flat structure from profile update)
const executiveBankDetailsSchema = z.object({
  account_number: z.string().min(9, "Account number too short").max(18, "Account number too long"),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  bank_name: z.string().min(2, "Bank name is required"),
  account_holder_name: z.string().min(2, "Account holder name is required"),
});

const executiveProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional()
});

const withdrawalRequestSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .int('Amount must be a whole number')
    .positive('Amount must be greater than zero')
    .min(100, 'Minimum withdrawal amount is ₹100')
    .max(100000, 'Maximum single withdrawal is ₹1,00,000')
});

// ---------------------------------------------------------
// COMMON SCHEMAS
// ---------------------------------------------------------

const loginSchema = z.object({
  identifier: z.string()
    .min(1, "Email or phone is required")
    .max(254, "Identifier too long")
    .refine(
      (val) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
        /^[6-9]\d{9}$/.test(val),
      { message: "Please enter a valid email address or 10-digit Indian mobile number" }
    ),
  password: z.string().min(1, "Password is required"),
  role: z.string().optional()
});

const otpVerifySchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  otp: z.string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
  role: z.enum(['user', 'partner']).optional(),
  flow: z.enum(['login', 'signup', 'verify_only', 'signup_verify']).optional()
}).passthrough();

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format")
});

// ---------------------------------------------------------
// STAFF MANAGEMENT SCHEMAS
// ---------------------------------------------------------

const indianPhone = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const teamLeaderSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: indianPhone,
  email: z.string().email('Invalid email address').toLowerCase(),
  state: z.string().min(2, 'State is required').max(100),
  district: z.string().max(100).optional(),
  zone: z.string().max(100).optional(),
  fixed_salary: z.number({ invalid_type_error: 'Salary must be a number' })
    .int('Salary must be a whole number')
    .min(25000, 'Minimum salary is ₹25,000')
    .max(50000, 'Maximum salary is ₹50,000'),
  commission_rate: z.number().min(0).max(20),
  password: strongPassword,
  profile_image: z.string().optional(),
  address: z.object({
    address_line: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.union([z.literal(''), z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits')]).optional(),
  }).optional(),
});

const teamLeaderUpdateSchema = teamLeaderSchema.partial().omit({ password: true });

const officeStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: indianPhone,
  email: z.string().email('Invalid email address').toLowerCase(),
  team_leader_id: mongoId,
  fixed_salary: z.number({ invalid_type_error: 'Salary must be a number' })
    .int('Salary must be a whole number')
    .min(8000, 'Minimum salary is ₹8,000')
    .max(15000, 'Maximum salary is ₹15,000'),
  calling_specialization: z.enum(['lead_generation', 'follow_up', 'customer_support', 'data_update']),
  password: strongPassword,
  profile_image: z.string().optional(),
  address: z.object({
    address_line: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.union([z.literal(''), z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits')]).optional(),
  }).optional(),
});

const officeStaffUpdateSchema = officeStaffSchema.partial().omit({ password: true });

const staffLoginSchema = z.object({
  identifier: z.string()
    .min(5, 'Email or phone is required')
    .refine(
      (val) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
        /^[6-9]\d{9}$/.test(val),
      { message: 'Please enter a valid email address or 10-digit mobile number' }
    ),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['team_leader', 'office_staff', 'executive'], {
    errorMap: () => ({ message: 'Role must be team_leader, office_staff, or executive' }),
  }),
});

const gpsCheckinSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  selfie_url: z.string().url('Invalid selfie URL'),
  accuracy: z.number().optional(),
});

const officeCheckinSchema = z.object({
  check_in_time: z.string().datetime().optional(),
});

const leaveRequestSchema = z.object({
  leave_type: z.enum(['sick', 'casual', 'earned']),
  start_date: dateStr,
  end_date: dateStr,
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
}).refine((d) => d.start_date <= d.end_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

const targetBaseSchema = z.object({
  target_type: z.enum(['partner_onboarding', 'calling', 'lead_generation', 'sales', 'subscription', 'custom']),
  target_period: z.enum(['daily', 'weekly', 'monthly']),
  target_value: z.number().int().min(1, 'Target value must be at least 1'),
  start_date: dateStr,
  end_date: dateStr,
  description: z.string().max(500).optional(),
  incentive_type: z.enum(['percentage', 'fixed']),
  incentive_rate: z.number().min(0, 'Incentive rate cannot be negative'),
  assign_to_type: z.enum(['all', 'team_leader', 'field_executive', 'office_staff']),
  assign_to_ids: z.array(mongoId).optional(),
});

const targetAssignSchema = targetBaseSchema.refine((d) => d.start_date <= d.end_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

const leaveApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

const salaryFinalizeSchema = z.object({
  base_salary: z.number().min(0, 'Base salary cannot be negative'),
  incentive_amount: z.number().min(0).optional(),
  team_commission_amount: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

const geoFenceSchema = z.object({
  team_leader_id: mongoId,
  name: z.string().min(2).max(100),
  center_lat: z.number().min(-90).max(90),
  center_lng: z.number().min(-180).max(180),
  radius_meters: z.number().min(50, 'Minimum radius is 50 meters').max(5000, 'Maximum radius is 5000 meters'),
});

const dailyReportSchema = z.object({
  // Field executive fields
  partners_visited: z.number().int().min(0).optional(),
  partners_registered: z.number().int().min(0).optional(),
  subscriptions_sold: z.number().int().min(0).optional(),
  leads_uploaded: z.number().int().min(0).optional(),
  // Office staff fields
  calls_made: z.number().int().min(0).optional(),
  follow_ups_done: z.number().int().min(0).optional(),
  leads_generated: z.number().int().min(0).optional(),
  data_entries_updated: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
  report_attachments: z.array(z.string().url()).optional(),
});

const staffPasswordResetSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: strongPassword,
});

// ---------------------------------------------------------
// PARTNER MULTI-ROLE SCHEMAS
// ---------------------------------------------------------

const PARTNER_ROLES = ['service_provider', 'property_agent', 'supplier', 'mandi_seller'];

const partnerAddRoleSchema = z.object({
  new_role: z.enum(PARTNER_ROLES, {
    errorMap: () => ({ message: `new_role must be one of: ${PARTNER_ROLES.join(', ')}` }),
  }),
  use_role_credit: z.boolean().optional(),
  profile_data: z.record(z.unknown()).optional(),
  gst_number: z.string().max(15).optional(),
  gst_image: z.string().url().optional(),
  rera_number: z.string().max(20).optional(),
  rera_certificate_image: z.string().url().optional(),
});

const partnerDeleteRoleSchema = z.object({
  role: z.enum(PARTNER_ROLES, {
    errorMap: () => ({ message: `role must be one of: ${PARTNER_ROLES.join(', ')}` }),
  }),
});

const partnerSwitchRoleSchema = z.object({
  role: z.enum(PARTNER_ROLES, {
    errorMap: () => ({ message: `role must be one of: ${PARTNER_ROLES.join(', ')}` }),
  }),
});

// ---------------------------------------------------------
// LEAD SCHEMAS
// ---------------------------------------------------------

const leadCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  state: z.string().optional(),
  district: z.string().min(1, 'District is required to broadcast your requirement'),
  full_address: z.string().optional(),
  target_category: z.enum(['service', 'supplier'], {
    errorMap: () => ({ message: 'target_category must be "service" or "supplier"' }),
  }),
  products: z.array(z.object({
    item_name: z.string().min(1, 'Item name is required'),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })).min(1, 'At least one product/service item is required'),
  requirement_details: z.string().optional(),
  document_url: z.string().url().optional().or(z.literal('')),
});

// ---------------------------------------------------------
// ADMIN MARKETPLACE SCHEMAS
// ---------------------------------------------------------

const commissionUpdateSchema = z.object({
  rate: z.number({ invalid_type_error: 'rate must be a number' })
    .min(0, 'Commission rate cannot be negative')
    .max(100, 'Commission rate cannot exceed 100%'),
});

// ---------------------------------------------------------
// ORDER SCHEMAS
// ---------------------------------------------------------

const addressSchema = z.object({
  full_name: z.string().min(2, 'Recipient name is required'),
  phone: indianPhone,
  full_address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

const orderCheckoutSchema = z.object({
  items: z.array(z.object({
    productId: mongoId,
    qty: z.number({ invalid_type_error: 'Quantity must be a number' }).int().positive('Quantity must be at least 1'),
  })).min(1, 'Order must contain at least one item'),
  shipping_address: addressSchema,
  billing_address: addressSchema.optional(),
});

const orderPaymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'accepted', 'rejected'], {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
  note: z.string().max(500).optional(),
  tracking_id: z.string().max(100).optional(),
  delivery_otp: z.string().max(10).optional(),
});

const orderReviewSchema = z.object({
  order_id: mongoId,
  partner_id: mongoId,
  behavior_rating: z.number({ invalid_type_error: 'Rating must be a number' }).int().min(1).max(5),
  item_ratings: z.array(z.object({
    item_id: z.string(),
    rating: z.number().int().min(1).max(5),
  })).optional(),
  comment: z.string().max(1000).optional(),
});

// ---------------------------------------------------------
// FINANCE SCHEMAS
// ---------------------------------------------------------

const financeInitiateSchema = z.object({
  plan_id: mongoId,
  referral_code: z.string().max(20).optional(),
});

const financeVerifySchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  plan_id: mongoId,
});

// ---------------------------------------------------------
// MILESTONE SCHEMAS
// ---------------------------------------------------------

const milestoneClaimSchema = z.object({
  milestoneId: mongoId,
  shipping_address: z.object({
    full_name: z.string().min(2),
    phone: indianPhone,
    address_line: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }).optional(),
});

const milestoneRewardStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'dispatched', 'delivered'], {
    errorMap: () => ({ message: 'Invalid reward status' }),
  }),
  tracking_id: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

const milestoneConfigSchema = z.object({
  id: mongoId.optional(),
  target_orders: z.number({ invalid_type_error: 'target_orders must be a number' }).int().positive('Target orders must be a positive integer'),
  prize_name: z.string().min(2, 'Prize name is required').max(100),
  prize_description: z.string().max(500).optional(),
  banner_url: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  valid_until: z.string().optional(),
  is_active: z.boolean().optional(),
});

// ---------------------------------------------------------
// ENQUIRY SCHEMA
// ---------------------------------------------------------

const enquirySchema = z.object({
  listing_id: mongoId.optional(),
  enquiry_type: z.enum(['service', 'property', 'supplier', 'general']).optional(),
  inquiry_type: z.string().optional(),
  content: z.string().min(5, 'Message must be at least 5 characters').max(2000, 'Message too long'),
}).passthrough();

// ---------------------------------------------------------
// PUSH TOKEN SCHEMA
// ---------------------------------------------------------

const pushTokenSchema = z.object({
  token: z.string().min(1, 'FCM token is required'),
  platform: z.enum(['web', 'mobile']).optional(),
});

// ---------------------------------------------------------
// MANDI INVENTORY SCHEMA
// ---------------------------------------------------------

const mandiInventorySchema = z.object({
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  availability: z.enum(['in_stock', 'out_of_stock', 'limited']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// ---------------------------------------------------------
// LISTING CATEGORY SCHEMA
// ---------------------------------------------------------

const listingCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

// ---------------------------------------------------------
// TARGET / ATTENDANCE / REPORT SCHEMAS
// ---------------------------------------------------------

const targetUpdateSchema = targetBaseSchema.partial();

const attendanceVerifySchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'action must be approve or reject' }),
  }),
  note: z.string().max(500).optional(),
});

const reportVerifySchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'action must be approve or reject' }),
  }),
  note: z.string().max(500).optional(),
});

module.exports = {
  leadCreateSchema,
  partnerRegistrationSchema,
  partnerAddRoleSchema,
  partnerDeleteRoleSchema,
  partnerSwitchRoleSchema,
  executiveBankDetailsSchema,
  executiveRegisterStep2Schema,
  executiveProfileUpdateSchema,
  withdrawalRequestSchema,
  loginSchema,
  otpVerifySchema,
  idParamSchema,
  commissionUpdateSchema,
  // Staff management schemas
  teamLeaderSchema,
  teamLeaderUpdateSchema,
  officeStaffSchema,
  officeStaffUpdateSchema,
  staffLoginSchema,
  gpsCheckinSchema,
  officeCheckinSchema,
  leaveRequestSchema,
  targetAssignSchema,
  targetUpdateSchema,
  leaveApprovalSchema,
  salaryFinalizeSchema,
  geoFenceSchema,
  dailyReportSchema,
  staffPasswordResetSchema,
  attendanceVerifySchema,
  reportVerifySchema,
  // Order schemas
  orderCheckoutSchema,
  orderPaymentVerifySchema,
  orderStatusSchema,
  orderReviewSchema,
  // Finance schemas
  financeInitiateSchema,
  financeVerifySchema,
  // Milestone schemas
  milestoneClaimSchema,
  milestoneRewardStatusSchema,
  milestoneConfigSchema,
  // Other route schemas
  enquirySchema,
  pushTokenSchema,
  mandiInventorySchema,
  listingCategorySchema,
};
