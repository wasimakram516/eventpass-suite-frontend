import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Create a new public registration (public use)
export const createRegistration = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventreg/registrations", payload);
  return data;
});

// Get count of unsent registration emails for an event (CMS admin use)
export const getUnsentCount = withApiHandler(async (eventSlug) => {
  const { data } = await api.get(
    `/eventreg/registrations/event/${eventSlug}/unsent-count`
  );
  return data;
});

// Send bulk registration emails for an event (CMS admin use)
export const sendBulkEmails = withApiHandler(
  async (slug) => {
    const { data } = await api.post(
      `/eventreg/registrations/event/${slug}/bulk-email`
    );
    return data;
  },
  { showSuccess: true }
);

// Verify registration by QR token (Staff use)
export const verifyRegistrationByToken = withApiHandler(async (token) => {
  const { data } = await api.get(
    `/eventreg/registrations/verify?token=${token}`
  );
  return data;
});

// Download sample Excel template
export const downloadSampleExcel = async (slug) => {
  const response = await api.get(
    `/eventreg/registrations/event/${slug}/sample-excel`,
    { responseType: "blob" }
  );
  return response.data;
};

// Upload filled Excel
export const uploadRegistrations = withApiHandler(
  async (slug, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/eventreg/registrations/event/${slug}/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },
  { showSuccess: true }
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

// Get all public registrations for export (no pagination)
export const getAllPublicRegistrationsByEvent = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventreg/registrations/event/${slug}/all`);
  return data;
});

// Delete a registration by ID (CMS use)
export const deleteRegistration = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/eventreg/registrations/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Update a registration by ID (CMS use)
export const updateRegistration = withApiHandler(
  async (id, fields) => {
    const { data } = await api.put(`/eventreg/registrations/${id}`, { fields });
    return data;
  },
  { showSuccess: true }
);
