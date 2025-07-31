import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Create a new public registration (public use)
export const createRegistration = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/eventreg/registrations", payload);
    return data;
  },
);

// Verify registration by QR token (Staff use)
export const verifyRegistrationByToken = withApiHandler(
  async (token) => {
    const { data } = await api.get(`/eventreg/registrations/verify?token=${token}`);
    return data;
  }
);

// Get registrations for a specific event (CMS use, by slug)
export const getRegistrationsByEvent = withApiHandler(
  async (slug, page = 1, limit = 10) => {
    const { data } = await api.get(
      `/eventreg/registrations/event/${slug}?page=${page}&limit=${limit}`
    );
    return data;
  }
);

// Delete a registration by ID (CMS use)
export const deleteRegistration = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/eventreg/registrations/${id}`);
    return data;
  },
  { showSuccess: true }
);
