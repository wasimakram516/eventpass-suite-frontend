"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Button, IconButton } from "@mui/material";
import Confetti from "react-confetti";
import { getParticipantsBySlug } from "@/services/eventwheel/spinWheelParticipantService";
const btnSpin = "/freespin1.png";
const btnSpinClicked = "/freespin2.png";
import { getSpinWheelBySlug } from "@/services/eventwheel/spinWheelService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";

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

const SpinningPage = () => {
  const params = useParams();
  const router = useRouter();
  const shortName = params.slug;
  const [participants, setParticipants] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [wheelKey, setWheelKey] = useState(0); // 🔄 Force Re-render of the Wheel
  const wheelRef = useRef(null);
  const [eventData, setEventData] = useState([]);
  const { t, dir, align } = useI18nLayout(translations);

  const fetchParticipants = useCallback(async () => {
    const data = await getParticipantsBySlug(shortName);
    if (!data) {
      router.push("/");
      return;
    }
    setParticipants(data);
  }, [shortName]);

  const fetchSpinWheelData = useCallback(async () => {
    const wheelData = await getSpinWheelBySlug(shortName);
    if (wheelData) {
      setEventData(wheelData);
    }
  }, [shortName]);

  useEffect(() => {
    fetchParticipants();
    fetchSpinWheelData();
  }, [fetchParticipants, fetchSpinWheelData]);

  const resetWheel = () => {
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none"; // 🔄 Remove animation
      wheelRef.current.style.transform = "rotate(0deg)"; // 🔄 Reset rotation
    }
    setWheelKey((prevKey) => prevKey + 1); // 🔄 Force re-render
  };

  const handleSpinWheel = async () => {
    if (spinning || participants.length === 0) return;

    setSpinning(true);
    setSelectedWinner(null);

    // 🔄 Reset Wheel Before Spinning Again
    resetWheel();

    // 🔄 Fetch Updated Participants and Spin Wheel Data
    await fetchParticipants();
    await fetchSpinWheelData();

    if (participants.length === 0) {
      setSpinning(false);
      return;
    }

    const totalSpins = 6; // Fixed number of spins
    const sectorSize = 360 / participants.length;
    const winnerIndex = Math.floor(Math.random() * participants.length); // Random winner

    // 🎯 Calculate Final Rotation to Align Winner under Pointer
    const finalAngle = 360 - winnerIndex * sectorSize - sectorSize / 2;
    const totalRotation = totalSpins * 360 + finalAngle; // Always clockwise

    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 4s ease-out";
        wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
      }
    }, 100); // ⏳ Small delay to ensure reset is applied

    setTimeout(() => {
      setSelectedWinner(participants[winnerIndex]);
      setSpinning(false);
    }, 4100);
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

      <Typography
        variant="h2"
        sx={{ mb: 2, color: "white", textAlign: "center" }}
      >
        {selectedWinner
          ? `${t.winner}  ${selectedWinner.name}`
          : spinning
          ? t.spinning
          : t.spinTheWheel}
      </Typography>

      {/* 🎯 Enhanced Pointer Indicator (Now at the top, pointing downward) */}
      <Box
        sx={{
          position: "absolute",
          top: "20%",
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

      {/* 🎡 Spinning Wheel with Borders */}
      <Box
        sx={{
          position: "relative",
          width: 350,
          height: 350,
        }}
      >
        {/* 🎡 The Wheel */}
        <Box
          key={wheelKey} // 🔄 Force Re-render when Wheel Resets
          ref={wheelRef}
          sx={{
            width: 350,
            height: 350,
            borderRadius: "50%",
            border: "6px solid #fff",
            boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.6)",
            background: `conic-gradient(${participants
              .map(
                (_, i) =>
                  `hsl(${(i * 360) / participants.length}, 70%, 50%) ${
                    i * (360 / participants.length)
                  }deg ${(i + 1) * (360 / participants.length)}deg`
              )
              .join(", ")})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: spinning ? "transform 4s ease-out" : "none",
          }}
        >
          {/* 🏷️ Display Names inside the Wheel */}
          {participants.map((participant, index) => {
            const angle = (index * 360) / participants.length;
            const fontSize = participants.length > 10 ? "8px" : "10px";
            return (
              <Typography
                key={participant._id}
                variant="body2"
                sx={{
                  position: "absolute",
                  transform: `rotate(${angle}deg) translate(110px) rotate(-${angle}deg)`,
                  transformOrigin: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: fontSize,
                  textAlign: align,
                  width: "80px",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderRadius: "4px",
                  padding: "2px 4px",
                }}
              >
                {participant.name}
              </Typography>
            );
          })}
        </Box>

        {/* 🏆 Enhanced Center Icon */}
        <ICONS.trophy
          sx={{
            fontSize: 60,
            color: "gold",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 11,
            textShadow: "0px 6px 12px rgba(0, 0, 0, 0.6)",
          }}
        />
      </Box>

      <Button
        onClick={handleSpinWheel}
        disabled={spinning}
        sx={{
          width: 150,
          height: 50,
          mt: 4,
          backgroundImage: `url(${
            spinning
              ? btnSpinClicked.src || btnSpinClicked
              : btnSpin.src || btnSpin
          })`, // 🔥 Switch on Click
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 2,
          "&:hover": { opacity: 0.8 },
        }}
      />
      <LanguageSelector top={20} right={20} />
    </Box>
  );
};

export default SpinningPage;
