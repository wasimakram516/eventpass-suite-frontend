import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export default function createPromoCodeService(basePath) {
  return {
    createPromoCode: withApiHandler(async (payload) => {
      const { data } = await api.post(basePath, payload);
      return data;
    }, { showSuccess: true }),
    createPromoCodeBatch: withApiHandler(async (payload) => {
      const { data } = await api.post(`${basePath}/batch`, payload);
      return data;
    }, { showSuccess: true }),
    getPromoCodesByEvent: withApiHandler(async (slug, params = {}) => {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`${basePath}/event/${slug}${query ? `?${query}` : ""}`);
      return data;
    }),
    updatePromoCode: withApiHandler(async (id, payload) => {
      const { data } = await api.patch(`${basePath}/${id}`, payload);
      return data;
    }, { showSuccess: true }),
    getPromoCodeRedemptions: withApiHandler(async (id) => {
      const { data } = await api.get(`${basePath}/${id}/redemptions`);
      return data;
    }),
    getPromoCodeMeta: withApiHandler(async (id) => {
      const { data } = await api.get(`${basePath}/${id}/meta`);
      return data;
    }),
    deletePromoCode: withApiHandler(async (id) => {
      const { data } = await api.delete(`${basePath}/${id}`);
      return data;
    }, { showSuccess: true }),
    validatePromoCode: withApiHandler(async (payload) => {
      const { data } = await api.post(`${basePath}/validate`, payload);
      return data;
    }),
    exportPromoCodes: async (slug, params = {}) => {
      let timezone = null;
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      } catch {
        timezone = null;
      }
      const query = new URLSearchParams({ ...params, ...(timezone ? { timezone } : {}) }).toString();
      const { data } = await api.get(
        `${basePath}/event/${slug}/export${query ? `?${query}` : ""}`,
        { responseType: "blob" },
      );
      return data;
    },
  };
}
