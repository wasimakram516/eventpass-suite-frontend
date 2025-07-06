"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function QuiznestCMSPage() {
  const router = useRouter();
  const { user } = useAuth(); // use user stored in context

  useEffect(() => {
    router.replace("/cms/modules/quiznest/games");
  }, [router]);
  return null;
}
