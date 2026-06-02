const VALID_ROLES = ['service_provider', 'property_agent', 'supplier', 'mandi_seller'];

const PROFILE_KEY_BY_ROLE = {
  supplier: 'supplier_profile',
  mandi_seller: 'mandi_profile',
  property_agent: 'property_profile',
  service_provider: 'service_profile',
};

/**
 * Validate that a partner is eligible to request the given role.
 * @returns {{ ok: true } | { ok: false, status: number, message: string }}
 */
function validateRoleUpgradeEligibility(partner, role) {
  if (!role || !VALID_ROLES.includes(role)) {
    return { ok: false, status: 400, message: 'Invalid role specified.' };
  }

  const activeRoles = partner.roles && partner.roles.length > 0
    ? partner.roles
    : (partner.partner_type ? [partner.partner_type] : []);

  if (activeRoles.includes(role)) {
    return { ok: false, status: 400, message: 'You already have this role active.' };
  }

  const pending = partner.role_requests?.find(r => r.role === role && r.status === 'pending');
  if (pending) {
    return { ok: false, status: 400, message: 'A request for this role is already pending approval.' };
  }

  return { ok: true };
}

/**
 * Returns the most recent previously-rejected request for a role, if any.
 * A rejected request carries its original payment/credit, so resubmitting
 * documents must not charge the partner again.
 */
function findRejectedRequest(partner, role) {
  if (!partner.role_requests) return null;
  return [...partner.role_requests].reverse().find(r => r.role === role && r.status === 'rejected') || null;
}

/**
 * Apply a (re)submission of a role request onto the partner document. Does NOT save.
 *
 * - If a rejected request for the role exists, it is reactivated (set back to
 *   pending) and its payment/credit state is preserved unless `payment` is given.
 * - Otherwise a brand-new pending request is pushed.
 *
 * @returns the request subdocument that was created/reactivated.
 */
function applyRoleRequest(partner, {
  role,
  profile_data,
  gst_number,
  gst_image,
  rera_number,
  rera_certificate_image,
  is_free_upgrade = false,
  payment = null, // { status, amount, order_id, paid_at }
}) {
  if (!partner.role_requests) partner.role_requests = [];

  const docFields = {
    gst_number: gst_number || undefined,
    gst_image: gst_image || undefined,
    rera_number: rera_number || undefined,
    rera_certificate_image: rera_certificate_image || undefined,
  };

  const rejected = findRejectedRequest(partner, role);
  let request;

  if (rejected) {
    // Resubmission — reactivate, keep prior payment/credit unless overridden.
    rejected.status = 'pending';
    rejected.submitted_at = new Date();
    rejected.rejection_reason = undefined;
    rejected.reviewed_at = undefined;
    rejected.reviewed_by = undefined;
    Object.assign(rejected, docFields);
    if (is_free_upgrade) rejected.is_free_upgrade = true;
    if (payment) {
      rejected.payment_status = payment.status || rejected.payment_status;
      rejected.amount_paid = payment.amount ?? rejected.amount_paid;
      rejected.razorpay_order_id = payment.order_id ?? rejected.razorpay_order_id;
      rejected.paid_at = payment.paid_at || rejected.paid_at;
    }
    request = rejected;
  } else {
    request = {
      role,
      status: 'pending',
      ...docFields,
      is_free_upgrade,
      submitted_at: new Date(),
      payment_status: payment?.status || 'not_required',
      amount_paid: payment?.amount ?? 0,
      razorpay_order_id: payment?.order_id,
      paid_at: payment?.paid_at,
    };
    partner.role_requests.push(request);
  }

  // Allow fresh re-application of a previously deleted role.
  if (partner.deleted_roles) {
    partner.deleted_roles = partner.deleted_roles.filter(r => r !== role);
  }

  // Stage profile data; it becomes active when admin approves.
  if (profile_data) {
    const key = PROFILE_KEY_BY_ROLE[role];
    if (key) {
      if (!partner.profile) partner.profile = {};
      partner.profile[key] = { ...(partner.profile[key] || {}), ...profile_data };
    }
  }

  return request;
}

module.exports = {
  VALID_ROLES,
  validateRoleUpgradeEligibility,
  findRejectedRequest,
  applyRoleRequest,
};
