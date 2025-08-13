"use client";

import Navbar from "@/components/Navbar";
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
    "/mosaicwall",
    "/eventreg",
    "/checkin",
    "/eventwheel",
    "/surveyguru",
  ];

  const hideNavbar = modulePrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Box sx={{ pt: hideNavbar ? 0 : 5 }}>{children}</Box>
    </>
  );
}
