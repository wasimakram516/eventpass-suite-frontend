"use client";

import { useEffect } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";

// Keeps historical module-root URLs valid while removing the redundant landing
// screen between a module card and the page where users do their work.
export default function ModuleWorkingRedirect({ href }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return <Box sx={{ py: 8 }}><LoadingState /></Box>;
}
