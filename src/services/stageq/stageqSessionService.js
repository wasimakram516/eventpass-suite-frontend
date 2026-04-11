import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// CMS: Get all sessions for a business
export const getSessions = withApiHandler(async (businessSlug) => {
  const { data } = await api.get(`/stageq/sessions`, { params: { businessSlug } });
  return data;
});

// CMS: Create a session
export const createSession = withApiHandler(
  async (payload) => {
    const { data } = await api.post(`/stageq/sessions`, payload);
    return data;
  },
  { showSuccess: true }
);

// CMS: Update a session
export const updateSession = withApiHandler(
  async (id, payload) => {
    const { data } = await api.put(`/stageq/sessions/${id}`, payload);
    return data;
  },
  { showSuccess: true }
);

// CMS: Delete a session
export const deleteSession = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/stageq/sessions/${id}`);
    return data;
  },
  { showSuccess: true }
);

// Public: Get session by slug
export const getPublicSessionBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/stageq/sessions/slug/${slug}`);
  return data;
});

// Public: Verify attendee by session slug
export const verifyAttendeeBySession = withApiHandler(async (slug, fieldValue) => {
  const { data } = await api.post(`/stageq/sessions/${slug}/verify`, { fieldValue });
  return data;
});

// Public: Get questions for a session
export const getQuestionsBySession = withApiHandler(async (sessionSlug) => {
  const { data } = await api.get(`/stageq/questions/session/${sessionSlug}`);
  return data;
});

// Public: Submit a question to a session
export const submitQuestionToSession = withApiHandler(
  async (sessionSlug, payload) => {
    const { data } = await api.post(`/stageq/questions/session/${sessionSlug}`, payload);
    return data;
  },
  { showSuccess: true }
);
