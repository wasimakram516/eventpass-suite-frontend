"use client";

import { EventAvailable as EventIcon } from "@mui/icons-material";
import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Welcome to EventReg",
    subtitle: "Streamlined Event Registration Management",
    description:
      "A comprehensive platform for managing event registrations. Create and manage public events and handle registrations. Perfect for conferences, workshops, and corporate events.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحباً بكم في إيفنت ريج",
    subtitle: "إدارة تسجيل الفعاليات بشكل مبسط",
    description:
      "منصة شاملة لإدارة تسجيلات الفعاليات. قم بإنشاء وإدارة الفعاليات العامة والتحكم في التسجيلات. مثالية للمؤتمرات وورش العمل والفعاليات المؤسسية.",
    adminLogin: "تسجيل دخول المسؤول",
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
      moduleIcon={EventIcon}
    />
  );
}
