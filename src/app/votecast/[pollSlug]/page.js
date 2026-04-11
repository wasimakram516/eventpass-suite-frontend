"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import {
  getPublicPollBySlug,
  verifyAttendeeByPoll,
} from "@/services/votecast/pollService";
import { translateTexts } from "@/services/translationService";
import LanguageSelector from "@/components/LanguageSelector";
import Background from "@/components/Background";
import AppCard from "@/components/cards/AppCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEventBackground } from "@/utils/eventBackground";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    pollNotFound: "Poll not found",
    verify: "Verify",
    startVoting: "Start Voting",
    helperText: "Click to verify your identity and start voting",
    helperTextNoVerify: "Click the button to begin voting",
    verifyTitle: "Verify Your Identity",
    verifyFieldLabel: "{field}",
    verifyPlaceholder: "Enter the value",
    verifySubmit: "Continue",
    verifying: "Verifying…",
    verifyError: "No matching registration found. Please check your entry.",
  },
  ar: {
    pollNotFound: "الاستطلاع غير موجود",
    verify: "تحقق",
    startVoting: "ابدأ التصويت",
    helperText: "انقر للتحقق من هويتك وبدء التصويت",
    helperTextNoVerify: "انقر على الزر للبدء في التصويت",
    verifyTitle: "تحقق من هويتك",
    verifyFieldLabel: "{field}",
    verifyPlaceholder: "أدخل القيمة",
    verifySubmit: "متابعة",
    verifying: "جارٍ التحقق…",
    verifyError: "لم يُعثر على تسجيل مطابق. يرجى التحقق من المدخلات.",
  },
};

export default function PublicPollPage() {
  const { pollSlug } = useParams();
  const router = useRouter();
  const { t, dir } = useI18nLayout(translations);
  const { language: contextLanguage } = useLanguage();
  const currentLang = contextLanguage || "en";
  const videoRef = useRef(null);

  const [poll, setPoll] = useState(null);
  const [event, setEvent] = useState(null);
  const [translatedPoll, setTranslatedPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Flow: 'welcome' | 'verify'
  const [step, setStep] = useState("welcome");

  // Verification state
  const [fieldValue, setFieldValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Fetch poll + linked event
  useEffect(() => {
    if (!pollSlug) return;
    getPublicPollBySlug(pollSlug).then(async (data) => {
      if (data && !data.error) {
        setPoll(data);
        const eventId = data.linkedEventRegId?._id || data.linkedEventRegId;
        if (eventId) {
          try {
            const { getPublicEventById } = await import("@/services/eventreg/eventService");
            const eventData = await getPublicEventById(eventId);
            if (eventData && !eventData.error) setEvent(eventData);
          } catch { /* ignore */ }
        }
      }
      setLoading(false);
    });
  }, [pollSlug]);

  // Translate poll title/description on language change
  useEffect(() => {
    if (!poll) return;
    const texts = [poll.title, poll.description].filter((v) => v?.trim());
    if (!texts.length) { setTranslatedPoll(poll); return; }
    translateTexts(texts, currentLang)
      .then((results) => {
        let idx = 0;
        setTranslatedPoll({
          ...poll,
          title: poll.title?.trim() ? (results[idx++] ?? poll.title) : poll.title,
          description: poll.description?.trim() ? (results[idx++] ?? poll.description) : poll.description,
        });
      })
      .catch(() => setTranslatedPoll(poll));
  }, [poll, currentLang]);

  // Background from linked event, updates on language switch
  const background = useMemo(() => getEventBackground(event, currentLang), [event, currentLang]);

  // Reload video src when background changes due to language switch
  useEffect(() => {
    if (videoRef.current && background?.fileType === "video" && background?.url) {
      videoRef.current.load();
    }
  }, [background]);

  const needsVerification = !!(poll?.linkedEventRegId && poll?.primaryField);
  const logoUrl = event?.logoUrl;
  const displayPoll = translatedPoll || poll;

  const handleVerify = async () => {
    if (!fieldValue.trim() || !poll?._id) return;
    setVerifying(true);
    setVerifyError("");
    const result = await verifyAttendeeByPoll(poll._id, fieldValue.trim());
    if (result?.error || !result?.registrationId) {
      setVerifyError(t.verifyError);
      setVerifying(false);
      return;
    }
    sessionStorage.setItem(`votecast_reg_${pollSlug}`, result.registrationId);
    if (result.fullName) sessionStorage.setItem(`votecast_name_${pollSlug}`, result.fullName);
    router.push(`/votecast/${pollSlug}/vote`);
  };

  // Shared background renderer
  const renderBackground = () => (
    <>
      {background?.fileType === "image" && background.url && (
        <Box
          key={`bg-image-${currentLang}-${background.url}`}
          component="img"
          src={background.url}
          alt="background"
          sx={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: -1, pointerEvents: "none" }}
        />
      )}
      {background?.fileType === "video" && background.url && (
        <Box sx={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, overflow: "hidden" }}>
          <video
            key={`bg-video-${currentLang}-${background.url}`}
            ref={videoRef}
            src={background.url}
            autoPlay playsInline loop muted={isMuted}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      )}
      {!background && <Background key={`bg-default-${currentLang}`} />}
      {background?.fileType === "video" && (
        <IconButton
          onClick={() => { setIsMuted(!isMuted); if (videoRef.current) videoRef.current.muted = !isMuted; }}
          sx={{ position: "fixed", bottom: 20, right: 20, bgcolor: "rgba(0,0,0,0.5)", color: "white", zIndex: 1000, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      )}
    </>
  );

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <Background />
        <CircularProgress />
      </Box>
    );
  }

  if (!poll) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <Background />
        <Typography variant="h5" fontWeight="bold">{t.pollNotFound}</Typography>
      </Box>
    );
  }

  // ── STEP: WELCOME ──────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <Box
        dir={dir}
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
      >
        {renderBackground()}

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
            gap: 2,
            zIndex: 1,
          }}
        >
          {/* Event Logo */}
          {logoUrl && (
            <Box sx={{ width: "100%", maxWidth: 800, borderRadius: 3, overflow: "hidden", boxShadow: 3 }}>
              <Box
                component="img"
                src={logoUrl}
                alt="Event Logo"
                sx={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
              />
            </Box>
          )}

          {/* Poll Welcome Card */}
          <AppCard dir={dir} sx={{ width: "100%", maxWidth: 800, textAlign: "center", p: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ fontSize: { xs: 28, md: 36 }, color: "primary.main", letterSpacing: "1.5px", mb: 2 }}
            >
              {displayPoll.title}
            </Typography>

            {displayPoll.description && (
              <Box
                sx={{
                  fontSize: { xs: 16, md: 18 },
                  color: "text.secondary",
                  mb: 3,
                  "& h1": { fontSize: "2em", fontWeight: "bold", margin: "0.67em 0" },
                  "& h2": { fontSize: "1.5em", fontWeight: "bold", margin: "0.75em 0" },
                  "& h3": { fontSize: "1.17em", fontWeight: "bold", margin: "0.83em 0" },
                  "& ul, & ol": { margin: "1em 0", paddingLeft: "2.5em" },
                  "& ul": { listStyleType: "disc" },
                  "& ol": { listStyleType: "decimal" },
                  "& li": { margin: "0.5em 0" },
                  "& p": { margin: "1em 0" },
                  "& strong, & b": { fontWeight: "bold" },
                  "& em, & i": { fontStyle: "italic" },
                  "& u": { textDecoration: "underline" },
                  "& s, & strike": { textDecoration: "line-through" },
                }}
                dangerouslySetInnerHTML={{ __html: displayPoll.description }}
              />
            )}

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => needsVerification ? setStep("verify") : router.push(`/votecast/${pollSlug}/vote`)}
                startIcon={needsVerification ? <ICONS.checkCircle /> : <ICONS.poll />}
                sx={{ ...getStartIconSpacing(dir) }}
              >
                {needsVerification ? t.verify : t.startVoting}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 13 }}>
                {needsVerification ? t.helperText : t.helperTextNoVerify}
              </Typography>
            </Box>
          </AppCard>
        </Box>

        <LanguageSelector top={20} right={20} />
      </Box>
    );
  }

  // ── STEP: VERIFY ───────────────────────────────────────────────────────────
  return (
    <Box
      dir={dir}
      sx={{
        minHeight: "100vh",
        px: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {renderBackground()}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          width: "100%",
          maxWidth: 420,
          zIndex: 1,
        }}
      >
        {logoUrl && (
          <Box sx={{ width: "100%", borderRadius: 3, overflow: "hidden", boxShadow: 3 }}>
            <Box
              component="img"
              src={logoUrl}
              alt="Event Logo"
              sx={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
            />
          </Box>
        )}

        <AppCard dir={dir} sx={{ width: "100%", textAlign: "center", p: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: 24, md: 28 }, color: "primary.main", mb: 1 }}>
            {t.verifyTitle}
          </Typography>
          <Stack spacing={2} mt={3}>
            <Box sx={{ textAlign: dir === "rtl" ? "right" : "left" }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                {t.verifyFieldLabel.replace(
                  "{field}",
                  poll.primaryField ? poll.primaryField.replace(/([A-Z])/g, " $1").trim() : ""
                )}
              </Typography>
              <TextField
                fullWidth
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder={t.verifyPlaceholder}
                error={!!verifyError}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                inputProps={{ dir: "auto" }}
              />
            </Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={verifying || !fieldValue.trim()}
              onClick={handleVerify}
              startIcon={verifying ? <CircularProgress size={18} color="inherit" /> : <ICONS.checkCircle />}
              sx={{ ...getStartIconSpacing(dir) }}
            >
              {verifying ? t.verifying : t.verifySubmit}
            </Button>
          </Stack>
        </AppCard>
      </Box>

      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
