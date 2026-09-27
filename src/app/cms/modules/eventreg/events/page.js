"use client";

import { EventsPage } from "@/components/registration/EventsPage";
import {
  getAllPublicEventsByBusiness,
  getPublicEventBySlugForCms,
  createPublicEvent,
  updatePublicEvent,
  deletePublicEvent,
  clonePublicEvent,
} from "@/services/eventreg/eventService";

const eventService = {
  getAllEventsByBusiness: getAllPublicEventsByBusiness,
  getEventBySlugForCms: getPublicEventBySlugForCms,
  createEvent: createPublicEvent,
  updateEvent: updatePublicEvent,
  deleteEvent: deletePublicEvent,
  cloneEvent: clonePublicEvent,
};

export default function EventRegEventsPage() {
  return <EventsPage moduleKey="eventreg" eventService={eventService} routeBase="/cms/modules/eventreg/events" />;
}
