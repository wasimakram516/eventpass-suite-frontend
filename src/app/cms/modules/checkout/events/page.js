"use client";

import {
  EventsPage,
  eventTranslations,
} from "@/components/registration/EventsPage";
import {
  getAllCheckoutEventsByBusiness,
  getCheckoutEventBySlugForCms,
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
    viewRegs: "View Registrations",
    promoCodes: "Promo Codes",
    payments: "Payments",
  },
  ar: {
    ...eventTranslations.ar,
    pageTitle: "إدارة الفعاليات المدفوعة",
    pageDescription: "أنشئ وأدر الفعاليات المدفوعة وأنواع التذاكر والرسوم وضريبة القيمة المضافة.",
    createEvent: "إنشاء فعالية مدفوعة",
    viewRegs: "عرض التسجيلات",
    promoCodes: "رموز الخصم",
    payments: "المدفوعات",
  },
};

const checkoutEventService = {
  getAllEventsByBusiness: getAllCheckoutEventsByBusiness,
  getEventBySlugForCms: getCheckoutEventBySlugForCms,
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
        viewRouteSuffix="/registrations"
        showPromoCodes
        showPayments
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
