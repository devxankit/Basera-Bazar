import { useState, useCallback } from 'react';

/**
 * Generic form validation hook.
 *
 * Usage:
 *   const { errors, validate, setError, clearError, clearAll } = useFormValidation();
 *
 *   // validate a single field:
 *   const err = validate('phone', v.phone(form.phone));
 *   if (err) return; // err is the message, also stored in errors.phone
 *
 *   // validate multiple fields at once:
 *   const ok = validateAll({
 *     name:  v.name(form.name),
 *     phone: v.phone(form.phone),
 *     email: v.email(form.email),
 *   });
 *   if (!ok) return;
 */
const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  const validate = useCallback((field, errorMsg) => {
    setErrors(prev => ({ ...prev, [field]: errorMsg || undefined }));
    return errorMsg || null;
  }, []);

  const validateAll = useCallback((fieldErrorMap) => {
    const next = {};
    let valid = true;
    for (const [field, msg] of Object.entries(fieldErrorMap)) {
      if (msg) {
        next[field] = msg;
        valid = false;
      }
    }
    setErrors(next);
    return valid;
  }, []);

  const setError = useCallback((field, msg) => {
    setErrors(prev => ({ ...prev, [field]: msg }));
  }, []);

  const clearError = useCallback((field) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  return { errors, validate, validateAll, setError, clearError, clearAll };
};

export default useFormValidation;
