"use client";

import { EventsPage } from "@/components/registration/EventsPage";
import {
  getAllPublicEventsByBusiness,
  createPublicEvent,
  updatePublicEvent,
  deletePublicEvent,
  clonePublicEvent,
} from "@/services/eventreg/eventService";

const eventService = {
  getAllEventsByBusiness: getAllPublicEventsByBusiness,
  createEvent: createPublicEvent,
  updateEvent: updatePublicEvent,
  deleteEvent: deletePublicEvent,
  cloneEvent: clonePublicEvent,
};

export default function EventRegEventsPage() {
  return <EventsPage moduleKey="eventreg" eventService={eventService} routeBase="/cms/modules/eventreg/events" />;
}
