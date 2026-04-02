"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";

const COLOR_PALETTE = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", 
  "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50"
];

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

function MediaCard({ 
  item, 
  isSignatureMode, 
  imageSize, 
  randomSizes, 
  backgroundLogo, 
  backgroundColor, 
  randomColors, 
  imageShape = "circle",
  mediaType2TextColor,
  mediaType2SignatureColor
}) {
  const cardBgColor = useMemo(() => {
    if (randomColors) {
      const hue = hashString(item._id) % 360;
      return `hsl(${hue}, 80%, 75%)`;
    }
    return backgroundColor || "#ffffff";
  }, [item._id, randomColors, backgroundColor]);

  const isFull = imageShape === "full";
  const isTop70 = imageShape === "top-70";
  const isCircle = imageShape === "circle";

  const getStampStyles = () => {
    const offset = (isFull || isTop70) ? '5%' : '15%';
    switch (backgroundLogo?.stampPosition) {
      case 'top-left': return { top: offset, left: offset };
      case 'top-right': return { top: offset, right: offset };
      case 'bottom-left': return { bottom: offset, left: offset };
      case 'bottom-right':
      default: return { bottom: offset, right: offset };
    }
  };

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: isCircle ? 1.0 : 0,
        backgroundColor: cardBgColor,
        background: !item.imageUrl 
          ? `linear-gradient(135deg, ${cardBgColor} 0%, rgba(255,255,255,0.95) 100%)` 
          : cardBgColor,
        boxShadow: !item.imageUrl ? "0 10px 30px rgba(0,0,0,0.15)" : (randomSizes?.enabled ? 6 : 4),
        border: !item.imageUrl ? "2px solid rgba(255,255,255,0.5)" : "1px solid rgba(0,0,0,0.15)",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        position: 'relative',
        overflow: 'hidden',
        width: imageSize * 1.25,
        maxWidth: imageSize * 1.25,
        height: (isTop70 ? imageSize * 1.6 : (isCircle ? imageSize * 1.55 : imageSize * 1.4)),
        maxHeight: (isTop70 ? imageSize * 1.6 : (isCircle ? imageSize * 1.55 : imageSize * 1.4)),
        display: "flex",
        flexDirection: "column",
        justifyContent: (!item.imageUrl && !item.signatureUrl) ? "center" : "flex-start",
      }}
    >
      {(item.imageUrl || item.signatureUrl) && (
        <Box 
          sx={{ 
            position: isFull ? 'absolute' : 'relative', 
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: isCircle ? imageSize * 0.9 : '100%', 
            height: isCircle ? imageSize * 0.9 : (isTop70 ? imageSize : (isFull ? '100%' : '100%')), 
            flexShrink: 0,
            mt: isCircle ? 0.5 : 0,
            mb: isCircle ? 0.8 : (isTop70 ? 0.5 : 0),
            borderRadius: isCircle ? "50%" : 0,
            overflow: "hidden",
            border: isCircle ? (randomSizes?.enabled ? "6px solid #ddd" : "4px solid #ccc") : "none",
            boxShadow: isCircle ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: !item.imageUrl ? "rgba(255,255,255,0.95)" : "transparent",
          }}
        >
          {item.imageUrl ? (
            <>
              <Box
                component="img"
                src={item.imageUrl}
                alt="Media"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: "cover",
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              />
              
              {backgroundLogo?.stampOnImages && backgroundLogo.imageUrl && (
                <Box
                  component="img"
                  src={backgroundLogo.imageUrl}
                  sx={{
                    position: 'absolute',
                    width: '25%',
                    maxWidth: '40px',
                    height: 'auto',
                    zIndex: 5,
                    opacity: 0.9,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                    pointerEvents: 'none',
                    ...getStampStyles()
                  }}
                />
              )}
            </>
          ) : (
            isSignatureMode ? (
              <Box
                sx={{
                  width: "85%",
                  height: "80%",
                  backgroundColor: mediaType2SignatureColor || '#000000',
                  maskImage: `url(${item.signatureUrl})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: `url(${item.signatureUrl})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}
              />
            ) : (
              <Box
                component="img"
                src={item.signatureUrl}
                alt="Signature"
                sx={{
                  width: "85%",
                  maxHeight: "80%",
                  objectFit: "contain",
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}
              />
            )
          )}
        </Box>
      )}

      <Box sx={{ 
        width: '100%', 
        zIndex: 2, 
        mt: (!item.imageUrl && !item.signatureUrl) ? 0 : (isTop70 ? 1 : (isFull ? 'auto' : 0)),
        p: 0,
        pb: (isCircle && (item.imageUrl || item.signatureUrl)) ? 1.5 : 0,
        background: (isFull && (item.imageUrl || item.signatureUrl)) ? 'linear-gradient(transparent, rgba(0,0,0,0.8))' : 'transparent',
        color: (isFull && (item.imageUrl || item.signatureUrl)) ? '#fff' : 'inherit',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        textAlign: 'center',
      }}>
        {(item.signatureUrl && item.imageUrl) && (
          <Box sx={{ 
            width: "100%", 
            display: 'flex', 
            justifyContent: 'center', 
            mb: item.text ? 2 : 0,
            filter: 'none'
          }}>
            {isSignatureMode ? (
              <Box
                sx={{
                  width: "82%",
                  maxWidth: 140,
                  height: 30,
                  backgroundColor: mediaType2SignatureColor || '#000000',
                  maskImage: `url(${item.signatureUrl})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: `url(${item.signatureUrl})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                }}
              />
            ) : (
              <Box
                component="img"
                src={item.signatureUrl}
                alt="Signature"
                sx={{
                  width: "82%",
                  maxWidth: 140,
                  maxHeight: 58,
                  objectFit: "contain",
                  filter: (isFull && item.imageUrl) ? 'brightness(0) invert(1)' : 'none',
                }}
              />
            )}
          </Box>
        )}
        {item.text && (
          <Typography 
            variant="body1" 
            textAlign={item.text.length < 50 ? "center" : "start"}
            sx={{ 
              fontWeight: (!item.imageUrl && !item.signatureUrl) ? 700 : ((isFull && (item.imageUrl || item.signatureUrl)) ? 600 : 400),
              textShadow: (isFull && (item.imageUrl || item.signatureUrl)) ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
              fontSize: (() => {
                const len = item.text.length;
                const hasMedia = item.imageUrl || item.signatureUrl;

                if (isFull && hasMedia) {
                  if (len > 125) return '0.45rem';
                  if (len > 80) return '0.55rem';
                  if (len > 40) return '0.70rem';
                  return '0.85rem';
                }
                if (!hasMedia) {
                  if (len > 125) return '0.65rem';
                  if (len > 80) return '0.75rem';
                  if (len > 40) return '0.85rem';
                  return '1.0rem';
                }
                if (len > 125) return '0.50rem';
                if (len > 80) return '0.65rem';
                if (len > 40) return '0.75rem';
                return '0.85rem';
              })(),
              px: (isCircle && (item.imageUrl || item.signatureUrl)) ? 1.5 : 2,
              py: 0,
              width: "100%",
              lineHeight: 1.2,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              display: (item.imageUrl || item.signatureUrl) ? '-webkit-box' : 'block',
              WebkitBoxOrient: (item.imageUrl || item.signatureUrl) ? 'vertical' : 'unset',
              WebkitLineClamp: (item.imageUrl || item.signatureUrl) ? (isFull ? 3 : (isCircle ? 2 : 3)) : 'unset',
              overflow: 'hidden',
              color: isSignatureMode 
                 ? (mediaType2TextColor || '#000000') 
                 : ((!item.imageUrl && !isFull) ? 'rgba(0,0,0,0.85)' : 'inherit'),
              letterSpacing: !item.imageUrl ? '0.01em' : 'normal',
            }}
          >
            {item.text}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

export default function CardsGrid({
  media,
  cardOrder = "sequential",
  mediaType = "type1",
  background,
  backgroundLogo,
  randomSizes,
  backgroundColor = "#ffffff",
  randomColors = false,
  imageShape = "circle",
  mediaType2TextColor,
  mediaType2SignatureColor,
}) {
  const containerRef = useRef(null);
  const prevMediaIdsRef = useRef([]);

  const normalizedCardOrder = String(cardOrder || "sequential").toLowerCase();
  const isRandomLayout = normalizedCardOrder === "random";
  const isSignatureMode = mediaType === "type2";

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

    return (
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "40vw",
          height: "40vh",
          zIndex: backgroundLogo.overlayEnabled ? 100 : 1,
          pointerEvents: "none",
          opacity: backgroundLogo.opacity ?? 1,
        }}
      >
        {backgroundLogo.type === "video" ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          >
            <source src={backgroundLogo.imageUrl} />
          </video>
        ) : (
          <img
            src={backgroundLogo.imageUrl}
            alt="Background Logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
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
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                    mass: 1,
                  }}
                >
                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 3 + (idx % 2) * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <MediaCard
                      item={item}
                      isSignatureMode={isSignatureMode}
                      imageSize={imageSize}
                      randomSizes={randomSizes}
                      backgroundLogo={backgroundLogo}
                      backgroundColor={backgroundColor}
                      randomColors={randomColors}
                      imageShape={imageShape}
                      mediaType2TextColor={mediaType2TextColor}
                      mediaType2SignatureColor={mediaType2SignatureColor}
                    />
                  </motion.div>
                </motion.div>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}