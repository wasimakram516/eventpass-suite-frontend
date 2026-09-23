// Resolves the Events-page data source consistently. A dashboard deep link
// uses the protected CMS lookup; a normal Events page uses the business list.
export async function fetchCmsEvents({
  eventSlug,
  businessSlug,
  getEventBySlugForCms,
  getAllEventsByBusiness,
}) {
  if (eventSlug) {
    const result = await getEventBySlugForCms(eventSlug);
    return {
      error: Boolean(result?.error),
      events: result?.error || !result ? [] : [result],
    };
  }

  if (!businessSlug) return { error: false, events: [], missingBusiness: true };

  const result = await getAllEventsByBusiness(businessSlug);
  return {
    error: Boolean(result?.error),
    events: result?.error ? [] : result?.events || [],
  };
}
