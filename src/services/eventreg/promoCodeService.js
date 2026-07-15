import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Create a single promo code (CMS admin)
export const createPromoCode = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventreg/promo-codes", payload);
  return data;
}, { showSuccess: true });

// Generate a batch of unique single-use promo codes (CMS admin)
export const createPromoCodeBatch = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventreg/promo-codes/batch", payload);
  return data;
}, { showSuccess: true });

// Get paginated promo codes for an event (CMS admin)
export const getPromoCodesByEvent = withApiHandler(async (slug, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get(`/eventreg/promo-codes/event/${slug}${qs ? `?${qs}` : ""}`);
  return data;
});

// Update a promo code — isActive, maxUses (increase only), discountPercentage,
// applicableTicketTypeIds (CMS admin)
export const updatePromoCode = withApiHandler(async (id, payload) => {
  const { data } = await api.patch(`/eventreg/promo-codes/${id}`, payload);
  return data;
}, { showSuccess: true });

// Registrations that redeemed a given promo code (CMS admin)
export const getPromoCodeRedemptions = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventreg/promo-codes/${id}/redemptions`);
  return data;
});

// Resolve a promo code's parent event slug — used by the Activity Logs
// "go to item" arrow to land on the right event's promo-codes page.
export const getPromoCodeMeta = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventreg/promo-codes/${id}/meta`);
  return data;
});

// Soft-delete a promo code (CMS admin)
export const deletePromoCode = withApiHandler(async (id) => {
  const { data } = await api.delete(`/eventreg/promo-codes/${id}`);
  return data;
}, { showSuccess: true });

// Validate a code at checkout — informational only, does not consume a use (public)
export const validatePromoCode = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventreg/promo-codes/validate", payload);
  return data;
});

// CSV export of an event's promo codes, to share status with organizers.
// Native axios (not withApiHandler) — withApiHandler breaks blob downloads.
export const exportPromoCodes = async (slug) => {
  let timezone = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    timezone = null;
  }
  const qs = timezone ? `?timezone=${encodeURIComponent(timezone)}` : "";
  const response = await api.get(`/eventreg/promo-codes/event/${slug}/export${qs}`, { responseType: "blob" });
  return response.data;
};
