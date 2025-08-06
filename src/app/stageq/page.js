"use client";

import { QrCode as QrCodeIcon } from "@mui/icons-material";
import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Welcome to StageQ",
    subtitle:
      "A comprehensive platform for managing business interactions and visitor engagement.",
    description:
      "This platform enables businesses to share QR code links, manage visitor submissions, and review questions. Track visitor engagement and streamline your business communication process.",
    adminLogin: "Business Login",
  },
  ar: {
    title: "مرحبًا بكم في ستاج كيو",
    subtitle: "منصة شاملة لإدارة التفاعلات التجارية ومشاركة الزوار.",
    description:
      "تمكّن هذه المنصة الشركات من مشاركة روابط رمز QR وإدارة طلبات الزوار ومراجعة الأسئلة. تتبع مشاركة الزوار وتبسيط عملية التواصل التجاري.",
    adminLogin: "تسجيل دخول الشركة",
  },
};

export default function HomePage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={QrCodeIcon}
    />
  );
}
