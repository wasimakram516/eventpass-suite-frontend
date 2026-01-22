"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    Typography,
    CircularProgress,
    Button,
    Container,
    Stack,
    Card,
    Paper,
} from "@mui/material";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import { useLanguage } from "@/contexts/LanguageContext";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function DigiPassEventDetails() {
    const { eventSlug } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { language } = useLanguage();
    const isArabic = language === "ar";
    const dir = isArabic ? "rtl" : "ltr";

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCardView, setShowCardView] = useState(false);

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

    // Check for view query parameter to show card view
    useEffect(() => {
        const view = searchParams?.get("view");
        if (view === "card") {
            setShowCardView(true);
        }
    }, [searchParams]);

    // Set body background to transparent
    useEffect(() => {
        document.body.style.backgroundColor = "transparent";
        document.documentElement.style.backgroundColor = "transparent";
        const nextRoot = document.getElementById("__next");
        if (nextRoot) {
            nextRoot.style.backgroundColor = "transparent";
        }
        return () => {
            document.body.style.backgroundColor = "";
            document.documentElement.style.backgroundColor = "";
            if (nextRoot) {
                nextRoot.style.backgroundColor = "";
            }
        };
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: "url('/bf-digiPass.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <CircularProgress sx={{ color: "white" }} />
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
                    backgroundImage: "url('/bf-digiPass.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <Typography color="error" variant="h6" sx={{ color: "white" }}>
                    {error}
                </Typography>
            </Box>
        );
    }

    const { logoUrl } = event;

    // Card View (Second Page)
    if (showCardView) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 4, sm: 6, md: 8 },
                    overflow: "hidden",
                }}
                dir={dir}
            >
                {/* Background Image */}
                <Box
                    component="img"
                    src="/bf-digiPass.png"
                    alt="Background"
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
                {/* Orange Circle - Top Right */}
                <Box
                    component="img"
                    src="/orangeCircle.png"
                    alt="Orange Circle"
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: "-19vw",
                        width: "96%",
                        height: "57%",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                />

                <Container
                    maxWidth="sm"
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        zIndex: 1,
                        width: "100%",
                    }}
                >
                    {/* Card */}
                    <Card
                        sx={{
                            width: "100%",
                            maxWidth: { xs: "100%", sm: 450, md: 500 },
                            minHeight: { xs: 500, sm: 600, md: 700 },
                            backgroundColor: "#591c17",
                            borderRadius: { xs: 3, sm: 4 },
                            p: { xs: 4, sm: 5, md: 6 },
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: { xs: 3, sm: 4, md: 5 },
                        }}
                    >
                        {/* Sultanate Image */}
                        <Box
                            component="img"
                            src="/sultanate of oman.png"
                            alt="Sultanate of Oman"
                            sx={{
                                width: "100%",
                                maxWidth: { xs: 200, sm: 250, md: 300 },
                                height: "auto",
                                objectFit: "contain",
                            }}
                        />

                        {/* Event Logo */}
                        {logoUrl && (
                            <Box
                                sx={{
                                    width: "100%",
                                    maxWidth: { xs: 220, sm: 280, md: 350 },
                                    height: "auto",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <Box
                                    component="img"
                                    src={logoUrl}
                                    alt="Event Logo"
                                    sx={{
                                        width: "100%",
                                        height: "auto",
                                        maxHeight: { xs: 150, sm: 200, md: 250 },
                                        objectFit: "contain",
                                    }}
                                />
                            </Box>
                        )}

                        {/* Register and Sign In Buttons */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            sx={{
                                width: "100%",
                                mt: { xs: 2, sm: 3 },
                                gap: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<ICONS.register />}
                                onClick={() => {
                                    router.push(`/digipass/${eventSlug}/register`);
                                }}
                                sx={{

                                    borderColor: "white",
                                    color: "white",
                                    "&:hover": {
                                        borderWidth: 2,
                                        borderColor: "white",
                                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    },
                                }}
                            >
                                Register
                            </Button>

                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<ICONS.login />}
                                onClick={() => {
                                    router.push(`/digipass/${eventSlug}/signin`);
                                }}
                                sx={{

                                    borderColor: "white",
                                    color: "white",
                                    "&:hover": {
                                        borderWidth: 2,
                                        borderColor: "white",
                                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    },
                                }}
                            >
                                Sign in
                            </Button>
                        </Stack>
                    </Card>
                </Container>
            </Box>
        );
    }

    // Welcome View (First Page)
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                backgroundImage: "url('/bf-digiPass.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 4, sm: 6, md: 8 },
            }}
            dir={dir}
        >
            <Container
                maxWidth="md"
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        width: "100%",
                        maxWidth: { xs: "100%", sm: "90%", md: "80%" },
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(10px)",
                        borderRadius: { xs: 3, sm: 4, md: 5 },
                        p: { xs: 4, sm: 5, md: 6 },
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: { xs: 3, sm: 4, md: 5 },
                        textAlign: "center",
                    }}
                >
                    {/* Logo */}
                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: { xs: 200, sm: 300, md: 400 },
                            height: "auto",
                            display: "flex",
                            justifyContent: "center",
                            mb: { xs: 2, sm: 3 },
                        }}
                    >
                        <Box
                            component="img"
                            src="/OQ-orange.png"
                            alt="OQ Logo"
                            sx={{
                                width: "100%",
                                height: "auto",
                                maxHeight: { xs: 80, sm: 120, md: 150 },
                                objectFit: "contain",
                            }}
                        />
                    </Box>

                    {/* Welcome Text */}
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem", lg: "5rem" },
                            fontWeight: 700,
                            color: "black",
                            textAlign: "center",
                            mb: { xs: 2, sm: 3 },
                            lineHeight: 1.2,
                        }}
                    >
                        Welcome
                    </Typography>

                    {/* Description Text */}
                    <Typography
                        variant="body1"
                        sx={{
                            fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" },
                            color: "black",
                            textAlign: "center",
                            maxWidth: { xs: "100%", sm: "90%", md: "80%" },
                            lineHeight: 1.6,
                            mb: { xs: 3, sm: 4 },
                            px: { xs: 1, sm: 2 },
                        }}
                    >
                        Thank you for joining us as we showcase our commitment to
                        excellence and a sustainable future for Oman.
                    </Typography>

                    {/* Proceed Button */}
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        startIcon={<ICONS.next />}
                        onClick={() => {
                            setShowCardView(true);
                        }}

                    >
                        Proceed
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}
