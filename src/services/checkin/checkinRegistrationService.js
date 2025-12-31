import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Create registration (CMS use)
export const createCheckInRegistration = withApiHandler(async (payload) => {
  const { data } = await api.post("/checkin/registrations", payload);
  return data;
});

// Download sample Excel template
export const downloadCheckInSampleExcel = async (slug) => {
  const response = await api.get(
    `/checkin/registrations/event/${slug}/sample-excel`,
    { responseType: "blob" }
  );
  return response.data;
};

// Upload filled Excel
export const uploadCheckInRegistrations = withApiHandler(
  async (slug, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/checkin/registrations/event/${slug}/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },
  { showSuccess: true }
);

// Export CSV (with filters)
export const exportCheckInRegistrations = async (slug, query = {}) => {
  const qs = new URLSearchParams(query).toString();
  const url = `/checkin/registrations/event/${slug}/export${qs ? `?${qs}` : ""}`;
  const response = await api.get(url, { responseType: "blob" });
  return response.data;
};

// Get initial registrations (first batch)
export const getCheckInInitialRegistrations = withApiHandler(async (slug) => {
  const { data } = await api.get(`/checkin/registrations/event/${slug}/all`);
  return data;
});

// Get registrations for an event by slug (protected)
export const getCheckInRegistrationsByEvent = withApiHandler(
  async (slug, page = 1, limit = 10) => {
    const { data } = await api.get(
      `/checkin/registrations/event/${slug}?page=${page}&limit=${limit}`
    );
    return data;
  }
);

// Delete registration by ID (protected)
export const deleteCheckInRegistration = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/checkin/registrations/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Update a registration by ID (CMS use)
export const updateCheckInRegistration = withApiHandler(
  async (id, fields) => {
    const { data } = await api.put(`/checkin/registrations/${id}`, { fields });
    return data;
  },
  { showSuccess: true }
);

export const updateCheckInRegistrationApproval = withApiHandler(
  async (id, status) => {
    const { data } = await api.patch(`/checkin/registrations/${id}/approval`, {
      status,
    });
    return data;
  },
  { showSuccess: true }
);

// Verify registration by QR token (Staff use)
export const verifyRegistrationByToken = withApiHandler(
  async (token) => {
    const { data } = await api.get(`/checkin/registrations/verify?token=${token}`);
    return data;
  }
);

// Get all checkin registrations for export (no pagination)
export const getAllCheckInRegistrationsByEvent = withApiHandler(
  async (slug) => {
    const { data } = await api.get(`/checkin/registrations/event/${slug}/all`);
    return data;
  }
);

// Create walk-in record for a registration
export const createCheckInWalkIn = withApiHandler(
  async (id) => {
    const { data } = await api.post(`/checkin/registrations/${id}/walkin`);
    return data;
  },
  { showSuccess: true }
);

// Get registration by token (public endpoint for confirmation page)
export const getCheckInRegistrationByToken = withApiHandler(async (token) => {
  const { data } = await api.get(`/checkin/registrations/by-token?token=${token}`);
  return data;
});

// Confirm presence (public endpoint - updates approvalStatus to confirmed)
export const confirmCheckInPresence = withApiHandler(
  async (token) => {
    const { data } = await api.post("/checkin/registrations/confirm-presence", {
      token,
    });
    return data;
  },
  { showSuccess: true }
);

// Update attendance status by token
export const updateCheckInAttendanceStatus = withApiHandler(
  async (token, status) => {
    const { data } = await api.post("/checkin/registrations/update-attendance-status", {
      token,
      status,
    });
    return data;
  },
  { showSuccess: true }
);

// Send bulk registration emails for an event (CMS admin use)
export const sendCheckInBulkEmails = withApiHandler(
  async (slug, customEmail = null, file = null) => {
    const formData = new FormData();

    if (customEmail) {
      Object.keys(customEmail).forEach((key) => {
        if (customEmail[key] !== undefined && customEmail[key] !== null) {
          if (key === "file") {
            return;
          }
          formData.append(key, customEmail[key]);
        }
      });
    }

    if (file) {
      formData.append("file", file);
    }

    const { data } = await api.post(
      `/checkin/registrations/event/${slug}/bulk-email`,
      formData
    );
    return data;
  },
  { showSuccess: true }
);

// Send bulk WhatsApp messages for an event (CMS admin use)
export const sendCheckInBulkWhatsApp = withApiHandler(
  async (slug, filters = {}, file = null) => {
    const formData = new FormData();

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        if (key === "file") {
          return;
        }
        formData.append(key, filters[key]);
      }
    });

    if (file) {
      formData.append("file", file);
    }

    const { data } = await api.post(
      `/checkin/registrations/event/${slug}/bulk-whatsapp`,
      formData
    );
    return data;
  },
  { showSuccess: true }
);