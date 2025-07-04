"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VoteCastCMSPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cms/modules/votecast/polls");
  }, [router]);

  return null;
}
