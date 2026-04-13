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
  getPublicSessionBySlug,
  verifyAttendeeBySession,
} from "@/services/stageq/stageqSessionService";
import LanguageSelector from "@/components/LanguageSelector";
import Background from "@/components/Background";
import AppCard from "@/components/cards/AppCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEventBackground } from "@/utils/eventBackground";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    sessionNotFound: "Session not found",
    verify: "Verify",
    startAsking: "Start Asking",
    helperText: "Click to verify your identity and submit questions",
    helperTextNoVerify: "Click the button to start asking questions",
    verifyTitle: "Verify Your Identity",
    verifyPlaceholder: "Enter the value",
    verifySubmit: "Continue",
    verifying: "Verifying…",
    welcome: "Welcome",
  },
  ar: {
    sessionNotFound: "الجلسة غير موجودة",
    verify: "تحقق",
    startAsking: "ابدأ بالأسئلة",
    helperText: "انقر للتحقق من هويتك وإرسال الأسئلة",
    helperTextNoVerify: "انقر على الزر للبدء في طرح الأسئلة",
    verifyTitle: "تحقق من هويتك",
    verifyPlaceholder: "أدخل القيمة",
    verifySubmit: "متابعة",
    verifying: "جارٍ التحقق…",
    welcome: "مرحباً",
  },
};

export default function PublicSessionPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { t, dir } = useI18nLayout(translations);
  const { language: contextLanguage } = useLanguage();
  const currentLang = contextLanguage || "en";
  const videoRef = useRef(null);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Flow: 'welcome' | 'verify'
  const [step, setStep] = useState("welcome");

  // Verification state
  const [fieldValue, setFieldValue] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Fetch session + linked event
  useEffect(() => {
    if (!slug) return;
    getPublicSessionBySlug(slug).then((data) => {
      if (data && !data.error) setSession(data);
      setLoading(false);
    });
  }, [slug]);

  // Background from session's own branding
  const background = useMemo(() => getEventBackground(session, currentLang), [session, currentLang]);

  useEffect(() => {
    if (videoRef.current && background?.fileType === "video" && background?.url) {
      videoRef.current.load();
    }
  }, [background]);

  const needsVerification = !!(session?.linkedEventRegId && session?.primaryField);
  const logoUrl = session?.logoUrl;

  const handleVerify = async () => {
    if (!fieldValue.trim() || !slug) return;
    setVerifying(true);
    const result = await verifyAttendeeBySession(slug, fieldValue.trim());
    if (result?.error || !result?.registrationId) {
      setVerifying(false);
      return;
    }
    sessionStorage.setItem(`stageq_reg_${slug}`, result.registrationId);
    if (result.fullName) sessionStorage.setItem(`stageq_name_${slug}`, result.fullName);
    if (result.company) sessionStorage.setItem(`stageq_company_${slug}`, result.company);
    router.push(`/stageq/${slug}/ask`);
  };

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

  if (!session) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <Background />
        <Typography variant="h5" fontWeight="bold">{t.sessionNotFound}</Typography>
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

          <AppCard dir={dir} sx={{ width: "100%", maxWidth: 800, textAlign: "center", p: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ fontSize: { xs: 28, md: 36 }, color: "primary.main", letterSpacing: "1.5px", mb: 2 }}
            >
              {session.title}
            </Typography>

            {session.description && (
              <Box
                sx={{ fontSize: { xs: 16, md: 18 }, color: "text.secondary", mb: 3 }}
                dangerouslySetInnerHTML={{ __html: session.description }}
              />
            )}

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => needsVerification ? setStep("verify") : router.push(`/stageq/${slug}/ask`)}
                startIcon={needsVerification ? <ICONS.checkCircle /> : <ICONS.forum />}
                sx={{ ...getStartIconSpacing(dir) }}
              >
                {needsVerification ? t.verify : t.startAsking}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 13 }}>
                {needsVerification ? t.helperText : t.helperTextNoVerify}
              </Typography>
            </Box>
          </AppCard>
        </Box>

        <Box dir="ltr"><LanguageSelector top={20} right={20} /></Box>
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
                {session.primaryField
                  ? session.primaryField.replace(/([A-Z])/g, " $1").trim()
                  : ""}
              </Typography>
              <TextField
                fullWidth
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder={t.verifyPlaceholder}
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
