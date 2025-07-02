"use client";

import React from "react";
import { Grid, Paper, Typography, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";

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

  return (
    <Grid
      item
      xs={12}
      sm={6}
      md={4}
      sx={{ display: "flex", justifyContent: "center" }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          my: 4,
          textAlign: "center",
          borderRadius: 2,
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          maxWidth: 300,
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <div>
          {icon &&
            React.cloneElement(icon, {
              sx: { fontSize: 50, color, mb: 2 },
            })}
          <Typography variant="h6" sx={{ fontWeight: "bold", color, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "#555" }}>
            {description}
          </Typography>
        </div>
        {buttonLabel && (
          <Button
            variant="contained"
            size="large"
            sx={{ backgroundColor: color, color: "#fff", mt: 2 }}
            onClick={() => router.push(route)}
          >
            {buttonLabel}
          </Button>
        )}
        {/* Action buttons (edit, delete, view, etc.) */}
        {actions && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            {actions}
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

export default DashboardCard;
