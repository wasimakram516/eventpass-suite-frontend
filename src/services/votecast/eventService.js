import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all events (CMS use, protected)
export const getAllVoteCastEventsByBusiness = withApiHandler(async (businessSlug) => {
    const { data } = await api.get(`/votecast/events`, {
        params: { businessSlug },
    });
    return data;
});

// Get event by slug (public use)
export const getVoteCastEventBySlug = withApiHandler(async (slug) => {
    const { data } = await api.get(`/votecast/events/slug/${slug}`);
    return data;
});

// Get event by ID (CMS use)
export const getVoteCastEventById = withApiHandler(async (id) => {
    const { data } = await api.get(`/votecast/events/${id}`);
    return data;
});

// Create a new event (JSON with media URLs)
export const createVoteCastEvent = withApiHandler(
    async (eventData) => {
        const { data } = await api.post("/votecast/events", eventData);
        return data;
    },
    { showSuccess: true }
);

// Update an event by ID (JSON with media URLs)
export const updateVoteCastEvent = withApiHandler(
    async (id, eventData) => {
        const { data } = await api.put(`/votecast/events/${id}`, eventData);
        return data;
    },
    { showSuccess: true }
);

// Delete an event by ID
export const deleteVoteCastEvent = withApiHandler(
    async (id) => {
        const { data } = await api.delete(`/votecast/events/${id}`);
        return data;
    },
    { showSuccess: true }
);

