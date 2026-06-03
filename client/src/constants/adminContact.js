/**
 * Centralized admin/support contact details.
 * Used by the "Account Suspended" / deactivation flows across the
 * Customer, Partner and Executive apps so there is a single source of truth.
 */

export const ADMIN_CONTACT = {
  phone: '+919876543210',
  whatsapp: '919876543210',
  email: 'support@baserabazar.com',
};

// Ready-to-use href links for tel / whatsapp / mailto anchors.
export const ADMIN_CONTACT_LINKS = {
  call: `tel:${ADMIN_CONTACT.phone}`,
  whatsapp: `https://wa.me/${ADMIN_CONTACT.whatsapp}`,
  email: `mailto:${ADMIN_CONTACT.email}`,
};
