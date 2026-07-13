import { showGlobalMessage } from "@/contexts/MessageContext";

const withApiHandler = (fn, { showSuccess = false } = {}) => async (...args) => {
  try {
    const response = await fn(...args);

    if (response?.success === false) {
      showGlobalMessage(response.message || "Something went wrong", "error");
      return { error: true, message: response.message, ...(response.data || {}) };
    }

    if (showSuccess && response?.message) {
      showGlobalMessage(response.message, "success");
    }

    return response.data ?? response;

  } catch (err) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "An unknown error occurred";
    // Structured data (e.g. `conflictReason`) alongside the error, so callers
    // can render their own localized copy instead of the raw backend message.
    const data = err?.response?.data?.data || {};

    showGlobalMessage(message, "error");
    return { error: true, message, ...data };
  }
};

export default withApiHandler;
