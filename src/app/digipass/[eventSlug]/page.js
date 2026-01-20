"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box,
    Typography,
    CircularProgress,
    IconButton,
    Button,
    Stack,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import Background from "@/components/Background";
import ICONS from "@/utils/iconUtil";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function DigiPassEventDetails() {
    const { eventSlug } = useParams();
    const router = useRouter();
    const { language } = useLanguage();
    const isArabic = language === "ar";
    const dir = isArabic ? "rtl" : "ltr";

    const t = {
        register: isArabic ? "تسجيل" : "Register",
        signIn: isArabic ? "تسجيل الدخول" : "Sign In",
    };

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        const fetchEvent = async () => {
            const result = await getDigipassEventBySlug(eventSlug);
            if (!result?.error) {
                setEvent(result);
            } else {
                setError(result.message || "Event not found.");
            }
            setLoading(false);
        };
        fetchEvent();
    }, [eventSlug]);

    const getBackground = useMemo(() => {
        if (!event || !event.background) return null;

        const langKey = language === "ar" ? "ar" : "en";
        const bg = event.background[langKey];

        if (
            bg &&
            typeof bg === "object" &&
            bg.url &&
            String(bg.url).trim() !== ""
        ) {
            let fileType = bg.fileType;
            if (!fileType) {
                const urlLower = String(bg.url).toLowerCase();
                if (urlLower.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
                    fileType = "video";
                } else {
                    fileType = "image";
                }
            }
            return {
                url: bg.url,
                fileType: fileType,
            };
        }

        const otherLangKey = language === "ar" ? "en" : "ar";
        const otherBg = event.background[otherLangKey];
        if (
            otherBg &&
            typeof otherBg === "object" &&
            otherBg.url &&
            String(otherBg.url).trim() !== ""
        ) {
            let fileType = otherBg.fileType;
            if (!fileType) {
                const urlLower = String(otherBg.url).toLowerCase();
                if (urlLower.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
                    fileType = "video";
                } else {
                    fileType = "image";
                }
            }
            return {
                url: otherBg.url,
                fileType: fileType,
            };
        }

        return null;
    }, [event, language]);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Background type="dynamic" />
                <CircularProgress />
            </Box>
        );
    }

    if (error || !event) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                }}
            >
                <Background type="dynamic" />
                <Typography color="error" variant="h6">
                    {error}
                </Typography>
            </Box>
        );
    }

    const { name, logoUrl } = event;
    const background = getBackground;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                px: 2,
                py: { xs: 2, md: 4 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                position: "relative",
                zIndex: 0,
                overflow: "hidden",
            }}
            dir={dir}
        >
            {/* Image Background */}
            {background && background.fileType === "image" && background.url && (
                <Box
                    component="img"
                    src={background.url}
                    alt="Event background"
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: -1,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Video Background */}
            {background?.fileType === "video" && background?.url && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: -1,
                        overflow: "hidden",
                    }}
                >
                    <video
                        ref={videoRef}
                        src={background.url}
                        autoPlay
                        playsInline
                        loop
                        muted={isMuted}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </Box>
            )}

            {/* Mute/Unmute Button for Video */}
            {background?.fileType === "video" && (
                <IconButton
                    onClick={() => {
                        setIsMuted(!isMuted);
                        if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                        }
                    }}
                    sx={{
                        position: "fixed",
                        bottom: 20,
                        right: 20,
                        bgcolor: "rgba(0,0,0,0.5)",
                        color: "white",
                        zIndex: 1000,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    }}
                >
                    {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
            )}

            {!background && <Background type="dynamic" />}

            <LanguageSelector top={20} right={20} />

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    width: "100%",
                    maxWidth: "lg",
                    minHeight: "calc(100vh - 80px)",
                    gap: 3,
                    zIndex: 1,
                }}
            >
                {/* Logo */}
                {logoUrl && (
                    <Box
                        sx={{
                            width: { xs: "100%" },
                            maxWidth: { xs: 300, sm: 400, md: 500 },
                            height: "auto",
                            maxHeight: { xs: 120, sm: "none" },
                            borderRadius: 3,
                            overflow: "hidden",
                            boxShadow: 3,
                        }}
                    >
                        <Box
                            component="img"
                            src={logoUrl}
                            alt={`${name} Logo`}
                            sx={{
                                display: "block",
                                width: "100%",
                                height: "auto",
                                maxHeight: { xs: 120, sm: "none" },
                                maxWidth: { xs: "100%", sm: "none" },
                                objectFit: "cover",
                            }}
                        />
                    </Box>
                )}

                {/* Register and Sign In Buttons */}
                <Stack
                    direction="column"
                    spacing={2}
                    sx={{
                        width: { xs: "100%", sm: "auto" },
                        maxWidth: 600,
                        px: 2,
                    }}
                >
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<ICONS.register />}
                        onClick={() => {
                            router.push(`/digipass/${eventSlug}/register`);
                        }}
                        sx={{
                            ...getStartIconSpacing(dir),
                            px: 4,
                            py: 1.5,
                            fontSize: { xs: 16, md: 18 },
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: "none",
                            width: { xs: "100%", sm: "auto" },
                            minWidth: { xs: "100%", sm: 200 },
                        }}
                    >
                        {t.register}
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<ICONS.login />}
                        onClick={() => {
                            router.push(`/digipass/${eventSlug}/signin`);
                        }}
                        sx={{
                            ...getStartIconSpacing(dir),
                            px: 4,
                            py: 1.5,
                            fontSize: { xs: 16, md: 18 },
                            fontWeight: 600,
                            borderRadius: 2,
                            textTransform: "none",
                            width: { xs: "100%", sm: "auto" },
                            minWidth: { xs: "100%", sm: 200 },
                        }}
                    >
                        {t.signIn}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}

