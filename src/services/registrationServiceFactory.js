import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Common registration operations only. Payment creation, conversion, and
// invoices are provided separately by Checkout.
export default function createRegistrationService(basePath, { defaultLimit = 10 } = {}) {
  const sendNotification = (endpoint) => withApiHandler(async (slug, fields = {}, file = null) => {
    const formData = new FormData();
    Object.entries(fields || {}).forEach(([key, value]) => {
      if (key !== "file" && value !== undefined && value !== null) formData.append(key, value);
    });
    if (file) formData.append("file", file);
    const { data } = await api.post(`${basePath}/event/${slug}/${endpoint}`, formData);
    return data;
  }, { showSuccess: true });

  return {
    getRegistrationsByEvent: withApiHandler(async (slug, page = 1, limit = defaultLimit, sort = -1, filters = {}) => {
      const params = new URLSearchParams({ page, limit, sort });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== "all") params.set(key, value);
      });
      const { data } = await api.get(`${basePath}/event/${slug}?${params}`);
      return data;
    }),
    getInitialRegistrations: withApiHandler(async (slug, sort = -1) => {
      const { data } = await api.get(`${basePath}/event/${slug}/all?sort=${sort}`);
      return data;
    }),
    getAllPublicRegistrationsByEvent: withApiHandler(async (slug) => {
      const { data } = await api.get(`${basePath}/event/${slug}/all`);
      return data;
    }),
    exportRegistrations: async (slug, query = {}) => {
      const params = new URLSearchParams(Object.entries(query).filter(([, value]) =>
        value !== undefined && value !== null && value !== "" && value !== "all",
      )).toString();
      const { data } = await api.get(`${basePath}/event/${slug}/export${params ? `?${params}` : ""}`, { responseType: "blob" });
      return data;
    },
    getUnsentCount: withApiHandler(async (slug) => {
      const { data } = await api.get(`${basePath}/event/${slug}/unsent-count`);
      return data;
    }),
    sendBulkEmails: sendNotification("bulk-email"),
    sendBulkWhatsApp: sendNotification("bulk-whatsapp"),
    downloadSampleExcel: async (slug) => {
      const { data } = await api.get(`${basePath}/event/${slug}/sample-excel`, { responseType: "blob" });
      return data;
    },
    downloadCountryReference: async () => {
      const { data } = await api.get(`${basePath}/country-reference`, { responseType: "blob" });
      return data;
    },
    uploadRegistrations: withApiHandler(async (slug, file) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(`${basePath}/event/${slug}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    }, { showSuccess: true }),
    updateRegistration: withApiHandler(async (id, fields) => {
      const { data } = await api.put(`${basePath}/${id}`, { fields });
      return data;
    }, { showSuccess: true }),
    deleteRegistration: withApiHandler(async (id) => {
      const { data } = await api.delete(`${basePath}/${id}`);
      return data;
    }, { showSuccess: true }),
    updateRegistrationApproval: withApiHandler(async (id, status) => {
      const { data } = await api.patch(`${basePath}/${id}/approval`, { status });
      return data;
    }, { showSuccess: true }),
    bulkUpdateRegistrationApproval: withApiHandler(async (slug, payload) => {
      const { data } = await api.patch(`${basePath}/event/${slug}/approval/bulk`, payload);
      return data;
    }, { showSuccess: true }),
    createWalkIn: withApiHandler(async (id) => {
      const { data } = await api.post(`${basePath}/${id}/walkin`);
      return data;
    }, { showSuccess: true }),
    getRegistrationMeta: withApiHandler(async (id) => {
      const { data } = await api.get(`${basePath}/${id}/meta`);
      return data;
    }),
    trackBadgePrint: withApiHandler(async (id) => {
      const { data } = await api.patch(`${basePath}/${id}/track-print`);
      return data;
    }),
  };
}
