import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all events (protected)
export const getAllCheckInEvents = withApiHandler(async (businessSlug) => {
  const { data } = await api.get(`/checkin/events`, {
    params: { businessSlug },
  });
  return data;
});

// Get event by slug (public use)
export const getCheckInEventBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/checkin/events/slug/${slug}`);
  return data;
});

// Get event by ID (CMS use)
export const getCheckInEventById = withApiHandler(async (id) => {
  const { data } = await api.get(`/checkin/events/${id}`);
  return data;
});

// Create event (supports logo upload via FormData)
export const createCheckInEvent = withApiHandler(
  async (eventData) => {
    const { data } = await api.post("/checkin/events", eventData);
    return data;
  },
  { showSuccess: true }
);

// Update event by ID (supports logo upload via FormData)
export const updateCheckInEvent = withApiHandler(
  async (id, eventData) => {
    const { data } = await api.put(`/checkin/events/${id}`, eventData);
    return data;
  },
  { showSuccess: true }
);

// Delete event by ID
export const deleteCheckInEvent = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/checkin/events/${id}`);
    return data;
  },
  { showSuccess: true }
);

export const downloadEmployeeTemplate = async () => {
  try {
    const { data } = await api.get("/checkin/events/download-template", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employee_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    throw new Error(
      err?.response?.data?.message ||
      err?.message ||
      "Failed to download template"
    );
  }
};
