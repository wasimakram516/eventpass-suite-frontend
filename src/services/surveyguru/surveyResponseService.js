import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// PUBLIC: SUBMIT RESPONSE by slug (optionally pass ?token= in params)
export const submitSurveyResponseBySlug = withApiHandler(
  async (slug, payload, { token } = {}) => {
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    const { data } = await api.post(`/surveyguru/forms/public/slug/${slug}/submit${qs}`, payload);
    return data; // { _id }
  },
  { showSuccess: true }
);

// CMS: LIST RESPONSES FOR A FORM
export const listFormResponses = withApiHandler(async (formId) => {
  const { data } = await api.get(`/surveyguru/forms/${formId}/responses`);
  return data;
});

// (Optional) EXPORT RESPONSES CSV FOR A FORM
export const exportFormResponsesCsv = async (formId) => {
  try {
    const { data, headers } = await api.get(
      `/surveyguru/forms/${formId}/responses/export`,
      {
        responseType: "blob", // Important for file download
      }
    );

    // Default filename
    let filename = "responses.xlsx";

    // Try to extract from Content-Disposition
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
        "Failed to export form responses"
    );
  }
};
