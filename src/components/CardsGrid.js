"use client";

import React from "react";
import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";

export default function CardsGrid({ media }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Ambient animated bg */}
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Shift />
      </Box>

      <Box
        maxWidth="xl"
        sx={{
          py: { xs: 2, md: 4 },
          px: { xs: 2, md: 4 },
          zIndex: 1,
          position: "relative",
        }}
      >
        <Grid container spacing={3}>
          {media.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 2,
                    boxShadow: 4,
                    borderRadius: 3,
                    backgroundColor: "#fff",
                  }}
                >
                  <Box
                    component="img"
                    src={item.imageUrl}
                    alt="Media"
                    sx={{
                      width: 200,
                      height: 200,
                      borderRadius: "50%",
                      objectFit: "cover",
                      mb: 2,
                      border: "4px solid #ccc",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  />
                  {item.text && (
                    <CardContent>
                      <Typography variant="body1" textAlign="center">
                        {item.text}
                      </Typography>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Branding overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <video
          src="/logoAnimation.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.1,
          }}
        />
      </Box>
    </Box>
  );
}
