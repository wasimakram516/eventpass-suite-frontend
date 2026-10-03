"use client";

import { Box } from "@mui/material";
import { motion } from "framer-motion";

// Time-of-day background for the CMS dashboard's welcome header: a sky
// gradient plus a drifting sun/moon glow and a few slow-moving clouds, swapped
// automatically by band (morning / afternoon / evening / night, computed from
// the real hour in cms/page.js). The greeting text above it only has three
// states (Morning/Afternoon/Evening — "Good Night" isn't a real greeting), so
// night doesn't have its own greeting line, only its own sky. Purely
// decorative: sits behind the header's real content (name, actions, etc.),
// which is untouched by this component.

// The card's content sits in a two-column layout (name block on the left,
// actions on the right) with real text only in the outer edges of each side —
// so the visually empty area is the middle band roughly between 30% and 62%
// horizontally. Every scene's sun/moon and clouds target that band instead of
// the corners, so they never sit behind the name or the Live/Recompute
// controls.
const SCENE_SUN_POS = { left: "46%", top: "50%", transform: "translate(-50%, -50%)" };

const SCENES = {
  morning: {
    sky: "linear-gradient(160deg, #1e3a5f 0%, #3d6d9e 45%, #7fb3d5 78%, #ffd9a0 100%)",
    sun: "radial-gradient(circle, rgba(255,236,179,0.95) 0%, rgba(255,213,128,0.55) 35%, rgba(255,213,128,0) 70%)",
    sunSize: 130,
    cloudColor: "rgba(255,255,255,0.8)",
  },
  afternoon: {
    sky: "linear-gradient(160deg, #0d47a1 0%, #1976d2 45%, #4fa8e8 80%, #bfe3ff 100%)",
    sun: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0) 70%)",
    sunSize: 110,
    cloudColor: "rgba(255,255,255,0.9)",
  },
  evening: {
    sky: "linear-gradient(160deg, #1a0f3d 0%, #5b2a86 40%, #c15c6b 72%, #f5a962 100%)",
    sun: "radial-gradient(circle, rgba(255,183,120,0.95) 0%, rgba(255,140,90,0.55) 35%, rgba(255,140,90,0) 70%)",
    sunSize: 120,
    cloudColor: "rgba(255,225,210,0.75)",
  },
  // Not wired into the real time-based band yet (that's still morning /
  // afternoon / evening, matching the greeting text) — available for a
  // future late-night band or a manual preview.
  night: {
    sky: "linear-gradient(160deg, #05070f 0%, #0c1330 45%, #1b2650 78%, #2a3868 100%)",
    sun: "radial-gradient(circle, rgba(226,232,255,0.95) 0%, rgba(180,196,255,0.4) 40%, rgba(180,196,255,0) 72%)",
    sunSize: 100,
    cloudColor: "rgba(150,165,210,0.4)",
    stars: true,
  },
};

// A handful of fixed-position twinkling stars for the night scene, each
// pulsing opacity on its own offset so they don't blink in sync.
const STARS = [
  { x: 0.28, y: 0.18, size: 2, delay: 0 },
  { x: 0.34, y: 0.62, size: 1.5, delay: 0.6 },
  { x: 0.4, y: 0.32, size: 2.5, delay: 1.2 },
  { x: 0.5, y: 0.72, size: 1.5, delay: 1.8 },
  { x: 0.56, y: 0.22, size: 2, delay: 0.3 },
  { x: 0.6, y: 0.5, size: 1.5, delay: 2.1 },
  { x: 0.46, y: 0.14, size: 1.5, delay: 1.5 },
  { x: 0.32, y: 0.44, size: 1.5, delay: 0.9 },
];

function Stars() {
  return (
    <>
      {STARS.map((star, index) => (
        <motion.div
          key={index}
          style={{
            position: "absolute",
            left: `${star.x * 100}%`,
            top: `${star.y * 100}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            background: "#f5f8ff",
            boxShadow: "0 0 4px rgba(245,248,255,0.8)",
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.4, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

// A soft, edgeless cloud: several overlapping radial-gradient puffs (not
// solid flat circles) in one blurred, screen-blended layer. Screen (not
// multiply) is what actually lightens white/pale shapes onto a colored sky —
// multiply on a near-white color would nearly erase them. Blurring plus the
// blend mode is what keeps this from reading as a stack of literal shapes.
const CLOUD_PUFFS = [
  { x: 0.5, y: 0.5, r: 0.5 },
  { x: 0.22, y: 0.42, r: 0.34 },
  { x: 0.74, y: 0.38, r: 0.3 },
  { x: 0.38, y: 0.28, r: 0.26 },
  { x: 0.62, y: 0.62, r: 0.32 },
];

function Cloud({ color, sx, width = 120, duration = 40, delay = 0, drift = 60 }) {
  const height = width * 0.5;
  const background = CLOUD_PUFFS.map(
    ({ x, y, r }) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${color} 0%, ${color} ${r * 40}%, transparent ${r * 100}%)`,
  ).join(", ");

  return (
    <motion.div
      style={{ position: "absolute", pointerEvents: "none", mixBlendMode: "screen", ...sx }}
      animate={{ x: [0, drift, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <Box sx={{ width, height, background, filter: "blur(6px)" }} />
    </motion.div>
  );
}

export default function WelcomeScene({ band = "afternoon" }) {
  const scene = SCENES[band] || SCENES.afternoon;

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background: scene.sky,
      }}
    >
      {/* Sun / moon glow — a slow, gentle pulse rather than a drift, since it
          should read as a fixed light source. */}
      <motion.div
        style={{
          position: "absolute",
          width: scene.sunSize,
          height: scene.sunSize,
          borderRadius: "50%",
          background: scene.sun,
          ...SCENE_SUN_POS,
        }}
        animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.06, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {scene.stars && <Stars />}

      <Cloud color={scene.cloudColor} width={110} duration={46} delay={0} drift={40} sx={{ top: "20%", left: "34%" }} />
      <Cloud color={scene.cloudColor} width={80} duration={38} delay={4} drift={-32} sx={{ top: "62%", left: "42%" }} />
      <Cloud color={scene.cloudColor} width={65} duration={52} delay={2} drift={26} sx={{ top: "34%", left: "56%" }} />
    </Box>
  );
}
