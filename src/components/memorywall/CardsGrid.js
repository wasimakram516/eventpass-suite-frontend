"use client";

import React, { useRef, useState, useEffect } from "react";
import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";

export default function CardsGrid({ media, background, backgroundLogo, randomSizes }) {
  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const [visibleCount, setVisibleCount] = useState(media.length);

  // Pre-generate stable zoom values per card so they don't re-randomise on every render
  const zoomValues = useRef({});
  useEffect(() => {
    if (randomSizes?.enabled) {
      media.forEach((item) => {
        if (!zoomValues.current[item._id]) {
          zoomValues.current[item._id] = 0.8 + Math.random() * 0.4;
        }
      });
    }
  }, [media, randomSizes]);

  useEffect(() => {
    if (!containerRef.current) return;

    const calculate = () => {
      const containerRect = containerRef.current.getBoundingClientRect();
      const style = window.getComputedStyle(containerRef.current);
      const paddingBottom = parseFloat(style.paddingBottom) || 0;
      const maxBottom = containerRect.top + containerRect.height - paddingBottom;

      let count = 0;
      for (let i = 0; i < media.length; i++) {
        const el = cardRefs.current[media[i]._id];
        if (!el) continue;
        const elRect = el.getBoundingClientRect();
        if (elRect.bottom <= maxBottom) {
          count = i + 1;
        } else {
          break;
        }
      }

      setVisibleCount(count > 0 ? count : media.length);
    };

    const timer = setTimeout(calculate, 100);
    window.addEventListener("resize", calculate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculate);
    };
  }, [media, randomSizes]);

  const renderBackground = () => {
    if (background?.type === 'video' && background.value) {
      return (
        <video
          autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        >
          <source src={background.value} />
        </video>
      );
    } else if (background?.type === 'image' && background.value) {
      return (
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: `url(${background.value})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", zIndex: 0 }} />
      );
    } else {
      return <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}><Shift /></Box>;
    }
  };

  const renderBackgroundLogo = () => {
    if (!backgroundLogo?.enabled || !backgroundLogo?.imageUrl) return null;
    const positionStyles = {
      center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      "top-left": { top: "5%", left: "5%" },
      "top-right": { top: "5%", right: "5%" },
      "bottom-left": { bottom: "5%", left: "5%" },
      "bottom-right": { bottom: "5%", right: "5%" },
    };
    const isVideo = backgroundLogo.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i);
    return (
      <Box
        sx={{
  position: "absolute",
  inset: 0,
  zIndex: 5,
  pointerEvents: "none",
  opacity: 0.2,
}}
      >
        {isVideo ? (
          <video autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}>
            <source src={backgroundLogo.imageUrl} />
          </video>
        ) : (
          <img src={backgroundLogo.imageUrl} alt="Background Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {renderBackground()}
      {renderBackgroundLogo()}

      <Box
        ref={containerRef}
        maxWidth="xl"
        sx={{
          py: { xs: 2, md: 4 },
          px: { xs: 2, md: 4 },
          zIndex: 1,
          position: "relative",
          height: "100vh",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Grid container spacing={3}>
          {media.map((item, index) => {
            const getCardSize = () => {
              if (randomSizes?.enabled && randomSizes.min && randomSizes.max) {
                const baseSize = 146;
                const sizeVariation = randomSizes.min + Math.random() * (randomSizes.max - randomSizes.min);
                const scaleFactor = 0.6 + (sizeVariation / 300) * 0.8;
                return Math.round(baseSize * scaleFactor);
              }
              return 146;
            };

            const cardImageSize = getCardSize();
            const isVisible = index < visibleCount;
            // zoom affects layout size (unlike transform:scale which doesn't)
            const zoom = randomSizes?.enabled ? (zoomValues.current[item._id] || 1) : 1;

            return (
              <Grid
                item xs={12} sm={6} md={4}
                key={item._id}
                ref={(el) => { cardRefs.current[item._id] = el; }}
                sx={{ visibility: isVisible ? "visible" : "hidden" }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: isVisible ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <Card
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      p: 2,
                      boxShadow: randomSizes?.enabled ? 6 : 4,
                      borderRadius: randomSizes?.enabled ? 4 : 3,
                      backgroundColor: "#fff",
                      // zoom instead of transform:scale — actually expands/shrinks layout space
                      zoom: zoom,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Box
                      component="img"
                      src={item.imageUrl}
                      alt="Media"
                      sx={{
                        width: cardImageSize,
                        height: cardImageSize,
                        borderRadius: "50%",
                        objectFit: "cover",
                        mb: 2,
                        border: randomSizes?.enabled ? "6px solid #ddd" : "4px solid #ccc",
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    />
                    {item.text && (
                      <CardContent>
                        <Typography variant="body1" textAlign="center">{item.text}</Typography>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}