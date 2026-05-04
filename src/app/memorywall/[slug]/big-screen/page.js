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

  const filteredMedia = React.useMemo(() => {
    if (!wallConfig) return media;
    const mediaType = wallConfig.cardSettings?.mediaType || "type1";
    
    if (mediaType === "type2") {
      // Type 2: Text/Signature focus. Hide any posts with images.
      return media.filter(item => !item.imageUrl);
    } else {
      // Type 1: Standard/Photo focus. Hide ANY post that has a signature AND hide posts without images.
      return media.filter(item => !!item.imageUrl && !item.signatureUrl);
    }
  }, [media, wallConfig]);

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
      <Container maxWidth={false}>
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
    // Mosaic should ONLY show media with images.
    const imageOnlyMedia = filteredMedia.filter(item => !!item.imageUrl);
    return (
      <MosaicGrid 
        media={imageOnlyMedia} 
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
          overlayEnabled: wallConfig.backgroundLogo.overlayEnabled || false,
          opacity: wallConfig.backgroundLogo.opacity !== undefined ? wallConfig.backgroundLogo.opacity / 100 : 1,
          stampOnImages: wallConfig.backgroundLogo.stampOnImages || false,
          stampPosition: wallConfig.backgroundLogo.stampPosition || 'bottom-right',
        } : null}
      />
    );
  }

  // 🔷 C A R D   M O D E
  if (wallConfig?.mode === "card") {
    const normalizedCardOrder = String(wallConfig.cardSettings?.order || "sequential").toLowerCase();
    const mediaType = wallConfig.cardSettings?.mediaType || "type1";

    return (
      <CardsGrid 
        media={filteredMedia} 
        cardOrder={normalizedCardOrder === "random" ? "random" : "sequential"}
        mediaType={mediaType}
        background={wallConfig.background?.url ? {
          type: getMediaType(wallConfig.background.url),
          value: wallConfig.background.url
        } : null}
        backgroundLogo={wallConfig.backgroundLogo?.url ? {
          enabled: true,
          imageUrl: wallConfig.backgroundLogo.url,
          type: getMediaType(wallConfig.backgroundLogo.url),
          position: 'center',
          overlayEnabled: wallConfig.backgroundLogo.overlayEnabled || false,
          opacity: wallConfig.backgroundLogo.opacity !== undefined ? wallConfig.backgroundLogo.opacity / 100 : 1,
          stampOnImages: wallConfig.backgroundLogo.stampOnImages || false,
          stampPosition: wallConfig.backgroundLogo.stampPosition || 'bottom-right',
        } : null}
        randomSizes={{
          enabled: wallConfig.randomSizes?.enabled || false,
          min: wallConfig.randomSizes?.min || 150,
          max: wallConfig.randomSizes?.max || 300
        }}
        backgroundColor={wallConfig.cardSettings?.backgroundColor || "#ffffff"}
        randomColors={wallConfig.cardSettings?.randomColors || false}
        imageShape={wallConfig.cardSettings?.imageShape || "circle"}
        mediaType2TextColor={wallConfig.cardSettings?.mediaType2TextColor || "#000000"}
        mediaType2SignatureColor={wallConfig.cardSettings?.mediaType2SignatureColor || "#000000"}
      />
    );
  }

  // 🔷 B U B B L E   M O D E
  if (wallConfig?.mode === "bubble") {
    // Bubble should ONLY show media with images.
    const imageOnlyMedia = filteredMedia.filter(item => !!item.imageUrl);
    return (
      <BubbleGrid 
        media={imageOnlyMedia} 
        background={wallConfig.background?.url ? {
          type: getMediaType(wallConfig.background.url),
          value: wallConfig.background.url
        } : null}
        backgroundLogo={wallConfig.backgroundLogo?.url ? {
          enabled: true,
          imageUrl: wallConfig.backgroundLogo.url,
          type: getMediaType(wallConfig.backgroundLogo.url),
          position: 'center',
          overlayEnabled: wallConfig.backgroundLogo.overlayEnabled || false,
          opacity: wallConfig.backgroundLogo.opacity !== undefined ? wallConfig.backgroundLogo.opacity / 100 : 1,
          stampOnImages: wallConfig.backgroundLogo.stampOnImages || false,
          stampPosition: wallConfig.backgroundLogo.stampPosition || 'bottom-right',
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
