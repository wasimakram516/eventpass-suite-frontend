"use client";

import React from "react";
import { Paper } from "@mui/material";

const AppCard = ({ children, sx, ...props }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default AppCard;
