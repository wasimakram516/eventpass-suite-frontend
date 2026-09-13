import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";
import { uploadSingleFile } from "@/utils/mediaUpload";

/* =========================================================
   File Resource Service — S3-based downloadable files
   ========================================================= */

// Get all files (optionally by businessSlug)
export const getAllFiles = withApiHandler(async (businessSlug) => {
  const { data } = await api.get("/files", {
    params: businessSlug ? { businessSlug } : {},
  });
  return data;
});

// Get file by ID
export const getFileById = withApiHandler(async (id) => {
  const { data } = await api.get(`/files/${id}`);
  return data;
});

// Get file by slug (public endpoint)
export const getFileBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/files/slug/${slug}`);
  return data;
});

export const uploadFileResource = ({ file, businessSlug, onProgress }) =>
  uploadSingleFile({
    file,
    businessSlug,
    moduleName: "files",
    onProgress,
    returnUploadDetails: true,
  });

// Create new file from an authorized direct-to-S3 upload.
export const createFile = withApiHandler(
  async (formData) => {
    const { data } = await api.post("/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Update file from an authorized direct-to-S3 upload.
export const updateFile = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/files/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Delete file (admin only)
export const deleteFile = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/files/${id}`);
    return data;
  },
  { showSuccess: true }
);
