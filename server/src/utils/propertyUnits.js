const { PropertyUnit } = require('../models/System');

// The units that have always been available in the partner Add-Property form.
// These are seeded once so the dropdown keeps working exactly as before, while
// admins can now add/edit/remove units from Properties > Units.
const DEFAULT_PROPERTY_UNITS = ['sq. ft.', 'sq. m.', 'acre', 'dismil', 'gaj'];

// Seed the default units the first time the collection is queried while empty.
// Safe to call repeatedly — it only inserts when nothing exists.
let seeding = null;
const ensurePropertyUnitsSeeded = async () => {
  try {
    const count = await PropertyUnit.estimatedDocumentCount();
    if (count > 0) return;
    if (!seeding) {
      seeding = PropertyUnit.insertMany(
        DEFAULT_PROPERTY_UNITS.map((name, i) => ({ name, order: i, is_active: true })),
        { ordered: false }
      ).catch(() => {}); // Ignore duplicate-key races from concurrent requests
    }
    await seeding;
    seeding = null;
  } catch (_) {
    seeding = null;
  }
};

// A unit's display label is sent by the forms, but listings can store either the
// label or a legacy short code (the partner controller maps "sq. ft." -> "sqft"
// and "sq. m." -> "sqmt"). Return every representation a listing may hold for a
// given unit so the "in use" check before deletion is accurate.
const storedFormsForUnit = (name) => {
  const n = (name || '').trim();
  if (n === 'sq. ft.') return ['sq. ft.', 'sq.ft', 'sqft'];
  if (n === 'sq. m.') return ['sq. m.', 'sq.m.', 'sqmt'];
  return [n];
};

module.exports = { DEFAULT_PROPERTY_UNITS, ensurePropertyUnitsSeeded, storedFormsForUnit };
