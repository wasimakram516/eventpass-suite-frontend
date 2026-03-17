"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useMediaSocket from "@/hooks/modules/memorywall/useMemoryWallMediaSocket";
import { Box, Typography, Container } from "@mui/material";
import { getWallConfigBySlug } from "@/services/memorywall/wallConfigService";
import MosaicGrid from "@/components/memorywall/MosaicGrid";
import CardsGrid from "@/components/memorywall/CardsGrid";
import { Shift } from "ambient-cbg";
import useI18nLayout from "@/hooks/useI18nLayout";
import LoadingState from "@/components/LoadingState";
import BubbleGrid from "@/components/memorywall/BubbleGrid";

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
  const [wallConfig, setWallConfig] = useState(null);
  const [business, setBusiness] = useState(null);
  const { t, dir, align } = useI18nLayout(translations);
  const { connected, connectionError } = useMediaSocket({
    wallSlug: slug,
    onMediaUpdate: (data) => {
      setMedia(() => [...data]);
      setLoading(false);
    },
  });

  useEffect(() => {
    const loadWallConfigs = async () => {
      const response = await getWallConfigBySlug(slug);
      setWallConfig(response);
      if (response.business) {
        setBusiness(response.business);
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

  const getMediaType = (url) => {
    if (!url) return null;
    const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i);
    return isVideo ? 'video' : 'image';
  };

  // 🔷 M O S A I C   M O D E
  if (wallConfig?.mode === "mosaic") {
    return (
      <MosaicGrid 
        media={media} 
        rows={wallConfig.mosaicGrid?.rows || 10}
        cols={wallConfig.mosaicGrid?.cols || 15}
        background={wallConfig.background?.url ? {
          type: getMediaType(wallConfig.background.url),
          value: wallConfig.background.url
        } : null}
        backgroundLogo={wallConfig.backgroundLogo?.url ? {
          enabled: true,
          imageUrl: wallConfig.backgroundLogo.url,
          type: getMediaType(wallConfig.backgroundLogo.url),
          position: 'center',
          opacity: 0.1
        } : null}
      />
    );
  }

  // 🔷 C A R D   M O D E
  if (wallConfig?.mode === "card") {
    const normalizedCardOrder = String(wallConfig.cardSettings?.order || "sequential").toLowerCase();
    return (
      <CardsGrid 
        media={media} 
        cardOrder={normalizedCardOrder === "random" ? "random" : "sequential"}
        inputType={wallConfig.cardSettings?.inputType || "text"}
        background={wallConfig.background?.url ? {
          type: getMediaType(wallConfig.background.url),
          value: wallConfig.background.url
        } : null}
        backgroundLogo={wallConfig.backgroundLogo?.url ? {
          enabled: true,
          imageUrl: wallConfig.backgroundLogo.url,
          type: getMediaType(wallConfig.backgroundLogo.url),
          position: 'center',
          opacity: 0.1
        } : null}
        randomSizes={{
          enabled: wallConfig.randomSizes?.enabled || false,
          min: wallConfig.randomSizes?.min || 150,
          max: wallConfig.randomSizes?.max || 300
        }}
      />
    );
  }

    // 🔷 B U B B L E   M O D E
  if (wallConfig?.mode === "bubble") {
    return (
      <BubbleGrid 
        media={media} 
        background={wallConfig.background?.url ? {
          type: getMediaType(wallConfig.background.url),
          value: wallConfig.background.url
        } : null}
        backgroundLogo={wallConfig.backgroundLogo?.url ? {
          enabled: true,
          imageUrl: wallConfig.backgroundLogo.url,
          type: getMediaType(wallConfig.backgroundLogo.url),
          position: 'center',
          opacity: 0.1
        } : null}
        randomSizes={wallConfig.randomSizes?.enabled}
        minSize={wallConfig.randomSizes?.min || 100}
        maxSize={wallConfig.randomSizes?.max || 300}
      />
    );
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
