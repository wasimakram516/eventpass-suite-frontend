import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getUpcomingEventRegEvents = withApiHandler(async () => {
  const { data } = await api.get("/eventreg/events/upcoming");
  return data;
});

export const getUpcomingCheckInEvents = withApiHandler(async () => {
  const { data } = await api.get("/checkin/events/upcoming");
  return data;
});

export const lookupEventRegRegistration = withApiHandler(
  async (slug, fields, isoCode) => {
    const { data } = await api.post("/eventreg/registrations/lookup", {
      slug,
      fields,
      isoCode,
    });
    return data;
  },
);

export const lookupCheckInRegistration = withApiHandler(
  async (slug, fields, isoCode) => {
    const { data } = await api.post("/checkin/registrations/lookup", {
      slug,
      fields,
      isoCode,
    });
    return data;
  },
);
