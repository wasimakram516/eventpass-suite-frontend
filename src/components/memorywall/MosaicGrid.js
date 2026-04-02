"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { Shift } from "ambient-cbg";


// ─────────────────────────────────────────────────────────────────────────────
// A single cell in the mosaic grid
// ─────────────────────────────────────────────────────────────────────────────
function MosaicCell({ 
  item, 
  isNew, 
  version, 
  backgroundLogo 
}) {
  if (!item) return (
    <Box 
      sx={{ 
        width: "100%", 
        height: "100%", 
        border: "1px solid #222",
        backgroundColor: "transparent"
      }} 
    />
  );

  const key = `${item._id}-${version}`;
  const isVideo = item.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i);

  const getStampStyles = () => {
    switch (backgroundLogo?.stampPosition) {
      case 'top-left': return { top: 8, left: 8 };
      case 'top-right': return { top: 8, right: 8 };
      case 'bottom-left': return { bottom: 8, left: 8 };
      case 'bottom-right':
      default: return { bottom: 8, right: 8 };
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        border: "1px solid #222",
        backgroundColor: "transparent",
      }}
    >
      <motion.div
        key={key}
        initial={isNew ? { scale: 8, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={isNew ? { type: "spring", stiffness: 180, damping: 20 } : { duration: 0 }}
        style={{ width: "100%", height: "100%", position: 'absolute', top: 0, left: 0 }}
      >
        {item.imageUrl ? (
          isVideo ? (
            <video
              src={item.imageUrl}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={item.imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )
        ) : item.signatureUrl ? (
          <Box sx={{ width: "100%", height: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.9)' }}>
            <img
              src={item.signatureUrl}
              alt="Signature"
              style={{ width: "90%", height: "90%", objectFit: "contain" }}
            />
          </Box>
        ) : (
          <Box sx={{ 
            width: "100%", 
            height: "100%", 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'primary.main',
            color: 'white',
            p: 0.5
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.6rem', 
                lineHeight: 1, 
                textAlign: 'center',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {item.text}
            </Typography>
          </Box>
        )}
      </motion.div>

      {backgroundLogo?.stampOnImages && backgroundLogo.imageUrl && (
        <Box
          component="img"
          src={backgroundLogo.imageUrl}
          sx={{
            position: 'absolute',
            width: '20%',
            maxWidth: '40px',
            height: 'auto',
            zIndex: 5,
            opacity: 0.8,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            pointerEvents: 'none',
            ...getStampStyles()
          }}
        />
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The MosaicGrid itself
// ─────────────────────────────────────────────────────────────────────────────
export default function MosaicGrid({ media, background, backgroundLogo, rows = 10, cols = 15 }) {
  const safeRows = useMemo(() => Math.max(1, Math.trunc(Number(rows) || 10)), [rows]);
  const safeCols = useMemo(() => Math.max(1, Math.trunc(Number(cols) || 15)), [cols]);
  const totalBoxes = safeRows * safeCols;

  const [gridState, setGridState] = useState([]);
  const [boxVersions, setBoxVersions] = useState([]);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const prevIdsRef = useRef([]);
  const insertionOrderRef = useRef([]);
  const timerRef = useRef(null);

  const rebuildGridFromMedia = useCallback((sourceMedia) => {
    const latest = sourceMedia.slice(0, totalBoxes);
    const nextGrid = Array(totalBoxes).fill(null);
    const nextVersions = Array(totalBoxes).fill(0);
    const used = new Set();
    const insertionOrder = [];

    latest.forEach((item) => {
      let idx = Math.floor(Math.random() * totalBoxes);
      while (used.has(idx) && used.size < totalBoxes) {
        idx = Math.floor(Math.random() * totalBoxes);
      }
      used.add(idx);
      nextGrid[idx] = item;
      nextVersions[idx] = 1;
      insertionOrder.push(idx);
    });

    setGridState(nextGrid);
    setBoxVersions(nextVersions);
    insertionOrderRef.current = insertionOrder;
  }, [totalBoxes]);

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

  useEffect(() => {
    if (gridState.length !== totalBoxes) {
      rebuildGridFromMedia(media);
      prevIdsRef.current = media.map((m) => m._id);
      return;
    }

    const prevIds = new Set(prevIdsRef.current);
    const newItems = media.filter((m) => !prevIds.has(m._id));

    if (!newItems.length) {
      if (media.length !== prevIdsRef.current.length) {
        rebuildGridFromMedia(media);
      }
      prevIdsRef.current = media.map((m) => m._id);
      return;
    }

    let nextGrid = [...gridState];
    let nextVersions = [...boxVersions];
    let lastAnimated = null;

    const usedInBatch = new Set();
    newItems.forEach((item) => {
      const emptyIndices = [];
      for (let i = 0; i < totalBoxes; i++) {
        if (!nextGrid[i] && !usedInBatch.has(i)) {
          emptyIndices.push(i);
        }
      }

      let idx;
      if (emptyIndices.length > 0) {
        idx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      } else {
        const queue = insertionOrderRef.current;
        idx = queue.length ? queue.shift() : 0;
        while (usedInBatch.has(idx) && queue.length) {
          idx = queue.shift();
        }
        if (usedInBatch.has(idx)) {
          idx = Math.floor(Math.random() * totalBoxes);
          while (usedInBatch.has(idx) && usedInBatch.size < totalBoxes) {
            idx = Math.floor(Math.random() * totalBoxes);
          }
        }
      }

      usedInBatch.add(idx);
      nextGrid[idx] = item;
      nextVersions[idx] = (nextVersions[idx] || 0) + 1;
      insertionOrderRef.current.push(idx);
      lastAnimated = idx;
    });

    setGridState(nextGrid);
    setBoxVersions(nextVersions);
    setAnimatingIndex(lastAnimated);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAnimatingIndex(null), 700);
    prevIdsRef.current = media.map((m) => m._id);
  }, [media, totalBoxes, gridState, boxVersions, rebuildGridFromMedia]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Box sx={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {renderBackground()}
      {renderBackgroundLogo()}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${safeCols}, 1fr)`,
          gridTemplateRows: `repeat(${safeRows}, 1fr)`,
          gap: "1px",
          position: "relative",
          zIndex: 10,
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
            backgroundLogo={backgroundLogo}
          />
        ))}
      </Box>
    </Box>
  );
}