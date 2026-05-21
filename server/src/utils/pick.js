/**
 * Return a new object containing only the specified keys from obj.
 * Undefined values are omitted so Mongoose $set won't nullify fields.
 */
const pick = (obj, keys) => {
  if (!obj || !Array.isArray(keys)) return {};
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
};

module.exports = pick;
