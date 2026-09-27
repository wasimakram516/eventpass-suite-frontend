// Pull the filename the backend set on a blob download from the
// Content-Disposition header, falling back to a caller-supplied name.
export const getExportFilename = (headers, fallback) => {
  const disposition = headers?.["content-disposition"] || "";
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
  if (match?.[1]) {
    const name = match[1].trim();
    try {
      return decodeURIComponent(name);
    } catch {
      return name;
    }
  }
  return fallback;
};