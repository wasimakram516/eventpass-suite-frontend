"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to SurveyGuru",
    subtitle:
      "Send thank-you emails and surveys to event attendees.",
    description:
      "This platform allows you to send thank-you emails to all attendees of a specific event. You can perform dry-run previews and test emails before sending, with role-guarded actions available for admins and business users only.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في SurveyGuru",
    subtitle: "أرسل رسائل شكر واستبيانات لحضور الفعاليات.",
    description:
      "تتيح هذه المنصة إرسال رسائل شكر لجميع حضور فعالية محددة. يمكنك إجراء معاينة تجريبية واختبار الرسائل قبل الإرسال، مع إجراءات محمية بالصلاحيات متاحة للمسؤولين وأصحاب الأعمال فقط.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function SurveyGuruPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('email')}
    />
  );
}
