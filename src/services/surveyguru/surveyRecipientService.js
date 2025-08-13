import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

/**
 * LIST recipients for a form
 * params: { formId, q?, status? }
 * backend returns: { data: [...] } (simplified)
 */
export const listRecipients = withApiHandler(async (params = {}) => {
  const { data } = await api.get("/surveyguru/recipients", { params });
  return data; // { data }
});

/**
 * SYNC recipients from event registrations for a given form
 * POST /surveyguru/forms/:formId/recipients/sync
 */
export const syncRecipientsForForm = withApiHandler(
  async (formId) => {
    const { data } = await api.post(`/surveyguru/forms/${formId}/recipients/sync`);
    return data; // { added, updated, ... }
  },
  { showSuccess: true }
);

/**
 * DELETE a single recipient
 */
export const deleteRecipient = withApiHandler(
  async (recipientId) => {
    const { data } = await api.delete(`/surveyguru/recipients/${recipientId}`);
    return data;
  },
  { showSuccess: true }
);

/**
 * CLEAR all recipients for a form
 */
export const clearRecipientsForForm = withApiHandler(
  async (formId) => {
    const { data } = await api.delete(`/surveyguru/forms/${formId}/recipients`);
    return data; // { deleted }
  },
  { showSuccess: true }
);

/**
 * EXPORT recipients CSV
 * params: { formId }
 */
export const exportRecipientsCsv = async (params = {}) => {
  const query = new URLSearchParams(params).toString();

  try {
    const { data, headers } = await api.get(
      `/surveyguru/recipients/export${query ? `?${query}` : ""}`,
      {
        responseType: "blob", // Important for file download
      }
    );

    // Try to read the filename from Content-Disposition
    let filename = "recipients.xlsx";
    const disposition = headers["content-disposition"];
    if (disposition) {
      const match = disposition.match(/filename\*?=UTF-8''(.+)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      } else {
        const match2 = disposition.match(/filename="?([^"]+)"?/);
        if (match2 && match2[1]) {
          filename = match2[1];
        }
      }
    }

    // Create a blob link to download
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to export recipients"
    );
  }
};
