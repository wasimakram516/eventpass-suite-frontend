"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to Event Wheel",
    subtitle:
      "Create exciting spinning wheels for events and giveaways.",
    description:
      "This platform allows you to create spinning wheels with two setup options: 'Participant enter Names' or 'Admin Write Names'. Share wheel links via plain URL or QR code for easy access, with interactive spinning animation and random winner selection with celebration effects.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في Event Wheel",
    subtitle: "أنشئ عجلات دوارة مثيرة للفعاليات والهدايا.",
    description:
      "تتيح هذه المنصة إنشاء عجلات دوارة مع خيارين للإعداد: 'المشاركون يدخلون الأسماء' أو 'الإدارة تكتب الأسماء'. شارك روابط العجلة عبر الرابط المباشر أو رمز QR للوصول السهل، مع رسوم متحركة تفاعلية للدوران واختيار عشوائي للفائز مع تأثيرات احتفالية.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function EventWheelPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('trophy')}
    />
  );
}