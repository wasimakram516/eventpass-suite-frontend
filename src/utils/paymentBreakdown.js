/**
 * Shared paid-event pricing logic (frontend mirror of the backend util at
 * `eventpass-suite-backend/src/utils/paymentBreakdown.js`). Keep the two in sync.
 *
 * Each fee is a percentage of the BASE ticket price (fees do NOT compound).
 * VAT is applied to (base + all fees). All values are rounded to 3 decimals
 * (baisa precision) so the displayed total matches what Thawani charges.
 */

/** Round to 3 decimals (baisa precision), avoiding float drift. */
export function round3(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}

/**
 * Compute the full price breakdown for a single ticket.
 *
 * A promo code discount is applied to the base ticket price FIRST, before
 * fees and VAT — fees and VAT are then computed on the discounted base.
 *
 * @param {number} basePrice
 * @param {Array<{name:string, percentage:number}>} [fees=[]]
 * @param {number} [vatPercentage=0]
 * @param {number} [discountPercentage=0]
 * @returns {{ base, discountPercentage, discountAmount, discountedBase, feeLines, feesTotal, subtotal, vatPercentage, vatAmount, total }}
 */
export function computePaymentBreakdown(basePrice, fees = [], vatPercentage = 0, discountPercentage = 0) {
  const base = round3(Number(basePrice) || 0);
  const vatPct = Number(vatPercentage) || 0;
  const discountPct = Number(discountPercentage) || 0;
  const discountAmount = round3(base * (discountPct / 100));
  const discountedBase = round3(base - discountAmount);

  const feeLines = (Array.isArray(fees) ? fees : [])
    .filter((f) => f && f.name != null && Number(f.percentage) > 0)
    .map((f) => {
      const percentage = Number(f.percentage) || 0;
      return {
        name: String(f.name),
        percentage,
        amount: round3(discountedBase * (percentage / 100)),
      };
    });

  const feesTotal = round3(feeLines.reduce((sum, f) => sum + f.amount, 0));
  const subtotal = round3(discountedBase + feesTotal);
  const vatAmount = round3(subtotal * (vatPct / 100));
  const total = round3(subtotal + vatAmount);

  return {
    base,
    discountPercentage: discountPct,
    discountAmount,
    discountedBase,
    feeLines,
    feesTotal,
    subtotal,
    vatPercentage: vatPct,
    vatAmount,
    total,
  };
}

/** Format an OMR amount with 3 decimals + currency suffix. */
export function formatOmr(value, suffix = "OMR") {
  return `${(Number(value) || 0).toFixed(3)} ${suffix}`;
}
