const { z } = require('zod');

// ---------------------------------------------------------
// PARTNER SCHEMAS
// ---------------------------------------------------------

const partnerRegistrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name should only contain letters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/\d/, "Password must contain at least one number"),
  businessName: z.string().min(2, "Business name is required"),
  address: z.string().min(5, "Complete address is required"),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  category: z.array(z.string()).optional(), // Only required for suppliers
  service_radius_km: z.number().positive("Service radius must be a positive number"),
  aadhar: z.string().regex(/^\d{12}$/, "Aadhar must be exactly 12 digits").optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").optional()
});

// ---------------------------------------------------------
// EXECUTIVE SCHEMAS
// ---------------------------------------------------------

const executiveBankDetailsSchema = z.object({
  account_number: z.string().min(9, "Account number too short").max(18, "Account number too long"),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  bank_name: z.string().min(2, "Bank name is required"),
  account_holder_name: z.string().min(2, "Account holder name is required")
});

const executiveProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional()
});

// ---------------------------------------------------------
// COMMON SCHEMAS
// ---------------------------------------------------------

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
  role: z.string().optional()
});

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format")
});

module.exports = {
  partnerRegistrationSchema,
  executiveBankDetailsSchema,
  executiveProfileUpdateSchema,
  loginSchema,
  idParamSchema
};
