"use client";
import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import {
  addOrUpdateParticipantsInBulk,
  getBulkParticipantsForSpinWheel,
} from "@/services/eventwheel/spinWheelParticipantService";
import btnReady from "@/assets/icons and assets/ready1.png";
import btnReadyClicked from "@/assets/icons and assets/ready2.png";
import background from "@/assets/prize-1080x1920.jpg";
import imgDivider from "@/assets/icons and assets/divider.png";
import imgShuffle from "@/assets/icons and assets/shuffle.png";
import { getSpinWheelBySlug } from "@/services/eventwheel/spinWheelService";
import Image from "next/image";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    welcomeTo: "Welcome to",
    loadingEvent: "Loading Event...",
    enterNames: "Enter the names and",
    goodLuck: "good luck to everyone",
    placeholder: "Enter names, one per line",
    shuffle: "Shuffle",
    alertMessage: "Please enter at least one participant name!",
  },
  ar: {
    welcomeTo: "مرحباً بك في",
    loadingEvent: "جاري تحميل الحدث...",
    enterNames: "أدخل الأسماء و",
    goodLuck: "حظ سعيد للجميع",
    placeholder: "أدخل الأسماء، اسم واحد في كل سطر",
    shuffle: "خلط",
    alertMessage: "يرجى إدخال اسم مشارك واحد على الأقل!",
  },
};

const ParticipantsUserPage = () => {
  const params = useParams();
  const shortName = params.slug;
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [bulkNames, setBulkNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [btnClicked, setBtnClicked] = useState(false);
  const { t, dir, align } = useI18nLayout(translations);

  useEffect(() => {
    const fetchEventAndParticipants = async () => {
      const eventData = await getSpinWheelBySlug(shortName);
      setEvent(eventData);
      const existingParticipants = await getBulkParticipantsForSpinWheel(
        shortName
      );
      if (existingParticipants.length > 0) {
        setBulkNames(existingParticipants.map((p) => p.name).join("\n"));
      }
    };

    fetchEventAndParticipants();
  }, [shortName]);

  // ✅ Shuffle Names Randomly
  const handleShuffleNames = () => {
    const namesArray = bulkNames
      .split("\n")
      .filter((name) => name.trim() !== "");
    setBulkNames(namesArray.sort(() => Math.random() - 0.5).join("\n"));
  };

  // ✅ Submit Names to Backend (Update if Changed)
  const handleReady = async () => {
    if (!bulkNames.trim()) {
      alert(t.alertMessage);
      return;
    }

    setBtnClicked(true); // 🔥 Show Clicked Button

    const formattedNames = bulkNames.split("\n").map((name) => name.trim());

    setLoading(true);
    await addOrUpdateParticipantsInBulk({
      slug: shortName,
      participants: formattedNames,
    });
    router.push(`/eventwheel/spin/${shortName}`);
    setLoading(false);
    setTimeout(() => setBtnClicked(false), 2000); // 🔥 Reset Button After 2 Secs
  };
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: `url(${event?.backgroundUrl || background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        p: 4,
      }}
      dir={dir}
    >
      <Typography variant="h4" fontWeight="bold" textAlign={align}>
        {event ? `${t.welcomeTo} ${event.slug}` : t.loadingEvent}
      </Typography>

      <Image
        src={imgDivider}
        alt="Divider"
        height={30}
        style={{
          width: "auto",
          maxWidth: "300px",
          marginTop: "16px",
          marginBottom: "16px",
        }}
      />

      <Typography variant="body1" sx={{ mb: 2 }}>
        {t.enterNames} <strong>{t.goodLuck}</strong>
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={8}
        value={bulkNames}
        onChange={(e) => setBulkNames(e.target.value)}
        variant="outlined"
        placeholder={t.placeholder}
        sx={{
          maxWidth: 400,
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            "& fieldset": {
              border: "none",
              borderRadius: 2,
            },
            "&:hover fieldset": {
              borderColor: "black",
              borderWidth: "2px",
              border: "2px solid black",
              borderRadius: 2,
            },
            "&.Mui-focused fieldset": {
              borderColor: "black",
              borderWidth: "2px",
              border: "2px solid black",
              borderRadius: 2,
            },
          },
        }}
      />

      {/* ✅ Buttons Section */}
      <Box
        mt={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
        }}
      >
        {/* Shuffle Button */}
        <Button
          onClick={handleShuffleNames}
          startIcon={
            <Box sx={{ width: 24, height: 24, position: "relative" }}>
              <Image
                src={imgShuffle}
                alt="Shuffle Icon"
                fill
                style={{ objectFit: "contain" }}
              />
            </Box>
          }
          sx={{
            ...getStartIconSpacing(dir), // ✅ Now this will apply
            display: "flex",
            alignItems: "center",
            padding: "6px 12px",
            borderRadius: 2,
            backgroundColor: "transparent",
            color: "#333",
            "&:hover": { opacity: 0.8 },
          }}
        >
          {t.shuffle}
        </Button>

        {/* Ready Button with Dynamic Background */}
        <Button
          onClick={handleReady}
          disabled={loading}
          sx={{
            width: 150,
            height: 50,
            backgroundImage: `url(${
              btnClicked ? btnReadyClicked.src : btnReady.src
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 2,
            "&:hover": { opacity: 0.8 },
          }}
        />
      </Box>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
};
export default ParticipantsUserPage;
