"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Container,
  Stack,
  Card,
} from "@mui/material";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DigiPassEventDetails() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getDigipassEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      } else {
        setError(result.message || "Event not found.");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "url('/bf-digiPass.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          backgroundImage: "url('/bf-digiPass.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Typography color="error" variant="h6" sx={{ color: "white" }}>
          {error}
        </Typography>
      </Box>
    );
  }

  const { logoUrl } = event;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 4, sm: 6, md: 8 },
        overflow: "hidden",
      }}
      dir={dir}
    >
      {/* Background Image */}
      <Box
        component="img"
        src="/bf-digiPass.png"
        alt="Background"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
      {/* Orange Circle - Top Right */}
      <Box
        component="img"
        src="/orangeCircle.png"
        alt="Orange Circle"
        sx={{
          position: "absolute",
          top: 0,
          right: "-19vw",
          width: "96%",
          height: "57%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        {/* Card */}
        <Card
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: 450, md: 500 },
            minHeight: { xs: 500, sm: 600, md: 700 },
            backgroundColor: "#0B1E3D",
            borderRadius: { xs: 3, sm: 4 },
            p: { xs: 4, sm: 5, md: 6 },
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 3, sm: 4, md: 5 },
          }}
        >
          {/* Event Logo */}
          {logoUrl && (
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: 220, sm: 280, md: 350 },
                height: "auto",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={logoUrl}
                alt="Event Logo"
                sx={{
                  width: "100%",
                  height: "auto",
                  maxHeight: { xs: 150, sm: 200, md: 250 },
                  objectFit: "cover",
                }}
              />
            </Box>
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              width: "100%",
              mt: { xs: 2, sm: 3 },
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ICONS.register />}
              onClick={() => {
                router.push(`/digipass/${eventSlug}/register`);
              }}
              sx={{
                flex: { sm: 1 },
                borderColor: "white",
                color: "white",
                "&:hover": {
                  borderWidth: 2,
                  borderColor: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Register
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ICONS.login />}
              onClick={() => {
                router.push(`/digipass/${eventSlug}/signin`);
              }}
              sx={{
                flex: { sm: 1 },
                borderColor: "white",
                color: "white",
                "&:hover": {
                  borderWidth: 2,
                  borderColor: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Sign in
            </Button>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
