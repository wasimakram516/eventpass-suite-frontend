import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all digipass events (CMS use, protected)
export const getAllDigipassEvents = withApiHandler(async (businessSlug) => {
    const { data } = await api.get(`/digipass/events`, {
        params: { businessSlug },
    });
    return data;
});

// Get event by slug (public use)
export const getDigipassEventBySlug = withApiHandler(async (slug) => {
    const { data } = await api.get(`/digipass/events/slug/${slug}`);
    return data;
});

// Get event by ID (CMS use)
export const getDigipassEventById = withApiHandler(async (id) => {
    const { data } = await api.get(`/digipass/events/${id}`);
    return data;
});

// Create a new digipass event (JSON with media URLs)
export const createDigipassEvent = withApiHandler(
    async (eventData) => {
        const { data } = await api.post("/digipass/events", eventData);
        return data;
    },
    { showSuccess: true }
);

// Update a digipass event by ID (JSON with media URLs)
export const updateDigipassEvent = withApiHandler(
    async (id, eventData) => {
        const { data } = await api.put(`/digipass/events/${id}`, eventData);
        return data;
    },
    { showSuccess: true }
);

// Delete a digipass event by ID
export const deleteDigipassEvent = withApiHandler(
    async (id) => {
        const { data } = await api.delete(`/digipass/events/${id}`);
        return data;
    },
    { showSuccess: true }
);

