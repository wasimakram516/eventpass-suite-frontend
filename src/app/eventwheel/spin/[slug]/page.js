"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Button, IconButton } from "@mui/material";
import Confetti from "react-confetti";

import { getParticipantsBySlug } from "@/services/eventwheel/spinWheelParticipantService";
import { getSpinWheelBySlug } from "@/services/eventwheel/spinWheelService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";

const btnSpin = "/freespin1.png";
const btnSpinClicked = "/freespin2.png";

const translations = {
  en: {
    winner: "Winner",
    spinning: "Spinning... Good Luck!",
    spinTheWheel: "Spin the Wheel!",
  },
  ar: {
    winner: "الفائز",
    spinning: "جاري الدوران... حظ سعيد!",
    spinTheWheel: "أدر العجلة!",
  },
};

const SPINS = 10; // deterministic spins
const DURATION_MS = 10000; // must match transition duration
const EASING = "cubic-bezier(0.17, 0.67, 0.32, 1)";

const normalizeDeg = (deg) => ((deg % 360) + 360) % 360;

const SpinningPage = () => {
  const params = useParams();
  const router = useRouter();
  const shortName = params.slug;

  const [participants, setParticipants] = useState([]);
  const participantsRef = useRef([]);
  const [eventData, setEventData] = useState(null);

  const [spinning, setSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);

  const wheelRef = useRef(null);
  const rotationRef = useRef(0); // stores accumulated rotation in degrees

  const { t, dir, align } = useI18nLayout(translations);

  const fetchParticipants = useCallback(async () => {
    const data = await getParticipantsBySlug(shortName);
    if (!data) return null;

    setParticipants(data);
    participantsRef.current = data;
    return data;
  }, [shortName]);

  const fetchSpinWheelData = useCallback(async () => {
    const wheelData = await getSpinWheelBySlug(shortName);
    if (wheelData) setEventData(wheelData);
    return wheelData;
  }, [shortName]);

  useEffect(() => {
    (async () => {
      const p = await fetchParticipants();
      if (!p) router.push("/");
      await fetchSpinWheelData();
    })();
  }, [fetchParticipants, fetchSpinWheelData, router]);

  // ---------- Wheel geometry ----------
  const size = 450;
  const r = size / 2;

  const count = participants.length;
  const slice = count > 0 ? 360 / count : 0;

  // Key alignment: shift wheel so pointer is exactly on center of slice 0 when rotationRef=0
  const baseOffset = useMemo(
    () => (count > 0 ? -slice / 2 : 0),
    [count, slice]
  );

  const labelRadius = Math.round(r * 0.72);

  const labelChord = useMemo(() => {
    if (!count) return 80;
    const rad = (slice * Math.PI) / 180;
    // chord length at labelRadius minus padding; clamp to keep sane
    return Math.max(42, Math.floor(2 * labelRadius * Math.sin(rad / 2) - 14));
  }, [count, slice, labelRadius]);

  const fontSize = useMemo(() => {
    if (!count) return 10;
    if (slice >= 30) return 14;
    if (slice >= 20) return 12;
    if (slice >= 14) return 11;
    return 10;
  }, [count, slice]);

  const wheelBg = useMemo(() => {
    if (!count) return "conic-gradient(#666 0deg 360deg)";
    return `conic-gradient(${participants
      .map((_, i) => {
        const a0 = i * slice;
        const a1 = (i + 1) * slice;
        const c = `hsl(${(i * 360) / count}, 70%, 50%)`;
        return `${c} ${a0}deg ${a1}deg`;
      })
      .join(", ")})`;
  }, [participants, count, slice]);

  const applyRotation = useCallback(
    (degRaw) => {
      if (!wheelRef.current) return;
      // Transform is always degRaw + baseOffset (baseOffset is what makes “top=center of segment”)
      wheelRef.current.style.transform = `rotate(${degRaw + baseOffset}deg)`;
    },
    [baseOffset]
  );

  // Re-apply alignment when participant count changes (e.g., fetch updates)
  useEffect(() => {
    applyRotation(rotationRef.current);
  }, [applyRotation, count]);

  const getWinnerIndexFromRotation = useCallback((degRaw, localCount) => {
    // This is the corrected version (NO +slice/2), because baseOffset already centers the pointer.
    if (!localCount) return -1;
    const localSlice = 360 / localCount;
    const thetaApplied = normalizeDeg(degRaw + -localSlice / 2); // same as baseOffset for that count
    const alpha = (360 - thetaApplied) % 360;
    const eps = 1e-6; // avoid boundary floating error
    return Math.floor((alpha + eps) / localSlice);
  }, []);

  const handleSpinWheel = async () => {
    if (spinning) return;

    setSpinning(true);
    setSelectedWinner(null);

    // Always spin using fresh data (avoid stale state)
    const freshParticipants = await fetchParticipants();
    await fetchSpinWheelData();

    const list = freshParticipants ?? participantsRef.current;
    const n = list?.length ?? 0;

    if (!n) {
      setSpinning(false);
      return;
    }

    const localSlice = 360 / n;

    // Ensure current transform is “locked” before starting (no visual jump)
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      applyRotation(rotationRef.current);
      // force reflow
      void wheelRef.current.offsetHeight;
    }

    // Choose landing index
    const landingIndex = Math.floor(Math.random() * n);

    // Desired rotationRef modulo 360 such that landingIndex center is at the top pointer:
    // With baseOffset = -slice/2, this simplifies to: desiredMod = 360 - landingIndex*slice
    const currentMod = normalizeDeg(rotationRef.current);
    const desiredMod = normalizeDeg(360 - landingIndex * localSlice);
    const needed = normalizeDeg(desiredMod - currentMod);

    rotationRef.current += SPINS * 360 + needed;

    // Animate
    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${DURATION_MS}ms ${EASING}`;
      applyRotation(rotationRef.current);
    }

    // Winner computed from final rotation (source of truth)
    window.setTimeout(() => {
      const finalList = participantsRef.current?.length
        ? participantsRef.current
        : list;
      const finalN = finalList.length;

      const idx = getWinnerIndexFromRotation(rotationRef.current, finalN);
      const w = idx >= 0 ? finalList[idx] : null;

      setSelectedWinner(w);
      setSpinning(false);

      // Optional: normalize large rotations to keep numbers small (no visible change)
      requestAnimationFrame(() => {
        if (!wheelRef.current) return;
        wheelRef.current.style.transition = "none";
        rotationRef.current = normalizeDeg(rotationRef.current);
        applyRotation(rotationRef.current);
      });
    }, DURATION_MS + 30);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundSize: "cover",
        backgroundImage: eventData?.backgroundUrl
          ? `url(${eventData.backgroundUrl})`
          : "none",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
      dir={dir}
    >
      {eventData?.type === "enter_names" && (
        <IconButton
          sx={{
            position: "fixed",
            top: { xs: 10, sm: 20 },
            left: { xs: 10, sm: 20 },
            backgroundColor: "primary.main",
            color: "white",
            zIndex: 9999,
          }}
          onClick={() => router.push(`/eventwheel/wheels/${shortName}`)}
        >
          <ICONS.back sx={{ fontSize: { xs: 24, md: 40 } }} />
        </IconButton>
      )}

      {selectedWinner && <Confetti numberOfPieces={500} recycle={false} />}

      <Box
        sx={{
          mb: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {/* WINNER */}
        {selectedWinner && !spinning && (
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              color: "white",
              animation: "winnerReveal 700ms ease-out",
              textShadow: `
          0 4px 20px rgba(0,0,0,0.7),
          0 0 35px rgba(255,215,0,0.9),
          0 0 70px rgba(255,215,0,0.6)
        `,
            }}
          >
            {selectedWinner.name}
          </Typography>
        )}

        {/* SPINNING */}
        {spinning && (
          <Typography
            variant="h4"
            sx={{
              color: "white",
              opacity: 0.85,
              letterSpacing: 1.5,
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          >
            {t.spinning}
          </Typography>
        )}

        {/* IDLE */}
        {!spinning && !selectedWinner && (
          <Typography
            variant="h4"
            sx={{
              color: "white",
              opacity: 0.8,
              letterSpacing: 1.5,
            }}
          >
            {t.spinTheWheel}
          </Typography>
        )}

        <style jsx>{`
          @keyframes winnerReveal {
            0% {
              transform: scale(0.85);
              opacity: 0;
              filter: blur(4px);
            }
            100% {
              transform: scale(1);
              opacity: 1;
              filter: blur(0);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
        `}</style>
      </Box>

      {/* Pointer (top centered) */}
      <Box
        sx={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%) rotate(180deg)",
          width: "50px",
          height: "50px",
          backgroundColor: "primary.main",
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          zIndex: 10,
          boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.9)",
        }}
      />

      {/* Wheel */}
      <Box sx={{ position: "relative", width: size, height: size }}>
        {/* Rotating wheel */}
        <Box
          ref={wheelRef}
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            border: "6px solid #fff",
            boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.6)",
            background: wheelBg,
            position: "relative",
            willChange: "transform",
            display: "block",
          }}
        >
          {/* Labels */}
          {participants.map((p, i) => {
            const angle = i * slice + slice / 2;
            return (
              <Box
                key={p._id}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 0,
                  height: 0,
                  transform: `rotate(${angle}deg) translateY(-${labelRadius}px)`,
                  transformOrigin: "center",
                  pointerEvents: "none",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    width: `${labelChord}px`,
                    transform: "translateX(-50%) rotate(90deg)",
                    transformOrigin: "center",
                    textAlign: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: `${fontSize}px`,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.1,
                    userSelect: "none",
                  }}
                  title={p.name}
                >
                  {p.name}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Static center trophy overlay (NOT rotating) */}
        <ICONS.trophy
          sx={{
            fontSize: 60,
            color: "gold",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 11,
            pointerEvents: "none",
            textShadow: "0px 6px 12px rgba(0, 0, 0, 0.6)",
          }}
        />
      </Box>

      <Button
        onClick={handleSpinWheel}
        disabled={spinning || participants.length === 0}
        sx={{
          width: 150,
          height: 50,
          mt: 4,
          backgroundImage: `url(${spinning ? btnSpinClicked : btnSpin})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 2,
          "&:hover": { opacity: 0.8 },
        }}
      />
    </Box>
  );
};

export default SpinningPage;
