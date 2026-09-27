"use client";

import { Button } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const labelForPath = (pathname, language) => {
  const arabic = language === "ar";
  if (pathname.includes("/registrations")) return arabic ? "عرض كل التسجيلات" : "Show all registrations";
  if (pathname.includes("/promo-codes")) return arabic ? "عرض كل رموز الخصم" : "Show all promo codes";
  if (pathname.includes("/events")) return arabic ? "عرض كل الفعاليات" : "Show all events";
  if (pathname.includes("/wheels")) return arabic ? "عرض كل العجلات" : "Show all wheels";
  if (pathname.includes("/walls")) return arabic ? "عرض كل الجدران" : "Show all walls";
  if (pathname.includes("/games")) return arabic ? "عرض كل الألعاب" : "Show all games";
  if (pathname.includes("/sessions")) return arabic ? "عرض كل الجلسات" : "Show all sessions";
  if (pathname.includes("/questions")) return arabic ? "عرض كل الأسئلة" : "Show all questions";
  if (pathname.includes("/polls")) return arabic ? "عرض كل الاستفتاءات" : "Show all polls";
  if (pathname.includes("/surveys/forms")) return arabic ? "عرض كل الاستبيانات" : "Show all surveys";
  if (pathname.includes("/surveys/recipients")) return arabic ? "عرض كل المستلمين" : "Show all recipients";
  if (pathname.includes("/users")) return arabic ? "عرض كل المستخدمين" : "Show all users";
  if (pathname.includes("/whatsapp-templates")) return arabic ? "عرض كل القوالب" : "Show all templates";
  return arabic ? "عرض كل السجلات" : "Show all records";
};

// Audit Logs links use ?search= to focus a record.
export default function AuditSearchClearButton({
  visible,
  onClear,
  label,
  paramsToClear = ["search"],
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage() || {};

  const hasSearch = Boolean(searchParams.get("search"));
  if (!(visible ?? hasSearch)) return null;

  const handleShowAll = () => {
    onClear?.();

    const params = new URLSearchParams(searchParams.toString());
    paramsToClear.forEach((param) => params.delete(param));
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <Button size="small" variant="outlined" onClick={handleShowAll} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
      {label || labelForPath(pathname, language)}
    </Button>
  );
}
