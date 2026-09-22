import createPromoCodeService from "@/services/promoCodeServiceFactory";

const promoCodeService = createPromoCodeService("/checkout/promo-codes");

export const {
  createPromoCode,
  createPromoCodeBatch,
  getPromoCodesByEvent,
  updatePromoCode,
  getPromoCodeRedemptions,
  getPromoCodeMeta,
  deletePromoCode,
  validatePromoCode,
  exportPromoCodes,
} = promoCodeService;
