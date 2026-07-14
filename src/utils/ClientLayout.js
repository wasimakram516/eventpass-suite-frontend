"use client";

import Navbar from "@/components/nav/Navbar";
import FloatingColorModeToggle from "@/components/nav/FloatingColorModeToggle";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const modulePrefixes = [
    "/quiznest",
    "/votecast",
    "/stageq",
    "/eventduel",
    "/tapmatch",
    "/crosszero",
    "/memorywall",
    "/eventreg",
    "/checkin",
    "/eventwheel",
    "/surveyguru",
    "/digipass",
    "/event",
    "/en/event",
    "/ar/event",
  ];

  const hideNavbar = modulePrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  return (
    <>
      {!hideNavbar && <Navbar />}
      {hideNavbar && <FloatingColorModeToggle />}
      <Box sx={{ pt: hideNavbar ? 0 : 5 }}>{children}</Box>
    </>
  );
}