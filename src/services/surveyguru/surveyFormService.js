import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// CMS: CREATE FORM
export const createSurveyForm = withApiHandler(
  async (payload) => {
    const { data } = await api.post("/surveyguru/forms", payload);
    return data;
  },
  { showSuccess: true }
);

// CMS: LIST FORMS (supports ?businessId=&eventId=&withCounts=1)
export const listSurveyForms = withApiHandler(async (params = {}) => {
  const { data } = await api.get("/surveyguru/forms", { params });
  return data;
});

// CMS: GET FORM BY ID
export const getSurveyForm = withApiHandler(async (id) => {
  const { data } = await api.get(`/surveyguru/forms/${id}`);
  return data;
});

/**
 * Retrieves a survey form while retaining HTTP status for safe page-state handling.
 *
 * @param {string} id - Survey form identifier.
 * @returns {Promise<object>} The form response or a structured request error.
 */
export const getSurveyFormBySlugWithStatus = async (slug) => {
  try {
    const { data } = await api.get(`/surveyguru/forms/slug/${slug}`);
    return data;
  } catch (error) {
    return {
      error: true,
      status: error?.response?.status,
      message: error?.response?.data?.message || error?.message,
    };
  }
};

export const getSurveyFormWithStatus = async (id) => {
  try {
    const { data } = await api.get(`/surveyguru/forms/${id}`);
    return data;
  } catch (error) {
    return {
      error: true,
      status: error?.response?.status,
      message: error?.response?.data?.message || error?.message,
    };
  }
};

// CMS: UPDATE FORM
export const updateSurveyForm = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/surveyguru/forms/${id}`, payload);
    return data;
  },
  { showSuccess: true }
);

// CMS: DELETE FORM
export const deleteSurveyForm = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/surveyguru/forms/${id}`);
    return data;
  },
  { showSuccess: true }
);

// CMS: CLONE FORM
export const cloneSurveyForm = withApiHandler(
  async (id) => {
    const { data } = await api.post(`/surveyguru/forms/${id}/clone`);
    return data;
  },
  { showSuccess: true }
);

// PUBLIC: GET FORM BY SLUG
export const getPublicFormBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/surveyguru/forms/public/slug/${slug}`);
  return data;
});
