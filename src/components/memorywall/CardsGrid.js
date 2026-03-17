"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";

function hashString(value) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDeterministicImageSize(itemId, randomSizes) {
  const baseSize = 146;

  if (!randomSizes?.enabled) {
    return Math.round(baseSize * 0.8);
  }

  const min = Number(randomSizes?.min) || 150;
  const max = Number(randomSizes?.max) || 300;
  const normalized = (hashString(itemId) % 1000) / 999;
  const varied = Math.round(min + (max - min) * normalized);

  return Math.round(varied * 0.8);
}

function buildSequentialSlots(width, height, cardWidth, cardHeight, gap = 16) {
  const cols = Math.max(1, Math.floor((width + gap) / (cardWidth + gap)));
  const rows = Math.max(1, Math.floor((height + gap) / (cardHeight + gap)));

  const slots = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = c * (cardWidth + gap);
      const y = r * (cardHeight + gap);

      // Strict bounds: ensure card bottom/right stays within viewport
      const boundedX = Math.min(width - cardWidth, Math.max(0, x));
      const boundedY = Math.min(height - cardHeight, Math.max(0, y));

      // Skip if card would overflow
      if (boundedX + cardWidth > width + 1 || boundedY + cardHeight > height + 1) {
        continue;
      }

      slots.push({
        x: boundedX,
        y: boundedY,
      });
    }
  }
  return slots;
}

function buildRandomSlots(width, height, cardWidth, cardHeight, gap = 16) {
  const sequential = buildSequentialSlots(width, height, cardWidth, cardHeight, gap);
  const used = new Set();
  const slots = [];

  for (let i = 0; i < sequential.length; i += 1) {
    let idx = Math.floor(Math.random() * sequential.length);
    while (used.has(idx) && used.size < sequential.length) {
      idx = Math.floor(Math.random() * sequential.length);
    }
    used.add(idx);

    const base = sequential[idx];
    slots.push({
      x: base.x,
      y: base.y,
    });
  }

  return slots;
}

function getOldestSlotIndex(slotMedia, usedInBatch) {
  let oldestIdx = -1;
  let oldestTs = Number.POSITIVE_INFINITY;

  for (let i = 0; i < slotMedia.length; i += 1) {
    if (usedInBatch.has(i) || !slotMedia[i]) continue;
    const ts = Date.parse(slotMedia[i].createdAt || "") || 0;
    if (ts < oldestTs) {
      oldestTs = ts;
      oldestIdx = i;
    }
  }

  return oldestIdx >= 0 ? oldestIdx : 0;
}

function MediaCard({ item, isSignatureMode, imageSize, randomSizes }) {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 1.25,
        boxShadow: randomSizes?.enabled ? 6 : 4,
        borderRadius: randomSizes?.enabled ? 4 : 3,
        backgroundColor: "#fff",
        transition: "all 0.3s ease",
      }}
    >
      <Box
        component="img"
        src={item.imageUrl}
        alt="Media"
        sx={{
          width: imageSize,
          height: imageSize,
          borderRadius: "50%",
          objectFit: "cover",
          mb: 2,
          border: randomSizes?.enabled ? "6px solid #ddd" : "4px solid #ccc",
          transition: "transform 0.3s ease",
          "&:hover": { transform: "scale(1.05)" },
        }}
      />
      {isSignatureMode ? (
        <CardContent sx={{ pt: 0.5, width: "100%", pb: 0.5 }}>
          {item.signatureUrl ? (
            <Box
              component="img"
              src={item.signatureUrl}
              alt="Signature"
              sx={{
                width: "82%",
                maxWidth: 140,
                maxHeight: 58,
                mx: "auto",
                objectFit: "contain",
              }}
            />
          ) : null}
        </CardContent>
      ) : item.text ? (
        <CardContent>
          <Typography variant="body1" textAlign="center">
            {item.text}
          </Typography>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function CardsGrid({ media, background, backgroundLogo, randomSizes, cardOrder = "sequential", inputType = "text" }) {
  const containerRef = useRef(null);
  const prevMediaIdsRef = useRef([]);

  const normalizedCardOrder = String(cardOrder || "sequential").toLowerCase();
  const isRandomLayout = normalizedCardOrder === "random";
  const isSignatureMode = inputType === "signature";

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [slots, setSlots] = useState([]);
  const [slotMedia, setSlotMedia] = useState([]);
  const [slotVersions, setSlotVersions] = useState([]);
  const boundaryInset = { xs: 1.5, md: 2.5 };

  const layoutImageSize = useMemo(
    () => Math.round(146 * 0.8),
    []
  );

  const layoutCardWidth = useMemo(() => layoutImageSize + 64, [layoutImageSize]);
  const layoutCardHeight = useMemo(
    () => layoutImageSize + 100,
    [layoutImageSize]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!containerSize.width || !containerSize.height) return;

    const slotBuilder = isRandomLayout ? buildRandomSlots : buildSequentialSlots;
    const newSlots = slotBuilder(
      containerSize.width,
      containerSize.height,
      layoutCardWidth,
      layoutCardHeight,
      16
    );

    setSlots(newSlots);
    setSlotMedia(Array(newSlots.length).fill(null));
    setSlotVersions(Array(newSlots.length).fill(0));
    prevMediaIdsRef.current = [];
  }, [containerSize, layoutCardWidth, layoutCardHeight, isRandomLayout]);

  useEffect(() => {
    if (!slots.length) return;

    if (!isRandomLayout) {
      const latest = media.slice(0, slots.length);
      const nextSlotMedia = Array(slots.length).fill(null);
      const nextVersions = [...slotVersions];
      let mediaChanged = false;
      let versionsChanged = false;

      for (let i = 0; i < slots.length; i += 1) {
        const nextItem = latest[i] || null;
        const prevItem = slotMedia[i] || null;

        nextSlotMedia[i] = nextItem;
        if (nextItem?._id !== prevItem?._id) {
          mediaChanged = true;
        }

        if (nextItem?._id !== prevItem?._id) {
          nextVersions[i] = (nextVersions[i] || 0) + 1;
          versionsChanged = true;
        }
      }

      if (mediaChanged) {
        setSlotMedia(nextSlotMedia);
      }
      if (versionsChanged) {
        setSlotVersions(nextVersions);
      }
      prevMediaIdsRef.current = media.map((m) => m._id);
      return;
    }

    const prevIds = new Set(prevMediaIdsRef.current);
    const newItems = media.filter((m) => !prevIds.has(m._id));

    if (!newItems.length) {
      if (media.length !== prevMediaIdsRef.current.length) {
        const latest = media.slice(0, slots.length);
        const nextSlotMedia = Array(slots.length).fill(null);
        const nextVersions = Array(slots.length).fill(0);
        const used = new Set();

        latest.forEach((item) => {
          let idx = Math.floor(Math.random() * slots.length);
          while (used.has(idx) && used.size < slots.length) {
            idx = Math.floor(Math.random() * slots.length);
          }

          used.add(idx);
          nextSlotMedia[idx] = item;
          nextVersions[idx] = 1;
        });

        setSlotMedia(nextSlotMedia);
        setSlotVersions(nextVersions);
      }

      prevMediaIdsRef.current = media.map((m) => m._id);
      return;
    }

    let nextSlotMedia = [...slotMedia];
    let nextVersions = [...slotVersions];
    const usedInBatch = new Set();

    newItems.forEach((item) => {
      const emptySlots = [];
      for (let i = 0; i < slots.length; i += 1) {
        if (!nextSlotMedia[i] && !usedInBatch.has(i)) {
          emptySlots.push(i);
        }
      }

      let targetIdx;
      if (emptySlots.length) {
        targetIdx = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      } else {
        targetIdx = getOldestSlotIndex(nextSlotMedia, usedInBatch);
      }

      usedInBatch.add(targetIdx);
      nextSlotMedia[targetIdx] = item;
      nextVersions[targetIdx] = (nextVersions[targetIdx] || 0) + 1;
    });

    setSlotMedia(nextSlotMedia);
    setSlotVersions(nextVersions);
    prevMediaIdsRef.current = media.map((m) => m._id);
  }, [media, slots, isRandomLayout]);

  const renderBackground = () => {
    if (background?.type === "video" && background.value) {
      return (
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        >
          <source src={background.value} />
        </video>
      );
    }

    if (background?.type === "image" && background.value) {
      return (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${background.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
          }}
        />
      );
    }

    return (
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Shift />
      </Box>
    );
  };

  const renderBackgroundLogo = () => {
    if (!backgroundLogo?.enabled || !backgroundLogo?.imageUrl) return null;
    const isVideo = backgroundLogo.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i);
    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: 0.5,
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
        sx={{
          zIndex: 10,
          position: "absolute",
          inset: boundaryInset,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          {slotMedia.map((item, idx) => {
            if (!item || !slots[idx]) return null;

            const imageSize = getDeterministicImageSize(
              item._id,
              randomSizes
            );

            return (
              <Box
                key={`${item._id}-${slotVersions[idx]}`}
                sx={{
                  position: "absolute",
                  left: slots[idx].x,
                  top: slots[idx].y,
                  width: layoutCardWidth,
                  height: layoutCardHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <MediaCard
                    item={item}
                    isSignatureMode={isSignatureMode}
                    imageSize={imageSize}
                    randomSizes={randomSizes}
                  />
                </motion.div>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}