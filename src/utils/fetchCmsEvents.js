// Events pages always load the selected business's complete list. Dashboard
// navigation uses ?search= to highlight one event without locking the page to
// a single-record response.
export async function fetchCmsEvents({
  businessSlug,
  getAllEventsByBusiness,
}) {
  if (!businessSlug) return { error: false, events: [], missingBusiness: true };

  const result = await getAllEventsByBusiness(businessSlug);
  return {
    error: Boolean(result?.error),
    events: result?.error ? [] : result?.events || [],
  };
}
