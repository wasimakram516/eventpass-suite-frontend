"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useAnimation } from "framer-motion";
import { Shift } from "ambient-cbg";

const COLS = 15;
const ROWS = 10;
const TOTAL_BOXES = COLS * ROWS;

// ─────────────────────────────────────────────────────────────────────────────
// A single cell in the grid, now only animating when `isNew === true`
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
              ? { scale: 8, opacity: 0 } // start huge & invisible
              : { scale: 1, opacity: 0.85 }
          }
          animate={{ scale: 1, opacity: 0.85, rotate: 0 }}
          transition={
            isNew
              ? {
                  // pop-in spring with a bit of bounce
                  type: "spring",
                  stiffness: 180,
                  damping: 20,
                }
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
export default function MosaicGrid({ media }) {
  const [gridState, setGridState] = useState(Array(TOTAL_BOXES).fill(null));
  const [boxVersions, setBoxVersions] = useState(Array(TOTAL_BOXES).fill(0));
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const prevRef = useRef([]);
  const initRef = useRef(false);

  useEffect(() => {
    const newItems = media.filter(
      (m) => !prevRef.current.find((old) => old._id === m._id),
    );
    const nextGrid = [...gridState];
    const nextVer = [...boxVersions];

    // first load: randomly populate
    if (!initRef.current && media.length) {
      const order = Array.from({ length: TOTAL_BOXES }, (_, i) => i).sort(
        () => Math.random() - 0.5,
      );
      media.forEach((m, i) => {
        const idx = order[i % TOTAL_BOXES];
        nextGrid[idx] = m;
        nextVer[idx]++;
      });
      setGridState(nextGrid);
      setBoxVersions(nextVer);
      prevRef.current = media;
      initRef.current = true;
      return;
    }

    // on new image
    if (newItems.length) {
      const m = newItems[newItems.length - 1];
      const idx = Math.floor(Math.random() * TOTAL_BOXES);
      setAnimatingIndex(idx);

      // place immediately (bump version to force re-key)
      nextGrid[idx] = m;
      nextVer[idx]++;
      setGridState(nextGrid);
      setBoxVersions(nextVer);
      prevRef.current = media;

      // clear the flag after animation duration
      setTimeout(() => setAnimatingIndex(null), 800);
    }
  }, [media]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Animated background */}
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Shift />
      </Box>

      {/* The grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS},1fr)`,
          gridTemplateRows: `repeat(${ROWS},1fr)`,
          gap: "1px",
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
        }}
      >
        {gridState.map((item, i) => (
          <MosaicCell
            key={i}
            item={item}
            version={boxVersions[i]}
            isNew={i === animatingIndex}
          />
        ))}
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
