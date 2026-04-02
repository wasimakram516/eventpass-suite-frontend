"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";

// ─────────────────────────────────────────────────────────────────────────────
// A single floating bubble
// ─────────────────────────────────────────────────────────────────────────────
function FloatingBubble({ item, isNew, version, position, size, backgroundLogo }) {
  const key = item ? `${item._id}-${version}` : null;

  const { offsetX, offsetY, floatDelay } = useMemo(() => ({
    offsetX: Math.random() * 40 - 20,
    offsetY: Math.random() * 30 - 15,
    floatDelay: Math.random() * 2,
  }), []);

  const getStampStyles = () => {
    switch (backgroundLogo?.stampPosition) {
      case 'top-left': return { top: '18%', left: '18%' };
      case 'top-right': return { top: '18%', right: '18%' };
      case 'bottom-left': return { bottom: '18%', left: '18%' };
      case 'bottom-right':
      default: return { bottom: '18%', right: '18%' };
    }
  };

  return (
    <motion.div
      key={key}
      initial={
        isNew
          ? { scale: 0, opacity: 0, x: position.x, y: position.y }
          : { scale: 1, opacity: 1, x: position.x, y: position.y }
      }
      animate={{
        scale: 1,
        opacity: 1,
        x: [position.x, position.x + offsetX, position.x, position.x - offsetX, position.x],
        y: [position.y, position.y + offsetY, position.y, position.y - offsetY, position.y],
      }}
      transition={
        isNew
          ? {
              scale: { type: "spring", stiffness: 200, damping: 15 },
              opacity: { duration: 0.35 },
              x: {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.15 + floatDelay,
              },
              y: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.15 + floatDelay,
              },
            }
          : {
              x: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
            }
      }
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        cursor: "pointer",
        willChange: "transform, opacity",
        zIndex: 10,
      }}
      whileHover={{ scale: 1.1, opacity: 1, zIndex: 1000 }}
    >
      {item && (
        item.imageUrl ? (
          <motion.img
            src={item.imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
              border: "3px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
            whileHover={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ rotate: { duration: 0.6 } }}
          />
        ) : item.signatureUrl ? (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.95)',
              borderRadius: '50%',
              border: "3px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          >
            <img
              src={item.signatureUrl}
              alt="Signature"
              style={{ width: "80%", height: "80%", objectFit: "contain" }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              border: "3px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              p: 2
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: size > 150 ? '0.9rem' : '0.6rem',
                textAlign: 'center',
                fontWeight: 'bold',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {item.text}
            </Typography>
          </Box>
        )
      )}

      {backgroundLogo?.stampOnImages && backgroundLogo.imageUrl && (
        <Box
          component="img"
          src={backgroundLogo.imageUrl}
          sx={{
            position: 'absolute',
            width: '25%',
            maxWidth: '35px',
            height: 'auto',
            zIndex: 5,
            opacity: 0.9,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            pointerEvents: 'none',
            ...getStampStyles()
          }}
        />
      )}

      {/* Floating glass overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The BubbleGrid itself
// ─────────────────────────────────────────────────────────────────────────────
export default function BubbleGrid({
  media,
  background,
  backgroundLogo,
  randomSizes,
  minSize = 100,
  maxSize = 300,
}) {
  const [bubbles, setBubbles] = useState([]); // [{ item, position, size, version }]
  const [animatingId, setAnimatingId] = useState(null);
  const prevRef = useRef([]);
  const initRef = useRef(false);
  const animTimerRef = useRef(null);

  const getRandomSize = useCallback(() => {
    if (randomSizes && minSize != null && maxSize != null) {
      return minSize + Math.random() * (maxSize - minSize);
    }
    return 150;
  }, [randomSizes, minSize, maxSize]);

  const FLOAT_PAD = 22;
  const EDGE_MARGIN = 16;
  const GAP = 12;

  const exclusionRadius = useCallback((bubbleSize) => {
    return bubbleSize / 2 + FLOAT_PAD + GAP / 2;
  }, []);

  const clearanceAt = useCallback((cx, cy, existingBubbles, screenW, screenH) => {
    // Distance to each edge
    let r = Math.min(cx - EDGE_MARGIN, cy - EDGE_MARGIN,
                     screenW - EDGE_MARGIN - cx, screenH - EDGE_MARGIN - cy);

    for (const { position: pos, size: es } of existingBubbles) {
      if (!pos) continue;
      const ecx = pos.x + es / 2;
      const ecy = pos.y + es / 2;
      const dist = Math.sqrt((cx - ecx) ** 2 + (cy - ecy) ** 2);
      const gap = dist - exclusionRadius(es);
      r = Math.min(r, gap);
    }
    return r;
  }, [exclusionRadius]);

  const findBestPlacement = useCallback((existingBubbles) => {
    if (typeof window === "undefined") return { position: { x: 0, y: 0 }, availableRadius: 0 };

    const W = window.innerWidth;
    const H = window.innerHeight;

    const STEPS = 60;
    const stepX = (W - EDGE_MARGIN * 2) / STEPS;
    const stepY = (H - EDGE_MARGIN * 2) / STEPS;

    let bestCX = W / 2;
    let bestCY = H / 2;
    let bestClearance = -Infinity;

    for (let row = 0; row <= STEPS; row++) {
      for (let col = 0; col <= STEPS; col++) {
        const cx = EDGE_MARGIN + col * stepX;
        const cy = EDGE_MARGIN + row * stepY;
        const c = clearanceAt(cx, cy, existingBubbles, W, H);
        if (c > bestClearance) {
          bestClearance = c;
          bestCX = cx;
          bestCY = cy;
        }
      }
    }

    const jitter = Math.min(bestClearance * 0.25, 30);
    bestCX += (Math.random() - 0.5) * jitter * 2;
    bestCY += (Math.random() - 0.5) * jitter * 2;
    bestClearance = clearanceAt(bestCX, bestCY, existingBubbles, W, H);

    return { position: { x: bestCX, y: bestCY }, availableRadius: bestClearance };
  }, [clearanceAt]);

  const findPositionAndSize = useCallback((requestedSize, existingBubbles) => {
    const { position: centre, availableRadius } = findBestPlacement(existingBubbles);

    let actualSize = requestedSize;
    if (randomSizes) {
      const maxRadius = availableRadius - GAP / 2;
      const fitSize = maxRadius * 2;
      actualSize = Math.max(minSize, Math.min(requestedSize, fitSize));
    }

    return {
      position: { x: centre.x - actualSize / 2, y: centre.y - actualSize / 2 },
      size: actualSize,
    };
  }, [findBestPlacement, minSize, randomSizes]);

  useEffect(() => {
    const newItems = media.filter(
      (m) => !prevRef.current.find((old) => old._id === m._id),
    );

    if (!initRef.current && media.length) {
      const initialBubbles = [];
      media.forEach((m) => {
        const requestedSize = getRandomSize();
        const { position, size } = findPositionAndSize(requestedSize, initialBubbles);
        initialBubbles.push({ item: m, position, size, version: 1 });
      });
      setBubbles(initialBubbles);
      prevRef.current = media;
      initRef.current = true;
      return;
    }

    if (newItems.length) {
      const m = newItems[newItems.length - 1];
      setAnimatingId(m._id);

      setBubbles((prev) => {
        const requestedSize = getRandomSize();
        const { position, size } = findPositionAndSize(requestedSize, prev);
        return [...prev, { item: m, position, size, version: 1 }];
      });

      prevRef.current = media;

      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current);
      }

      animTimerRef.current = setTimeout(() => {
        setAnimatingId(null);
      }, 350);
    }

    // Deletion
    if (media.length < prevRef.current.length) {
      const currentIds = new Set(media.map((m) => m._id));

      setBubbles((prev) =>
        prev
          .filter(({ item }) => item && currentIds.has(item._id))
          .map((b) => ({ ...b, version: b.version + 1 })),
      );

      prevRef.current = media;
    }
  }, [media, getRandomSize, findPositionAndSize]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current);
      }
    };
  }, []);

  const renderBackground = () => {
    if (background?.type === "video" && background.value) {
      return (
        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}>
          <source src={background.value} />
        </video>
      );
    } else if (background?.type === "image" && background.value) {
      return (
        <Box sx={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${background.value})`,
          backgroundSize: "cover", backgroundPosition: "center",
          backgroundRepeat: "no-repeat", zIndex: 0,
        }} />
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

      <Box sx={{ position: "relative", width: "100%", height: "100%", zIndex: 10 }}>
        {bubbles.map(({ item, position, size, version }) => (
          <FloatingBubble
            key={item._id}
            item={item}
            version={version}
            isNew={item._id === animatingId}
            position={position}
            size={size}
            backgroundLogo={backgroundLogo}
          />
        ))}
      </Box>

      <Box sx={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.05) 100%)",
        pointerEvents: "none", zIndex: 2,
      }} />
    </Box>
  );
}
