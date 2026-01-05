"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to CheckIn",
    subtitle:
      "Track and verify guest attendance with digital check-in solutions.",
    description:
      "This platform enables you to create check-in events for your guests and attendees. Build custom registration forms, generate links or QR codes for easy check-in, and track attendance in real-time. Verify entries and manage guest check-ins efficiently.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في CheckIn",
    subtitle: "تتبع وتأكيد دخول الضيوف بالحلول الرقمية لتسجيل الحضور.",
    description:
      "تتيح هذه المنصة إنشاء فعاليات تسجيل حضور للضيوف والحضور. أنشئ نماذج تسجيل مخصصة، واعرض روابط أو رموز QR لتسجيل الحضور السهل، وتتبع الحضور في الوقت الفعلي. تحقق من الدخول وأدر تسجيل حضور الضيوف بكفاءة.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function CheckInPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('checkin')}
    />
  );
}