"use client";

import { EventAvailable as EventIcon } from "@mui/icons-material";
import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Welcome to CheckIn",
    subtitle: "Employee Check-In Management System",
    description:
      "A comprehensive platform for managing employee check-ins and table assignments. Create and manage employee events, assign tables, and track attendance. Perfect for corporate events, dining experiences, and employee gatherings.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحباً بكم في تشيك إن",
    subtitle: "نظام إدارة تسجيل حضور الموظفين",
    description:
      "منصة شاملة لإدارة تسجيل حضور الموظفين وتخصيص الطاولات. قم بإنشاء وإدارة فعاليات الموظفين وتخصيص الطاولات وتتبع الحضور. مثالية للفعاليات المؤسسية وتجارب الطعام وتجمعات الموظفين.",
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
