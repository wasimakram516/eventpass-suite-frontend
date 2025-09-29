"use client";

import React from "react";
import { Grid, Typography, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import AppCard from "@/components/cards/AppCard";

const DashboardCard = ({
  title,
  description,
  buttonLabel,
  icon,
  color = "#1976d2",
  route,
  actions,
}) => {
  const router = useRouter();

  return (
    <Grid item xs={12} sm={6} md={4} display="flex" justifyContent="center">
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
        {/* Icon with highlight */}
        {icon && (
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: `${color}1A`, // soft tinted bg
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            {React.cloneElement(icon, {
              sx: { fontSize: 36, color },
            })}
          </Box>
        )}

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ color, mb: 1, lineHeight: 1.3 }}
        >
          {title}
        </Typography>

        {/* Description */}
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

        {/* Primary Button */}
        {buttonLabel && (
          <Button
            variant="contained"
            size="medium"
            sx={{
              backgroundColor: color,
              color: "#fff",
              textTransform: "none",
              fontWeight: "bold",
              px: 3,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: color,
                opacity: 0.9,
              },
            }}
            onClick={() => router.push(route)}
          >
            {buttonLabel}
          </Button>
        )}

        {/* Extra Actions */}
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
    </Grid>
  );
};

export default DashboardCard;
