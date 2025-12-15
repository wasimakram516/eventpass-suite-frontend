import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all display media
export const getDisplayMedia = withApiHandler(async () => {
  const response = await api.get("/mosaicwall/display-media");
  return response.data;
});

// Get media item by ID
export const getMediaById = withApiHandler(async (id) => {
  const response = await api.get(`/mosaicwall/display-media/${id}`);
  return response.data;
});

// Create display media (image + optional text) linked to wallSlug
export const createDisplayMedia = withApiHandler(
  async ({ imageUrl, text = "", slug }) => {
    const payload = {
      imageUrl,
      text,
    };

    const response = await api.post(
      `/mosaicwall/display-media/upload/${slug}`,
      payload
    );

    return response.data;
  },
  { showSuccess: true }
);

// Update media (text and/or new image)
export const updateDisplayMedia = withApiHandler(
  async (id, { imageUrl, text }) => {
    const payload = {};
    if (imageUrl) payload.imageUrl = imageUrl;
    if (text !== undefined) payload.text = text;

    const response = await api.put(`/mosaicwall/display-media/${id}`, payload);

    return response.data;
  },
  { showSuccess: true }
);

// Delete media by ID
export const deleteDisplayMedia = withApiHandler(
  async (id) => {
    const response = await api.delete(`/mosaicwall/display-media/${id}`);
    return response.data;
  },
  { showSuccess: true }
);
