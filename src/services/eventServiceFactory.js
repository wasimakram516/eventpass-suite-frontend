import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Shared event operations. Each module supplies its own API namespace.
export default function createEventService(basePath) {
  return {
    getAllEventsByBusiness: withApiHandler(async (businessSlug) => {
      const { data } = await api.get(basePath, { params: { businessSlug } });
      return data;
    }),
    getEventBySlug: withApiHandler(async (slug) => {
      const { data } = await api.get(`${basePath}/slug/${slug}`);
      return data;
    }),
    getEventBySlugForCms: withApiHandler(async (slug) => {
      const { data } = await api.get(`${basePath}/cms/slug/${slug}`);
      return data;
    }),
    getEventById: withApiHandler(async (id) => {
      const { data } = await api.get(`${basePath}/${id}`);
      return data;
    }),
    createEvent: withApiHandler(async (payload) => {
      const { data } = await api.post(basePath, payload);
      return data;
    }, { showSuccess: true }),
    updateEvent: withApiHandler(async (id, payload) => {
      const { data } = await api.put(`${basePath}/${id}`, payload);
      return data;
    }, { showSuccess: true }),
    deleteEvent: withApiHandler(async (id) => {
      const { data } = await api.delete(`${basePath}/${id}`);
      return data;
    }, { showSuccess: true }),
    cloneEvent: withApiHandler(async (id, options) => {
      const { data } = await api.post(`${basePath}/${id}/clone`, options);
      return data;
    }, { showSuccess: true }),
  };
}
