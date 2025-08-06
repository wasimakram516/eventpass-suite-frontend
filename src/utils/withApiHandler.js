import { showGlobalMessage } from "@/contexts/MessageContext";

const withApiHandler = (fn, { showSuccess = false } = {}) => async (...args) => {
  try {
    const response = await fn(...args);

    if (response?.success === false) {
      showGlobalMessage(response.message || "Something went wrong", "error");
      return { error: true, message: response.message };
    }

    if (showSuccess && response?.message) {
      showGlobalMessage(response.message, "success");
    }

    if (response.success && response.data !== null) {
      return response.data;
    }

    return null;
  } catch (err) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "An unknown error occurred";

    showGlobalMessage(message, "error");
    return { error: true, message };
  }
};

export default withApiHandler;
