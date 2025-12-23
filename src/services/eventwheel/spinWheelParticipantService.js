import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

/* =========================
   CREATE / MUTATE
========================= */

// Add participant (admin wheels only)
export const addParticipant = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/eventwheel/participants", payload);
    return data;
  },
  { showSuccess: true }
);

// Add participants on the spot (onspot wheels only)
export const addParticipantsOnSpot = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/eventwheel/participants/onspot", payload);
    return data;
  },
  { showSuccess: true }
);

// Sync participants from event registrations (synced wheels only)
export const syncSpinWheelParticipants = withApiHandler(
  async (spinWheelId, payload = {}) => {
    const { data } = await api.post(
      `/eventwheel/participants/sync/${spinWheelId}`,
      payload
    );
    return data;
  },
  { showSuccess: true }
);

/* =========================
   READ
========================= */

// Get participants by wheel slug (admin + public spin view)
export const getParticipantsBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(
    `/eventwheel/participants/slug/${slug}`
  );
  return data;
});

// Get single participant by ID (admin/internal)
export const getParticipantById = withApiHandler(async (id) => {
  const { data } = await api.get(
    `/eventwheel/participants/single/${id}`
  );
  return data;
});

// Get sync filters for a spin wheel (synced wheels only)
export const getSpinWheelSyncFilters = withApiHandler(async (spinWheelId) => {
  const { data } = await api.get(
    `/eventwheel/participants/sync/filters/${spinWheelId}`
  );
  return data;
});

/* =========================
   EXPORT
========================= */

// Export participants to XLSX (synced + non-synced wheels)
export const exportSpinWheelParticipantsXlsx = withApiHandler(
  async (spinWheelId) => {
    const response = await api.get(
      `/eventwheel/participants/export/${spinWheelId}/xlsx`,
      {
        responseType: "blob", // IMPORTANT for file downloads
      }
    );

    // Create file download
    const blob = new Blob([response.data], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Try to extract filename from headers, fallback if missing
    const contentDisposition = response.headers["content-disposition"];
    let filename = "spinwheel_participants.xlsx";

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match?.[1]) filename = match[1];
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  },
  {
    showSuccess: false, 
  }
);

/* =========================
   UPDATE / DELETE
========================= */

// Update participant (blocked for synced wheels by backend)
export const updateParticipant = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(
      `/eventwheel/participants/${id}`,
      payload
    );
    return data;
  },
  { showSuccess: true }
);

// Delete participant (permanent for synced wheels)
export const deleteParticipant = withApiHandler(
  async (id) => {
    const { data } = await api.delete(
      `/eventwheel/participants/${id}`
    );
    return data;
  },
  { showSuccess: true }
);
