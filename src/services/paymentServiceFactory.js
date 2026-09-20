import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// EventReg keeps its legacy API namespace while Checkout uses its own. The
// request contract is shared, so one factory prevents the two clients from
// drifting as the migration proceeds.
export default function createPaymentService(basePath) {
  const withQuery = (path, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `${basePath}${path}${query ? `?${query}` : ""}`;
  };

  return {
    initiatePayment: withApiHandler(async (payload) => {
      const { data } = await api.post(`${basePath}/initiate`, payload);
      return data;
    }, { showSuccess: true }),
    verifyPayment: withApiHandler(async (registrationId) => {
      const { data } = await api.get(`${basePath}/verify?registration_id=${registrationId}`);
      return data;
    }),
    cancelPayment: withApiHandler(async (registrationId) => {
      const { data } = await api.get(`${basePath}/cancel?registration_id=${registrationId}`);
      return data;
    }),
    getPaymentsByEvent: withApiHandler(async (slug, params = {}) => {
      const { data } = await api.get(withQuery(`/event/${slug}`, params));
      return data;
    }),
    getPaymentStats: withApiHandler(async (slug) => {
      const { data } = await api.get(`${basePath}/event/${slug}/stats`);
      return data;
    }),
    getPaymentLink: withApiHandler(async (registrationId) => {
      const { data } = await api.get(`${basePath}/link?registration_id=${registrationId}`);
      return data;
    }),
    getAllPayments: withApiHandler(async (params = {}) => {
      const { data } = await api.get(withQuery("", params));
      return data;
    }),
    exportPayments: async (params = {}) => {
      const { data } = await api.get(withQuery("/export", params), { responseType: "blob" });
      return data;
    },
    exportInvoices: async (params = {}) => {
      const { data } = await api.get(withQuery("/invoices", params), { responseType: "blob" });
      return data;
    },
  };
}
