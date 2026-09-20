"use client";

import {
  EventsPage,
  eventTranslations,
} from "@/components/registration/EventsPage";
import {
  getAllCheckoutEventsByBusiness,
  createCheckoutEvent,
  updateCheckoutEvent,
  deleteCheckoutEvent,
  cloneCheckoutEvent,
} from "@/services/checkout/eventService";
import PermissionGuard from "@/components/PermissionGuard";

const checkoutTranslations = {
  en: {
    ...eventTranslations.en,
    pageTitle: "Manage Ticketed Events",
    pageDescription: "Create and manage paid events, ticket types, fees, and VAT.",
    createEvent: "Create Ticketed Event",
    viewRegs: "Manage checkout",
  },
  ar: {
    ...eventTranslations.ar,
    pageTitle: "إدارة الفعاليات المدفوعة",
    pageDescription: "أنشئ وأدر الفعاليات المدفوعة وأنواع التذاكر والرسوم وضريبة القيمة المضافة.",
    createEvent: "إنشاء فعالية مدفوعة",
    viewRegs: "إدارة الدفع",
  },
};

const checkoutEventService = {
  getAllEventsByBusiness: getAllCheckoutEventsByBusiness,
  createEvent: createCheckoutEvent,
  updateEvent: updateCheckoutEvent,
  deleteEvent: deleteCheckoutEvent,
  cloneEvent: cloneCheckoutEvent,
};

export default function CheckoutEventsPage() {
  return (
    <PermissionGuard module="checkout">
      <EventsPage
        moduleKey="checkout"
        eventService={checkoutEventService}
        routeBase="/cms/modules/checkout/events"
        forcePaid
        showEventLinks
        viewRouteSuffix=""
        getPublicEventUrl={(event) =>
          `/checkout/${event.defaultLanguage || "en"}/event/${event.slug}`
        }
        // Keep Insights out of Checkout for now. The existing insight reports
        // are registration/check-in analytics under EventReg and do not yet
        // provide payment-specific reporting; Checkout has its own payments
        // dashboard instead.
        showInsights={false}
        translations={checkoutTranslations}
      />
    </PermissionGuard>
  );
}
