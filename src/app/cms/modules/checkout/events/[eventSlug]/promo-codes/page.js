"use client";

import { PromoCodesPage } from "@/components/checkout/PromoCodesPage";
import { getCheckoutEventBySlug } from "@/services/checkout/eventService";
import {
  createPromoCode,
  createPromoCodeBatch,
  getPromoCodesByEvent,
  updatePromoCode,
  getPromoCodeRedemptions,
  deletePromoCode,
  exportPromoCodes,
} from "@/services/checkout/promoCodeService";
import PermissionGuard from "@/components/PermissionGuard";

const checkoutPromoCodeService = {
  createPromoCode,
  createPromoCodeBatch,
  getPromoCodesByEvent,
  updatePromoCode,
  getPromoCodeRedemptions,
  deletePromoCode,
  exportPromoCodes,
};

export default function CheckoutPromoCodesPage() {
  return (
    <PermissionGuard module="checkout" action="view_promo_codes">
      <PromoCodesPage
        promoCodeService={checkoutPromoCodeService}
        getEventBySlug={getCheckoutEventBySlug}
        moduleKey="checkout"
        eventBase="/cms/modules/checkout/events"
        showRegistrations={false}
      />
    </PermissionGuard>
  );
}
