// src/app/polls/[businessSlug]/page.js
"use client";

import { useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";

export default function BusinessPollsIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { businessSlug } = useParams();

  useEffect(() => {
    // Redirect only if the path is exactly /polls/[businessSlug]
    if (
      businessSlug &&
      pathname === `/polls/${businessSlug}`
    ) {
      router.replace(`/polls/${businessSlug}/vote`);
    }
  }, [businessSlug, pathname, router]);


  return null;
}
