"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function QuiznestCMSPage() {
  const router = useRouter();
  const { user } = useAuth(); // use user stored in context

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user.role === "admin") {
        router.replace("/cms/modules/quiznest/businesses");
      } else if (user.role === "business" && user.businessSlug) {
        router.replace(
          `/cms/modules/quiznest/businesses/${user.businessSlug}/games`
        );
      }
    }
  }, [router]);
  return null;
}
