/**
 * ──────────────────────────────────────────────────────────────────────────
 * 🚩 RAZORPAY_FLAG — RAZORPAY TEMPORARILY DISABLED FOR APP STORE SUBMISSION
 * ──────────────────────────────────────────────────────────────────────────
 * Apple rejects apps that use Razorpay (or any non–Apple-Pay payment gateway)
 * for in-app payments when Apple Pay / IAP is not integrated. Razorpay is
 * therefore DISABLED while the app is under App Store review.
 *
 * Razorpay has NOT been removed — it is only short-circuited. Every disabled
 * call site is tagged with the comment marker `RAZORPAY_FLAG`, so you can find
 * them all with:   grep -rn "RAZORPAY_FLAG" client/src
 *
 * 👉 TO RE-ENABLE after the app is successfully published:
 *      set  RAZORPAY_ENABLED = true   (single switch, below)
 * ──────────────────────────────────────────────────────────────────────────
 */
export const RAZORPAY_ENABLED = false;


// Shown to a customer in the Mandi Bazar token-payment checkout flow.
export const RAZORPAY_DISABLED_MESSAGE =
  'Online payment is currently unavailable.\n\n' +
  'Please pay the entire amount directly to the supplier when your order is delivered.';

// Shown in the partner subscription / role-upgrade flows. Online payment is
// off, so partners are offered a cash (offline) option instead.
export const RAZORPAY_DISABLED_MESSAGE_GENERIC =
  'Online payment is currently unavailable.\n\n' +
  'You can pay in cash to activate this. Please contact our team or your ' +
  'relationship executive to complete the payment.';

/**
 * Centralised popup shown when a user taps a Pay button while Razorpay is off.
 * Using a blocking alert guarantees the user acknowledges the notice.
 *
 * @param {string} [message] Message to display (defaults to the generic notice).
 */
export function showRazorpayDisabledNotice(message = RAZORPAY_DISABLED_MESSAGE_GENERIC) {
   
  window.alert(message);
}
