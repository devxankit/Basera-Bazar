import { useState, useCallback, useRef } from 'react';

/**
 * Generic form validation hook.
 *
 * Usage:
 *   const { errors, validate, validateAll, register, setError, clearError, clearAll } = useFormValidation();
 *
 *   // attach a ref so the field can be focused/scrolled-to on error:
 *   <input ref={register('email')} ... />
 *   // or, if you don't keep a ref, give the input  name="email"  and it will be found by name.
 *
 *   // validate a single field:
 *   const err = validate('phone', v.phone(form.phone));
 *   if (err) return; // err is the message, also stored in errors.phone
 *
 *   // validate multiple fields at once — on failure the FIRST invalid field is
 *   // automatically scrolled into the viewport and focused, and the form is not submitted:
 *   const ok = validateAll({
 *     name:  v.name(form.name),
 *     phone: v.phone(form.phone),
 *     email: v.email(form.email),
 *   });
 *   if (!ok) return; // submission blocked; first bad field already focused
 */
const useFormValidation = () => {
  const [errors, setErrors] = useState({});
  const fieldRefs = useRef({});

  // Returns a ref callback. Use as:  <input ref={register('email')} />
  const register = useCallback((field) => (el) => {
    if (el) fieldRefs.current[field] = el;
    else delete fieldRefs.current[field];
  }, []);

  // Resolve a focusable element for a field: the registered node (or an input
  // inside it), falling back to a [name="field"] lookup in the document.
  const resolveEl = useCallback((field) => {
    let node = fieldRefs.current[field];
    if (node && typeof node.focus !== 'function' && typeof node.querySelector === 'function') {
      node = node.querySelector('input, select, textarea, [tabindex]') || node;
    }
    if (!node && typeof document !== 'undefined') {
      node = document.querySelector(`[name="${field}"]`);
    }
    return node || null;
  }, []);

  // Scroll the first errored field into the centre of the viewport and focus it.
  const focusFirstError = useCallback((fieldOrder) => {
    const order = fieldOrder && fieldOrder.length ? fieldOrder : Object.keys(fieldRefs.current);
    for (const field of order) {
      const el = resolveEl(field);
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          el.scrollIntoView();
        }
        // preventScroll so our smooth scroll isn't overridden by the focus jump
        try { el.focus({ preventScroll: true }); } catch { el.focus?.(); }
        return true;
      }
    }
    return false;
  }, [resolveEl]);

  const validate = useCallback((field, errorMsg) => {
    setErrors(prev => ({ ...prev, [field]: errorMsg || undefined }));
    return errorMsg || null;
  }, []);

  const validateAll = useCallback((fieldErrorMap) => {
    const next = {};
    const failedOrder = [];
    let valid = true;
    for (const [field, msg] of Object.entries(fieldErrorMap)) {
      if (msg) {
        next[field] = msg;
        failedOrder.push(field);
        valid = false;
      }
    }
    setErrors(next);
    if (!valid) {
      // Defer to next frame so the error styles/messages have rendered before we scroll.
      const run = () => focusFirstError(failedOrder);
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
      else setTimeout(run, 0);
    }
    return valid;
  }, [focusFirstError]);

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

  return { errors, validate, validateAll, register, focusFirstError, setError, clearError, clearAll };
};

export default useFormValidation;
