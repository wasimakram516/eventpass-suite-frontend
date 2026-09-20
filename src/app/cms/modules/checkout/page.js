"use client";

import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";
import PermissionGuard from "@/components/PermissionGuard";
import { useHasPermission } from "@/hooks/usePermission";

const translations = {
  en: {
    title: "Checkout – Ticketed Events & Payments",
    features: [
      "Create ticketed events with ticket types, fees, and VAT.",
      "Manage payments, promo codes, and externally recorded payments.",
    ],
    ctaLabel: "Manage Ticketed Events",
  },
  ar: {
    title: "الدفع – الفعاليات المدفوعة والمدفوعات",
    features: [
      "أنشئ فعاليات مدفوعة مع أنواع التذاكر والرسوم وضريبة القيمة المضافة.",
      "أدر المدفوعات وأكواد الخصم والمدفوعات المسجلة خارجياً.",
    ],
    ctaLabel: "إدارة الفعاليات المدفوعة",
  },
};

export default function CheckoutHome() {
  const canViewPayments = useHasPermission("checkout", "view_payments");
  const landingTranslations = canViewPayments
    ? {
      en: {
        ...translations.en,
        secondaryCta: { label: "Payment Dashboard", href: "/cms/modules/checkout/payments" },
      },
      ar: {
        ...translations.ar,
        secondaryCta: { label: "لوحة المدفوعات", href: "/cms/modules/checkout/payments" },
      },
    }
    : translations;

  return (
    <PermissionGuard module="checkout">
      <ModuleLandingPage
        moduleIcon={ICONS.payment}
        ctaLabel={translations.en.ctaLabel}
        ctaHref="/cms/modules/checkout/events"
        translations={landingTranslations}
      />
    </PermissionGuard>
  );
}
