"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";

// ─────────────────────────────────────────────────────────────────────────────
// A single floating bubble
// ─────────────────────────────────────────────────────────────────────────────
function FloatingBubble({ item, isNew, version, position, size }) {
  const key = item ? `${item._id}-${version}` : null;

  const { offsetX, offsetY, floatDelay } = useMemo(() => ({
    offsetX: Math.random() * 40 - 20,
    offsetY: Math.random() * 30 - 15,
    floatDelay: Math.random() * 2,
  }), []);

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

  const generateRandomPosition = useCallback((size, existingBubbles) => {
    if (typeof window === "undefined") return { x: 0, y: 0 };

    const margin = 20;
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * (window.innerWidth - size - margin * 2) + margin;
      const y = Math.random() * (window.innerHeight - size - margin * 2) + margin;

      const hasOverlap = existingBubbles.some(({ position: pos, size: existingSize }) => {
        if (!pos || (pos.x === 0 && pos.y === 0)) return false;
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        return distance < (size + existingSize) / 2 + margin;
      });

      if (!hasOverlap) return { x, y };
    }

    // Fallback if no non-overlapping position found after maxAttempts
    return {
      x: Math.random() * (window.innerWidth - size - margin * 2) + margin,
      y: Math.random() * (window.innerHeight - size - margin * 2) + margin,
    };
  }, []); 

  useEffect(() => {
    const newItems = media.filter(
      (m) => !prevRef.current.find((old) => old._id === m._id),
    );

    if (!initRef.current && media.length) {
      const initialBubbles = [];
      media.forEach((m) => {
        const size = getRandomSize();
        const position = generateRandomPosition(size, initialBubbles);
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
        const size = getRandomSize();
        const position = generateRandomPosition(size, prev);
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
  }, [media, getRandomSize, generateRandomPosition]);

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
      <Box sx={{
        position: "absolute", inset: 0, zIndex: 0}}>
        <Shift />
      </Box>
    );
  };

  const renderBackgroundLogo = () => {
    if (!backgroundLogo?.enabled || !backgroundLogo?.imageUrl) return null;
    const positionStyles = {
      center:         { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      "top-left":     { top: "5%", left: "5%" },
      "top-right":    { top: "5%", right: "5%" },
      "bottom-left":  { bottom: "5%", left: "5%" },
      "bottom-right": { bottom: "5%", right: "5%" },
    };
    const isVideo = /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(backgroundLogo.imageUrl);
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

      <Box sx={{ position: "relative", width: "100%", height: "100%", zIndex: 10 }}>
        {bubbles.map(({ item, position, size, version }) => (
          <FloatingBubble
            key={item._id}
            item={item}
            version={version}
            isNew={item._id === animatingId}
            position={position}
            size={size}
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