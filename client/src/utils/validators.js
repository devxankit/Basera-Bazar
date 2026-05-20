// Strict input validation schemas — imported by every form in the app.
// Each validator returns null on success or an error string on failure.

// ─── Regexes ────────────────────────────────────────────────────────────────
export const REGEX = {
  NAME:          /^[A-Za-z\s'\-]{2,60}$/,
  BUSINESS_NAME: /^[A-Za-z0-9\s&.,\-()']{2,100}$/,
  PHONE:         /^[6-9]\d{9}$/,
  EMAIL:         /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  // min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char
  PASSWORD:      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
  OTP:           /^\d{6}$/,
  PINCODE:       /^\d{6}$/,
  PAN:           /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  AADHAR:        /^\d{12}$/,
  GST:           /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/,
  TITLE:         /^[A-Za-z0-9\s\-,.'&()]{3,150}$/,
  PRICE:         /^\d{1,9}(\.\d{1,2})?$/,
  AREA:          /^\d{1,7}(\.\d{1,2})?$/,
  QUANTITY:      /^\d{1,5}$/,
  POSITIVE_INT:  /^\d+$/,
  URL:           /^https:\/\/.+/,
  // letters, digits, spaces, / # , - . ' allowed
  ADDRESS:       /^[A-Za-z0-9\s/#,\-.']{5,200}$/,
  CTA_TEXT:      /^[A-Za-z0-9\s\-.,!]{1,50}$/,
};

// ─── Field validators ────────────────────────────────────────────────────────

export const v = {
  name(val) {
    if (!val?.trim()) return 'Name is required.';
    if (!REGEX.NAME.test(val.trim())) return 'Name may only contain letters, spaces, apostrophes, or hyphens (2–60 chars).';
    return null;
  },

  businessName(val) {
    if (!val?.trim()) return 'Business name is required.';
    if (!REGEX.BUSINESS_NAME.test(val.trim())) return 'Business name may only contain letters, digits, spaces, and & . , - ( ) (2–100 chars).';
    return null;
  },

  phone(val) {
    const d = (val || '').replace(/\D/g, '');
    if (!d) return 'Phone number is required.';
    if (!REGEX.PHONE.test(d)) return 'Enter a valid 10-digit Indian mobile number starting with 6–9.';
    return null;
  },

  email(val) {
    if (!val?.trim()) return 'Email address is required.';
    if (!REGEX.EMAIL.test(val.trim())) return 'Enter a valid email address.';
    return null;
  },

  emailOptional(val) {
    if (!val?.trim()) return null;
    if (!REGEX.EMAIL.test(val.trim())) return 'Enter a valid email address.';
    return null;
  },

  password(val) {
    if (!val) return 'Password is required.';
    if (!REGEX.PASSWORD.test(val)) return 'Password must be at least 8 characters with uppercase, lowercase, digit, and special character (@$!%*?&#).';
    return null;
  },

  passwordSimple(val) {
    if (!val) return 'Password is required.';
    return null;
  },

  passwordConfirm(val, original) {
    if (!val) return 'Please confirm your password.';
    if (val !== original) return 'Passwords do not match.';
    return null;
  },

  otp(val) {
    if (!val?.trim()) return 'OTP is required.';
    if (!REGEX.OTP.test(val.trim())) return 'OTP must be exactly 6 digits.';
    return null;
  },

  pincode(val) {
    if (!val?.trim()) return 'PIN code is required.';
    if (!REGEX.PINCODE.test(val.trim())) return 'PIN code must be exactly 6 digits.';
    return null;
  },

  pan(val) {
    const upper = (val || '').trim().toUpperCase();
    if (!upper) return 'PAN number is required.';
    if (!REGEX.PAN.test(upper)) return 'Enter a valid PAN number (e.g. ABCDE1234F).';
    return null;
  },

  aadhar(val) {
    const d = (val || '').replace(/\s/g, '');
    if (!d) return 'Aadhar number is required.';
    if (!REGEX.AADHAR.test(d)) return 'Aadhar number must be exactly 12 digits.';
    return null;
  },

  gst(val) {
    const upper = (val || '').trim().toUpperCase();
    if (!upper) return 'GST number is required.';
    if (!REGEX.GST.test(upper)) return 'Enter a valid 15-character GST number.';
    return null;
  },

  gstOptional(val) {
    if (!val?.trim()) return null;
    const upper = val.trim().toUpperCase();
    if (!REGEX.GST.test(upper)) return 'Enter a valid 15-character GST number.';
    return null;
  },

  title(val) {
    if (!val?.trim()) return 'Title is required.';
    if (!REGEX.TITLE.test(val.trim())) return 'Title may only contain letters, digits, and basic punctuation (3–150 chars).';
    return null;
  },

  description(val, { required = true } = {}) {
    if (!val?.trim()) return required ? 'Description is required.' : null;
    if (val.trim().length < 10) return 'Description must be at least 10 characters.';
    if (val.trim().length > 2000) return 'Description must be at most 2000 characters.';
    return null;
  },

  shortDescription(val, { required = true } = {}) {
    if (!val?.trim()) return required ? 'Description is required.' : null;
    if (val.trim().length < 10) return 'Description must be at least 10 characters.';
    if (val.trim().length > 500) return 'Description must be at most 500 characters.';
    return null;
  },

  price(val) {
    if (val === '' || val === undefined || val === null) return 'Price is required.';
    const str = String(val);
    if (!REGEX.PRICE.test(str)) return 'Enter a valid positive price (up to 2 decimal places).';
    if (parseFloat(str) <= 0) return 'Price must be greater than 0.';
    return null;
  },

  priceOptional(val) {
    if (val === '' || val === undefined || val === null) return null;
    const str = String(val);
    if (!REGEX.PRICE.test(str)) return 'Enter a valid positive price (up to 2 decimal places).';
    return null;
  },

  area(val) {
    if (val === '' || val === undefined || val === null) return 'Area is required.';
    const str = String(val);
    if (!REGEX.AREA.test(str)) return 'Enter a valid area value.';
    if (parseFloat(str) <= 0) return 'Area must be greater than 0.';
    return null;
  },

  areaOptional(val) {
    if (val === '' || val === undefined || val === null) return null;
    const str = String(val);
    if (str && !REGEX.AREA.test(str)) return 'Enter a valid area value.';
    return null;
  },

  quantity(val) {
    if (val === '' || val === undefined || val === null) return 'Quantity is required.';
    const str = String(val);
    if (!REGEX.QUANTITY.test(str)) return 'Enter a valid whole number (max 99999).';
    if (parseInt(str, 10) <= 0) return 'Quantity must be greater than 0.';
    return null;
  },

  positiveInt(val, { label = 'Value', max } = {}) {
    if (val === '' || val === undefined || val === null) return `${label} is required.`;
    const n = parseInt(String(val), 10);
    if (!REGEX.POSITIVE_INT.test(String(val)) || isNaN(n)) return `${label} must be a whole number.`;
    if (n <= 0) return `${label} must be greater than 0.`;
    if (max !== undefined && n > max) return `${label} must be at most ${max}.`;
    return null;
  },

  radius(val) {
    if (val === '' || val === undefined || val === null) return 'Radius is required.';
    const n = parseInt(String(val), 10);
    if (isNaN(n) || n <= 0) return 'Radius must be a positive number.';
    if (n > 200) return 'Radius cannot exceed 200 km.';
    return null;
  },

  url(val) {
    if (!val?.trim()) return 'URL is required.';
    if (!REGEX.URL.test(val.trim())) return 'URL must start with https://.';
    return null;
  },

  urlOptional(val) {
    if (!val?.trim()) return null;
    if (!REGEX.URL.test(val.trim())) return 'URL must start with https://.';
    return null;
  },

  address(val) {
    if (!val?.trim()) return 'Address is required.';
    if (val.trim().length < 5) return 'Address must be at least 5 characters.';
    if (val.trim().length > 200) return 'Address must be at most 200 characters.';
    return null;
  },

  latitude(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return 'Latitude is required.';
    if (n < -90 || n > 90) return 'Latitude must be between -90 and 90.';
    return null;
  },

  longitude(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return 'Longitude is required.';
    if (n < -180 || n > 180) return 'Longitude must be between -180 and 180.';
    return null;
  },

  ctaText(val) {
    if (!val?.trim()) return 'Button text is required.';
    if (!REGEX.CTA_TEXT.test(val.trim())) return 'Button text may only contain letters, digits, spaces, and basic punctuation (1–50 chars).';
    return null;
  },

  date(val, { required = true, notPast = false, label = 'Date' } = {}) {
    if (!val) return required ? `${label} is required.` : null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return `${label} is not a valid date.`;
    if (notPast && d < new Date(new Date().setHours(0, 0, 0, 0))) return `${label} cannot be in the past.`;
    return null;
  },

  required(val, label = 'This field') {
    if (!val && val !== 0) return `${label} is required.`;
    if (typeof val === 'string' && !val.trim()) return `${label} is required.`;
    return null;
  },

  // Run an array of validators and return the first error
  first(...fns) {
    for (const fn of fns) {
      const err = fn();
      if (err) return err;
    }
    return null;
  },
};

// ─── Sanitisers ─────────────────────────────────────────────────────────────

export const sanitize = {
  phone:  (val) => (val || '').replace(/\D/g, '').slice(0, 10),
  otp:    (val) => (val || '').replace(/\D/g, '').slice(0, 6),
  pincode:(val) => (val || '').replace(/\D/g, '').slice(0, 6),
  aadhar: (val) => (val || '').replace(/\D/g, '').slice(0, 12),
  pan:    (val) => (val || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10),
  digits: (val) => (val || '').replace(/\D/g, ''),
  upper:  (val) => (val || '').toUpperCase(),
};
