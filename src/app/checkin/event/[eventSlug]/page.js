"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";

import { formatDate } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";
import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";

export default function EventDetails() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getCheckInEventBySlug(eventSlug);
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
        }}
      >
        <CircularProgress />
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
        }}
      >
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  const { name, venue, startDate, endDate, logoUrl } = event;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 700,
          width: "100%",
          textAlign: "center",
          borderRadius: 3,
          boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {logoUrl && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <img
              src={logoUrl}
              alt={`${name} Logo`}
              style={{
                width: "auto",
                height: "150px",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          </Box>
        )}

        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: { xs: 28, md: 36 },
            color: "primary.main",
            letterSpacing: "1.5px",
            mb: 2,
            animation: "fadeIn 1.2s ease-in-out",
            "@keyframes fadeIn": {
              "0%": { opacity: 0, transform: "translateY(-10px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          Welcome to {name}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
          mb={1}
        >
          <ICONS.location sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
            {venue}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
          mb={3}
        >
          <ICONS.event sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
            {startDate && endDate
              ? startDate === endDate
                ? formatDate(startDate)
                : `${formatDate(startDate)} – ${formatDate(endDate)}`
              : "Date not available"}
          </Typography>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: 14, md: 16 },
            color: "text.secondary",
            mb: 4,
          }}
        >
          Thank you for joining us! Please enter your Employee ID to get your
          table number.
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => router.replace(`/checkin/event/${eventSlug}/register`)}
          startIcon={<ICONS.diningTable />}
          sx={{
            maxWidth: { xs: "100%", sm: 300 },
            fontSize: { xs: 16, md: 18 },
            p: "12px",
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            background: "primary.main",
            transition: "0.3s",
            "&:hover": {
              background: "secondary.main",
              transform: "scale(1.05)",
            },
          }}
        >
          Get Your Table
        </Button>

        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          mt={3}
        >
          <ICONS.time fontSize="small" sx={{ color: "primary.main" }} />
          <Typography variant="caption" fontSize={14}>
            Takes only 5 seconds!
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
