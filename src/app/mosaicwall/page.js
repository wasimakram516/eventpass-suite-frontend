"use client";

import { Wallpaper as WallpaperIcon } from "@mui/icons-material";
import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Welcome to Mosaic Wall",
    subtitle:
      "Share your moments on interactive display walls for events and businesses.",
    description:
      "Upload your photos to be displayed on big screens in card or mosaic mode. Your images will be showcased on interactive display walls at events and venues. Simply scan a QR code or visit a wall link to start sharing your moments.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في جدار الفسيفساء",
    subtitle: "شارك لحظاتك على جدران العرض التفاعلية للفعاليات والشركات.",
    description:
      "ارفع صورك ليتم عرضها على الشاشات الكبيرة في وضع البطاقة أو الفسيفساء. ستتم عرض صورك على جدران العرض التفاعلية في الفعاليات والأماكن. ما عليك سوى مسح رمز QR أو زيارة رابط الجدار لبدء مشاركة لحظاتك.",
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
      moduleIcon={WallpaperIcon}
    />
  );
}
