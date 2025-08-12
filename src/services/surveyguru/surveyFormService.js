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

// PUBLIC: GET FORM BY SLUG
export const getPublicFormBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/surveyguru/forms/public/slug/${slug}`);
  return data;
});
