import handleError from "@/utils/errorHandler";

const withApiHandler = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (err) {
    handleError(err);
  }
};

export default withApiHandler;
