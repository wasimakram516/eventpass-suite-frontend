import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Add participant
export const addParticipant = withApiHandler(async (payload) => {
  const { data } = await api.post("/spinwheel/participants", payload);
  return data;
}, { showSuccess: true });

// Add/update participants in bulk
export const addOrUpdateParticipantsInBulk = withApiHandler(async (payload) => {
  const { data } = await api.post("/spinwheel/participants/bulk", payload);
  return data;
}, { showSuccess: true });

// Get all participants (optionally by spinWheelId)
export const getAllParticipants = withApiHandler(async (spinWheelId) => {
  const { data } = await api.get(`/spinwheel/participants?spinWheelId=${spinWheelId}`);
  return data;
});

// Get participants by slug
export const getParticipantsBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/spinwheel/participants/slug/${slug}`);
  return data;
});

// Get bulk participant names (for enter_names wheels)
export const getBulkParticipantsForSpinWheel = withApiHandler(async (slug) => {
  const { data } = await api.get(`/spinwheel/participants/bulk/${slug}`);
  return data;
});

// Get single participant
export const getParticipantById = withApiHandler(async (id) => {
  const { data } = await api.get(`/spinwheel/participants/single/${id}`);
  return data;
});

// Update participant
export const updateParticipant = withApiHandler(async (id, payload) => {
  const { data } = await api.put(`/spinwheel/participants/${id}`, payload);
  return data;
}, { showSuccess: true });

// Delete participant
export const deleteParticipant = withApiHandler(async (id) => {
  const { data } = await api.delete(`/spinwheel/participants/${id}`);
  return data;
}, { showSuccess: true });
