"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuiznestCMSPage() {
  const router = useRouter();

  // ADDED: Fast, contentless redirect logic
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === "admin") {
            router.replace("/cms/modules/quiznest/businesses");
          } else if (user.role === "business" && user.businessSlug) {
            router.replace(
              `/cms/modules/quiznest/businesses/${user.businessSlug}/games`
            );
          }
        } catch (e) {
          // Optionally handle JSON parse error
        }
      }
    }
  }, [router]);

  // Renders nothing
  return null;
}
