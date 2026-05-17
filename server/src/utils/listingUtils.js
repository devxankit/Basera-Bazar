// Escape special regex metacharacters so user input can't cause ReDoS (H-1)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


/**
 * Sort listings by location priority:
 * 2 = same district, 1 = same state, 0 = other
 */
const sortByLocationPriority = (items, district, state) => {
  if (!district && !state) return items;
  return items.sort((a, b) => {
    const getScore = (item) => {
      // Support both Partner (top-level) and Listing (address sub-object) schemas
      const d = (item.address?.district || item.district || '').toLowerCase();
      const s = (item.address?.state || item.state || '').toLowerCase();

      const targetD = (district || '').toLowerCase();
      const targetS = (state || '').toLowerCase();

      if (targetD && d === targetD) return 2;
      if (targetS && s === targetS) return 1;
      return 0;
    };
    return getScore(b) - getScore(a);
  });
};

module.exports = { escapeRegex, sortByLocationPriority };
