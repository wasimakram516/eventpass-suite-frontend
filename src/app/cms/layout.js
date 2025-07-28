"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useEffect } from "react";
import LoadingState from "@/components/LoadingState";

export default function CmsLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      (!loading && !user) ||
      (user && user.role !== "admin" && user.role !== "business")
    ) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 40px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <LoadingState />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          pl: { xs: 2, sm: 3, md: "30px" },
          pr: { xs: 2, sm: 3, md: "30px" },
          pt: "50px",
          pb: { xs: 4, sm: 3, md: "20px" },
          minHeight: "calc(100vh - 40px)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
