import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Create a new digipass registration (public use)
export const createDigipassRegistration = withApiHandler(async (payload) => {
  const { data } = await api.post("/digipass/registrations", payload);
  return data;
});

// Sign in using identity fields (public use)
export const signInDigipass = withApiHandler(async (payload) => {
  const { data } = await api.post("/digipass/registrations/signin", payload);
  return data;
});

// Get registrations for a specific event (CMS use, by slug)
export const getDigipassRegistrationsByEvent = withApiHandler(
  async (slug, page = 1, limit = 10) => {
    const { data } = await api.get(
      `/digipass/registrations/event/${slug}?page=${page}&limit=${limit}`
    );
    return data;
  }
);

// Get initial registrations (first 50)
export const getDigipassInitialRegistrations = withApiHandler(async (slug) => {
  const { data } = await api.get(`/digipass/registrations/event/${slug}/all`);
  return data;
});

// Delete a registration by ID (CMS use)
export const deleteDigipassRegistration = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/digipass/registrations/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Update a registration by ID (CMS use)
export const updateDigipassRegistration = withApiHandler(
  async (id, fields) => {
    const { data } = await api.put(`/digipass/registrations/${id}`, { fields });
    return data;
  },
  { showSuccess: true }
);

// Create walkin record for a registration
export const createDigipassWalkIn = withApiHandler(
  async (id) => {
    const { data } = await api.post(`/digipass/registrations/${id}/walkin`);
    return data;
  },
  { showSuccess: true }
);

// Create registration (CMS use)
export const createDigipassRegistrationCMS = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/digipass/registrations", payload);
    return data;
  },
  { showSuccess: true }
);

// Download sample Excel template
export const downloadSampleExcel = async (slug) => {
  const response = await api.get(
    `/digipass/registrations/event/${slug}/sample-excel`,
    { responseType: "blob" }
  );
  return response.data;
};

// Export CSV (with filters)
export const exportRegistrations = async (slug, query = {}) => {
  const qs = new URLSearchParams(query).toString();

  const url = `/digipass/registrations/event/${slug}/export${qs ? `?${qs}` : ""}`;

  const response = await api.get(url, { responseType: "blob" });

  return response.data;
};

// Upload filled Excel
export const uploadRegistrations = withApiHandler(
  async (slug, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/digipass/registrations/event/${slug}/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },
  { showSuccess: true }
);

// Verify registration by QR token (Staff use)
export const verifyRegistrationByToken = withApiHandler(async (token) => {
  const { data } = await api.get(
    `/digipass/registrations/verify?token=${token}`
  );
  return data;
});

