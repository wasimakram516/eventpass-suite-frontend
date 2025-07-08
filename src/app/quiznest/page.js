"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuiznestPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/quiznest/game");
  }, [router]);
  return null;
}
