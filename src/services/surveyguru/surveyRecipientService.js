import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const listRecipients = withApiHandler(async (params = {}) => {
  const { data } = await api.get("/surveyguru/recipients", { params });
  return data;
});

export const syncRecipientsForEvent = withApiHandler(
  async (formId, payload = {}) => {
    const { data } = await api.post(`/surveyguru/forms/${formId}/recipients/sync`, payload);
    return data;
  },
);

export const sendBulkSurveyEmails = withApiHandler(
  async (formId, payload = {}) => {
    const { data } = await api.post(
      `/surveyguru/forms/${formId}/recipients/bulk-email`,
      payload
    );
    return data;
  },
  { showSuccess: true }
);

export const deleteRecipient = withApiHandler(
  async (recipientId) => {
    const { data } = await api.delete(`/surveyguru/recipients/${recipientId}`);
    return data;
  },
  { showSuccess: true }
);

export const clearRecipientsForForm = withApiHandler(
  async (formId) => {
    const { data } = await api.delete(`/surveyguru/forms/${formId}/recipients`);
    return data;
  },
  { showSuccess: true }
);

export const exportRecipientsCsv = async (params = {}) => {
  const payload = { ...params };

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      payload.timezone = tz;
    }
  } catch {
    // Ignore timezone errors and fall back to server default
  }

  const query = new URLSearchParams(payload).toString();

  try {
    const { data, headers } = await api.get(
      `/surveyguru/recipients/export${query ? `?${query}` : ""}`,
      {
        responseType: "blob",
      },
    );

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
