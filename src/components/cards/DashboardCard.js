"use client";

import React from "react";
import { Typography, Button, Box, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import AppCard from "@/components/cards/AppCard";

const DashboardCard = ({
  title,
  description,
  buttonLabel,
  icon,
  color,
  route,
  actions,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const resolvedColor = color || theme.palette.primary.main;

  return (
      <AppCard
        sx={{
          p: 3,
          my: 2,
          alignItems: "center",
          textAlign: "center",
          justifyContent: "space-between",
          minHeight: { xs: "auto", sm: 280, md: 300 },
          width: { xs: "100%", sm: 300 },
        }}
      >
        {icon && (
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: `${resolvedColor}1A`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            {React.cloneElement(icon, {
              sx: { fontSize: 36, color: resolvedColor },
            })}
          </Box>
        )}

        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: resolvedColor,
            mb: 1,
            lineHeight: 1.3
          }}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 3,
            color: "text.secondary",
            minHeight: { xs: "auto", sm: 48 },
            px: 1,
          }}
        >
          {description}
        </Typography>

        {buttonLabel && (
          <Button
            variant="contained"
            size="medium"
            sx={{
              backgroundColor: resolvedColor,
              color: theme.palette.getContrastText(resolvedColor),
              textTransform: "none",
              fontWeight: "bold",
              px: 3,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: resolvedColor,
                opacity: 0.9,
              },
            }}
            onClick={() => router.push(route)}
          >
            {buttonLabel}
          </Button>
        )}

        {actions && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1.5,
              mt: buttonLabel ? 2 : 0,
            }}
          >
            {actions}
          </Box>
        )}
      </AppCard>
  );
};

export default DashboardCard;