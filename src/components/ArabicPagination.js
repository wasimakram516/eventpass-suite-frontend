"use client";

import { Pagination, PaginationItem } from "@mui/material";
import { useLanguage } from "@/contexts/LanguageContext";
import { toArabicDigits } from "@/utils/arabicDigits";

export default function ArabicPagination(props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <Pagination
      dir={isAr ? "rtl" : "ltr"}
      {...props}
      renderItem={(item) => {
        const isNav = ["previous", "next", "first", "last"].includes(item.type);
        return (
          <PaginationItem
            {...item}
            page={item.type === "page" && isAr ? toArabicDigits(item.page, language) : item.page}
            sx={{
              ...(isAr && isNav ? { "& .MuiSvgIcon-root": { transform: "scaleX(-1)" } } : {}),
              ...item.sx,
            }}
          />
        );
      }}
    />
  );
}
