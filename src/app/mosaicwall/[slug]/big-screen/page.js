"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useMediaSocket from "@/hooks/modules/mosaicwall/useMosaicWallMediaSocket";
import { Box, Typography, Container } from "@mui/material";
import { getWallConfigBySlug } from "@/services/mosaicwall/wallConfigService";
import MosaicGrid from "@/components/MosaicGrid";
import CardsGrid from "@/components/CardsGrid";
import { Shift } from "ambient-cbg";
import useI18nLayout from "@/hooks/useI18nLayout";
import LoadingState from "@/components/LoadingState";

const translations = {
  en: {
    socketNotConnected: "Socket not connected",
    noMediaAvailable: "No media available yet.",
  },
  ar: {
    socketNotConnected: "المقبس غير متصل",
    noMediaAvailable: "لا توجد وسائط متاحة بعد.",
  },
};
const BigScreenPage = () => {
  const { slug } = useParams();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [business, setBusiness] = useState(null);
  const { t, dir, align } = useI18nLayout(translations);
  const { connected, connectionError } = useMediaSocket({
    wallSlug: slug,
    onMediaUpdate: (data) => {
      setMedia(data);
      setLoading(false);
    },
  });

  useEffect(() => {
    const loadWallConfigs = async () => {
      const response = await getWallConfigBySlug(slug);
      const wallConfig = response;
      setMode(wallConfig.mode);
      if (wallConfig.business) {
        setBusiness(wallConfig.business);
      }
    };
    loadWallConfigs();
  }, [slug]);

  useEffect(() => {
    setLoading(true);
  }, [slug]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <LoadingState />
      </Box>
    );
  }

  if (!connected) {
    return (
      <Container>
        <Typography variant="body2" color="error" mt={2}>
          {t.socketNotConnected}
          {connectionError ? `: ${connectionError}` : ""}
        </Typography>
      </Container>
    );
  }

  if (!media.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        sx={{ position: "relative" }}
        dir={dir}
      >
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Shift />
        </Box>
        <Typography
          variant="h6"
          textAlign={align}
          mt={4}
          color="#fff"
          zIndex={1}
        >
          {t.noMediaAvailable}
        </Typography>
      </Box>
    );
  }

  // 🔷 M O S A I C   M O D E
  if (mode === "mosaic") {
    return <MosaicGrid media={media} />;
  }

  // 🔷 C A R D   M O D E
  if (mode === "card") {
    return <CardsGrid media={media} />;
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <LoadingState />
    </Box>
  );
};

export default BigScreenPage;
