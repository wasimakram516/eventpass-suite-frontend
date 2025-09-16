"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to CheckIn",
    subtitle:
      "Streamline employee event check-ins with digital solutions.",
    description:
      "This platform enables you to create private check-in events for your employees. Generate links or QR codes for easy check-in, and display table numbers and locations instantly after employees enter their Employee ID.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في CheckIn",
    subtitle: "بسط تسجيل حضور موظفي الفعاليات بالحلول الرقمية.",
    description:
      "تتيح هذه المنصة إنشاء فعاليات تسجيل حضور خاصة بالموظفين. أنشئ روابط أو رموز QR لتسجيل الحضور السهل، واعرض أرقام الطاولات والمواقع فورًا بعد إدخال الموظفين لرقم الموظف.",
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