import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Initiate payment: creates pending registration + Thawani checkout session (public)
export const initiatePayment = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventreg/payments/initiate", payload);
  return data;
}, { showSuccess: true });

// Verify payment after Thawani success redirect (public)
export const verifyPayment = withApiHandler(async (registrationId) => {
  const { data } = await api.get(`/eventreg/payments/verify?registration_id=${registrationId}`);
  return data;
});

// Cancel payment after Thawani cancel redirect (public)
export const cancelPayment = withApiHandler(async (registrationId) => {
  const { data } = await api.get(`/eventreg/payments/cancel?registration_id=${registrationId}`);
  return data;
});

// Get paginated payments for an event (CMS admin)
export const getPaymentsByEvent = withApiHandler(async (slug, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get(`/eventreg/payments/event/${slug}${qs ? `?${qs}` : ""}`);
  return data;
});

// Get payment stats for an event (CMS admin)
export const getPaymentStats = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventreg/payments/event/${slug}/stats`);
  return data;
});

// Get Thawani checkout URL for a pending registration so staff can share it
export const getPaymentLink = withApiHandler(async (registrationId) => {
  const { data } = await api.get(`/eventreg/payments/link?registration_id=${registrationId}`);
  return data;
});

// Global payments log — all events (scoped by business for non-superadmin)
export const getAllPayments = withApiHandler(async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get(`/eventreg/payments${qs ? `?${qs}` : ""}`);
  return data;
});

// Excel export of the global payments log (same filters). Returns a Blob.
// Native axios (not withApiHandler) — withApiHandler breaks blob downloads.
export const exportPayments = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `/eventreg/payments/export${qs ? `?${qs}` : ""}`;
  const response = await api.get(url, { responseType: "blob" });
  return response.data;
};
