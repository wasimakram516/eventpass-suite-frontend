"use client";
import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import {
  addOrUpdateParticipantsInBulk,
  getBulkParticipantsForSpinWheel,
} from "@/services/eventwheel/spinWheelParticipantService";
const btnReady = "/icons%20and%20assets/ready1.png";
const btnReadyClicked = "/icons%20and%20assets/ready2.png";
const background = "/prize-1080x1920.jpg";
const imgDivider = "/icons%20and%20assets/divider.png";
const imgShuffle = "/icons%20and%20assets/shuffle.png";
import { getSpinWheelBySlug } from "@/services/eventwheel/spinWheelService";
import Image from "next/image";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import LoadingState from "@/components/LoadingState";

const translations = {
  en: {
    welcomeTo: "Welcome to",
    enterNames: "Enter the names and",
    goodLuck: "good luck to everyone",
    placeholder: "Enter names, one per line",
    shuffle: "Shuffle",
    alertMessage: "Please enter at least one participant name!",
  },
  ar: {
    welcomeTo: "مرحباً بك في",
    enterNames: "أدخل الأسماء و",
    goodLuck: "حظ سعيد للجميع",
    placeholder: "أدخل الأسماء، اسم واحد في كل سطر",
    shuffle: "خلط",
    alertMessage: "يرجى إدخال اسم مشارك واحد على الأقل!",
  },
};

const ParticipantsUserPage = () => {
  const params = useParams();
  const shortName = params.wheelSlug;
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

  const handleShuffleNames = () => {
    const namesArray = bulkNames
      .split("\n")
      .filter((name) => name.trim() !== "");
    setBulkNames(namesArray.sort(() => Math.random() - 0.5).join("\n"));
  };

  const handleReady = async () => {
    if (!bulkNames.trim()) {
      alert(t.alertMessage);
      return;
    }

    setBtnClicked(true);

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
  if (!event) return <LoadingState />;
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
        {`${t.welcomeTo} ${event.slug}`}
      </Typography>

      <Image
        src={imgDivider}
        alt="Divider"
        width={300}
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
          borderRadius: 4,
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        }}
      />

      <Box
        mt={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
        }}
      >
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
            ...getStartIconSpacing(dir),
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
        <Box
          component="button"
          onClick={handleReady}
          disabled={loading}
          sx={{
            width: 150,
            height: 50,
            backgroundImage: `url(${btnClicked ? btnReadyClicked : btnReady})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            border: "none",
            borderRadius: 2,
            cursor: loading ? "not-allowed" : "pointer",
            outline: "none",
            "&:hover": { opacity: 0.8 },
          }}
        />
      </Box>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
};
export default ParticipantsUserPage;
