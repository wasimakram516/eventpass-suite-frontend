"use client";

import React from "react";
import { Box, Paper } from "@mui/material";
import { wrapTextBox } from "@/utils/wrapTextStyles";

const AppCard = ({ children, sx, ...props }) => {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[2],
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        ...wrapTextBox,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[6],
        },
        ...sx,
      })}
      {...props}
    >
      {children}
    </Paper>
  );
};

export const AppCardText = ({ sx, ...props }) => (
  <Box
    sx={{
      minWidth: 0,
      ...wrapTextBox,
      ...sx,
    }}
    {...props}
  />
);

export default AppCard;
