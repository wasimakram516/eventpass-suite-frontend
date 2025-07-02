"use client";

import { Box, Divider, Typography } from "@mui/material";
import Image from "next/image";

export default function Footer() {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        bgcolor: "background.default",
        zIndex: 10,
        py: 1,
        px: 4,
        gap:2,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Typography gutterBottom variant="body1">
      Powered By
      </Typography>
      <Box sx={{ width: { xs: 35, sm: 40 } }}>
        <Image
          src="/WW.png"
          alt="WhiteWall Logo"
          width={100}
          height={30}
          style={{ width: "100%", height: "auto", objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}
