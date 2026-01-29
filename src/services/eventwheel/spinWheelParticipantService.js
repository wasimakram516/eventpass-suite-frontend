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

// Upload participants from Excel file (admin wheels only)
export const uploadParticipants = withApiHandler(
  async (spinWheelId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/eventwheel/participants/upload/${spinWheelId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
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

// Get participants by wheel slug (admin + public spin view - only visible participants)
export const getParticipantsBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(
    `/eventwheel/participants/slug/${slug}`
  );
  return data;
});

// Get participants for CMS (all participants with pagination and winner status)
export const getParticipantsForCMS = withApiHandler(
  async (spinWheelId, page = 1, limit = 10) => {
    const { data } = await api.get(
      `/eventwheel/participants/cms/${spinWheelId}?page=${page}&limit=${limit}`
    );
    return data;
  }
);

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

// Download sample Excel template (admin wheels only)
export const downloadSampleExcel = async (spinWheelId) => {
  const response = await api.get(
    `/eventwheel/participants/sample/${spinWheelId}`,
    { responseType: "blob" }
  );
  return response.data;
};

// Download country reference Excel file
export const downloadCountryReference = async () => {
  const response = await api.get(
    `/eventwheel/participants/country-reference`,
    { responseType: "blob" }
  );
  return response.data;
};

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

// Save Winner
export const saveWinner = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/eventwheel/participants/winner", payload);
    return data;
  },
  { showSuccess: false }
);

// Remove Winner (set visible to false)
export const removeWinner = withApiHandler(
  async (participantId) => {
    const { data } = await api.put(
      `/eventwheel/participants/winner/remove/${participantId}`
    );
    return data;
  },
  { showSuccess: true }
);

// Get Winners for a SpinWheel by Slug
export const getWinners = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventwheel/participants/winners/${slug}`);
  return data;
});
