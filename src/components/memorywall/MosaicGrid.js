"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";

const COLS = 15;
const ROWS_PER_BATCH = 10;

function randomFr(min = 0.5, max = 2.0) {
  return (min + Math.random() * (max - min)).toFixed(2);
}

// ─────────────────────────────────────────────────────────────────────────────
// A single cell in the mosaic grid
// ─────────────────────────────────────────────────────────────────────────────
function MosaicCell({ item, isNew, version }) {
  const key = item ? `${item._id}-${version}` : null;

  return (
    <Box
      sx={{
        border: "1px solid #222",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      {item && (
        <motion.img
          key={key}
          src={item.imageUrl}
          alt=""
          initial={
            isNew
              ? { scale: 8, opacity: 0 }
              : { scale: 1, opacity: 0.85 }
          }
          animate={{ scale: 1, opacity: 0.85 }}
          transition={
            isNew
              ? { type: "spring", stiffness: 180, damping: 20 }
              : { duration: 0 }
          }
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            top: 0,
            left: 0,
            willChange: "transform, opacity",
          }}
        />
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The MosaicGrid itself
// ─────────────────────────────────────────────────────────────────────────────
export default function MosaicGrid({ media, background, backgroundLogo, randomSizes }) {
  const [gridState, setGridState] = useState([]);
  const [boxVersions, setBoxVersions] = useState([]);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const prevRef = useRef([]);
  const initRef = useRef(false);

  const totalBoxes = Math.max(COLS * ROWS_PER_BATCH, media.length + COLS * 2);
  const currentRows = Math.ceil(totalBoxes / COLS);

  const colTemplate = useMemo(() => {
    if (!randomSizes?.enabled) return `repeat(${COLS}, 1fr)`;
    const frValues = Array.from({ length: COLS }, () => `${randomFr(0.4, 2.2)}fr`);
    return frValues.join(" ");
  }, [randomSizes?.enabled, COLS]);

  const rowTemplate = useMemo(() => {
    if (!randomSizes?.enabled) return `repeat(${currentRows}, 1fr)`;
    const frValues = Array.from({ length: currentRows }, () => `${randomFr(0.4, 2.2)}fr`);
    return frValues.join(" ");
  }, [randomSizes?.enabled, currentRows]);

  const renderBackground = () => {
    if (background?.type === "video" && background.value) {
      return (
        <video
          autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        >
          <source src={background.value} />
        </video>
      );
    } else if (background?.type === "image" && background.value) {
      return (
        <Box
          sx={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${background.value})`,
            backgroundSize: "cover", backgroundPosition: "center",
            backgroundRepeat: "no-repeat", zIndex: 0,
          }}
        />
      );
    }
    return <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}><Shift /></Box>;
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

  useEffect(() => {
    const newItems = media.filter((m) => !prevRef.current.find((old) => old._id === m._id));

    
    if (!initRef.current && media.length) {
      const newGrid = Array(totalBoxes).fill(null);
      const newVersions = Array(totalBoxes).fill(0);
      const order = Array.from({ length: totalBoxes }, (_, i) => i).sort(() => Math.random() - 0.5);
      media.forEach((m, i) => {
        const idx = order[i % totalBoxes];
        newGrid[idx] = m;
        newVersions[idx]++;
      });
      setGridState(newGrid);
      setBoxVersions(newVersions);
      prevRef.current = media;
      initRef.current = true;
      return;
    }

    // Grow grid if needed
    if (gridState.length < totalBoxes) {
      setGridState((prev) => [...prev, ...Array(totalBoxes - prev.length).fill(null)]);
      setBoxVersions((prev) => [...prev, ...Array(totalBoxes - prev.length).fill(0)]);
      return;
    }

    // New image arrived
    if (newItems.length && gridState.length >= totalBoxes) {
      const m = newItems[newItems.length - 1];
      const idx = Math.floor(Math.random() * totalBoxes);
      setAnimatingIndex(idx);
      setGridState((prev) => { const g = [...prev]; g[idx] = m; return g; });
      setBoxVersions((prev) => { const v = [...prev]; v[idx]++; return v; });
      prevRef.current = media;
      setTimeout(() => setAnimatingIndex(null), 800);
    }

    // Deletion
    if (media.length < prevRef.current.length) {
      const currentIds = new Set(media.map((m) => m._id));
      setGridState((prev) => prev.map((item) => (item && !currentIds.has(item._id) ? null : item)));
      setBoxVersions((prev) => prev.map((v, i) => {
        const item = gridState[i];
        return item && !currentIds.has(item._id) ? v + 1 : v;
      }));
      prevRef.current = media;
    }
  }, [media, totalBoxes]);

  return (
    <Box sx={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {renderBackground()}
      {renderBackgroundLogo()}

      <Box
        sx={{
          display: "grid",
          // ↓ These now use the memoized random fr templates when enabled
          gridTemplateColumns: colTemplate,
          gridTemplateRows: rowTemplate,
          gap: "1px",
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          minHeight: "100vh",
        }}
      >
        {gridState.map((item, i) => (
          <MosaicCell
            key={i}
            item={item}
            version={boxVersions[i] || 0}
            isNew={i === animatingIndex}
          />
        ))}
      </Box>
    </Box>
  );
}