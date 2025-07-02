"use client";

import Navbar from "@/components/Navbar";
import { Box } from "@mui/material";
import { useParams, usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { businessSlug } = useParams();

  const hideNavbar =
    pathname.startsWith(`/polls/${businessSlug}/results`) ||
    pathname.startsWith(`/queries/${businessSlug}/display`) ||
    pathname.startsWith(`/queries/${businessSlug}/qr`) ||
    pathname.startsWith(`/queries/${businessSlug}/ask`);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Box sx={{ pt: hideNavbar ? 0 : 5 }}>{children}</Box>
    </>
  );
}
