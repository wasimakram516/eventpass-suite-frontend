import api from "./api";

export const requestUploadAuthorization = async ({
  businessSlug,
  fileName,
  fileType,
  moduleName,
  wallSlug,
}) => {
  const payload = {
    businessSlug,
    fileName,
    fileType,
    moduleName,
  };

  if (wallSlug) {
    payload.wallSlug = wallSlug;
  }

  const { data } = await api.post("/uploads/authorize", payload);
  return data.data;
};
