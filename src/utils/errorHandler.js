const handleError = (err) => {
  throw err?.response?.data?.message || err?.response?.data?.data || err?.message || "An unknown error occurred";
};

export default handleError;
