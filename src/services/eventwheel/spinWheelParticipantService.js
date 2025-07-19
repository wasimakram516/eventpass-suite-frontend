import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Add participant
export const addParticipant = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventwheel/participants", payload);
  return data;
}, { showSuccess: true });

// Add/update participants in bulk
export const addOrUpdateParticipantsInBulk = withApiHandler(async (payload) => {
  const { data } = await api.post("/eventwheel/participants/bulk", payload);
  return data;
}, { showSuccess: true });

// Public API to get spin wheel details by ID
export const getPublicSpinWheelById = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventwheel/participants/public/spinwheel/${id}`);
  return data;
});

// Get all participants (optionally by spinWheelId)
export const getAllParticipants = withApiHandler(async (spinWheelId) => {
  const { data } = await api.get(`/eventwheel/participants?spinWheelId=${spinWheelId}`);
  return data;
});

// Get participants by slug
export const getParticipantsBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventwheel/participants/slug/${slug}`);
  return data;
});

// Get bulk participant names (for enter_names wheels)
export const getBulkParticipantsForSpinWheel = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventwheel/participants/bulk/${slug}`);
  return data;
});

// Get single participant
export const getParticipantById = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventwheel/participants/single/${id}`);
  return data;
});

// Update participant
export const updateParticipant = withApiHandler(async (id, payload) => {
  const { data } = await api.put(`/eventwheel/participants/${id}`, payload);
  return data;
}, { showSuccess: true });

// Delete participant
export const deleteParticipant = withApiHandler(async (id) => {
  const { data } = await api.delete(`/eventwheel/participants/${id}`);
  return data;
}, { showSuccess: true });
