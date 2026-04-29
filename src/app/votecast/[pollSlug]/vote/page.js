"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Button,
  CircularProgress,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import {
  getPublicPollBySlug,
  voteOnPoll,
} from "@/services/votecast/pollService";
import { translateTexts } from "@/services/translationService";
import LanguageSelector from "@/components/LanguageSelector";
import Background from "@/components/Background";
import { getEventBackground } from "@/utils/eventBackground";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  en: {
    welcome: "Welcome",
    noQuestions: "This poll has no questions yet.",
    processing: "Processing...",
    thankYou: "Thank You!",
    voteRecorded: "Your vote has been recorded successfully.",
    waitForResults: "Please wait for the host/admin to reveal the results.",
    done: "Done",
    closingAutomatically: "Closing automatically…",
    pollNotFound: "Poll not found",
  },
  ar: {
    welcome: "مرحباً",
    noQuestions: "لا توجد أسئلة في هذا الاستطلاع بعد.",
    processing: "جاري المعالجة...",
    thankYou: "شكرًا لك!",
    voteRecorded: "تم تسجيل صوتك بنجاح.",
    waitForResults: "يرجى انتظار المضيف/المسؤول للكشف عن النتائج.",
    done: "تم",
    closingAutomatically: "سيُغلق تلقائيًا…",
    pollNotFound: "الاستطلاع غير موجود",
  },
};

export default function PollVotingPage() {
  const { pollSlug } = useParams();
  const router = useRouter();
  const { t, dir, align } = useI18nLayout(translations);
  const { language: contextLanguage } = useLanguage();
  const currentLang = contextLanguage || "en";
  const videoRef = useRef(null);
  const autoSubmitRef = useRef(null);

  const [poll, setPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [translatedQuestions, setTranslatedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [highlightedOption, setHighlightedOption] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [finished, setFinished] = useState(false);
  const [closeTimer, setCloseTimer] = useState(5);

  // Read registrationId and name saved during verification step
  const registrationId = typeof window !== "undefined"
    ? sessionStorage.getItem(`votecast_reg_${pollSlug}`)
    : null;
  const userName = typeof window !== "undefined"
    ? sessionStorage.getItem(`votecast_name_${pollSlug}`)
    : null;

  // Session token for anonymous (unlinked) polls — persists for this browser session
  const sessionToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    const key = `votecast_session_${pollSlug}`;
    let token = sessionStorage.getItem(key);
    if (!token) {
      token = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(key, token);
    }
    return token;
  }, [pollSlug]);
  const welcomeMessage = userName ? `${t.welcome}, ${userName}!` : `${t.welcome}!`;

  // Fetch poll + linked event
  useEffect(() => {
    if (!pollSlug) return;
    getPublicPollBySlug(pollSlug).then((data) => {
      if (data && !data.error) {
        setPoll(data);
        setQuestions(data.questions || []);
      }
      setLoading(false);
    });
  }, [pollSlug]);

  // Translate questions on language change
  useEffect(() => {
    if (!questions.length) { setTranslatedQuestions(questions); return; }
    const allTexts = [];
    questions.forEach((q) => {
      if (q.question?.trim()) allTexts.push(q.question);
      (q.options || []).forEach((o) => { if (o.text?.trim()) allTexts.push(o.text); });
    });
    if (!allTexts.length) { setTranslatedQuestions(questions); return; }
    translateTexts(allTexts, currentLang)
      .then((results) => {
        let idx = 0;
        const translated = questions.map((q) => {
          const question = q.question?.trim() ? (results[idx++] ?? q.question) : q.question;
          const options = (q.options || []).map((o) => ({
            ...o,
            text: o.text?.trim() ? (results[idx++] ?? o.text) : o.text,
          }));
          return { ...q, question, options };
        });
        setTranslatedQuestions(translated);
      })
      .catch(() => setTranslatedQuestions(questions));
  }, [questions, currentLang]);

  // Countdown after all votes submitted
  useEffect(() => {
    if (!finished) return;
    setCloseTimer(5);
    const interval = setInterval(() => {
      setCloseTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finished]);

  // Navigate away once countdown reaches 0
  useEffect(() => {
    if (finished && closeTimer === 0) {
      handleRestart();
    }
  }, [finished, closeTimer]);

  // Background from linked event, updates on language switch
  const background = useMemo(() => getEventBackground(poll, currentLang), [poll, currentLang]);

  // Reload video src when background changes due to language switch
  useEffect(() => {
    if (videoRef.current && background?.fileType === "video" && background?.url) {
      videoRef.current.load();
    }
  }, [background]);

  const handleVote = async (optionIndex) => {
    if (submitting || !poll?._id) return;
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion?._id) return;
    setSubmitting(true);
    try {
      const anonToken = poll.linkedEventRegId ? null : sessionToken;
      await voteOnPoll(poll._id, currentQuestion._id, optionIndex, registrationId, anonToken);
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setHighlightedOption(null);
          setSliderValue(0);
          setSubmitting(false);
        } else {
          setFinished(true);
        }
      }, 800);
    } catch {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    clearTimeout(autoSubmitRef.current);
    router.push(`/votecast/${pollSlug}`);
  };

  // Background renderer
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
      </Box>
    );
  }

  if (!poll) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Background />
        <Typography variant="h5" fontWeight="bold">{t.pollNotFound}</Typography>
      </Container>
    );
  }

  if (!questions.length) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {renderBackground()}
        <Typography variant="h6" color="text.secondary">{t.noQuestions}</Typography>
      </Box>
    );
  }

  const currentQuestion = translatedQuestions[currentIndex] || questions[currentIndex];
  const optionCount = currentQuestion?.options?.length || 0;
  const pollType = poll.type || "options";
  const logoUrl = poll?.logoUrl;

  return (
    <>
      <Box dir="ltr"><LanguageSelector top={20} right={20} /></Box>
      <Box
        dir={dir}
        sx={{
          height: "100vh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          px: 2,
        }}
      >
        {renderBackground()}

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: { xs: 1.5, sm: 2 },
            zIndex: 2,
            gap: 1,
          }}
        >
          <Typography
            sx={{
              color: "primary.main",
              fontSize: { xs: "6vw", sm: "5vw", md: "4.5vw" },
              fontWeight: "bold",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {welcomeMessage}
          </Typography>

          {logoUrl && (
            <Box
              sx={{
                height: { xs: 80, sm: 110 },
                width: "100%",
                maxWidth: "95%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={logoUrl}
                alt="Event Logo"
                sx={{ maxHeight: "100%", width: "100%", objectFit: "contain" }}
              />
            </Box>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Card
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: "95%",
              borderRadius: 4,
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
            }}
          >
            <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ fontSize: { xs: "1.2rem", md: "1.4rem" }, textAlign: "center", width: "100%", mb: 2 }}
              >
                {currentQuestion?.question}
              </Typography>

              {pollType === "slider" ? (
                <>
                  <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ rowGap: 3, mt: 1, mb: 1 }}>
                    {(currentQuestion?.options || []).map((option, idx) => (
                      <Box
                        key={idx}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        onClick={() => {
                          setHighlightedOption(idx);
                          setSliderValue(idx);
                          clearTimeout(autoSubmitRef.current);
                          autoSubmitRef.current = setTimeout(() => handleVote(idx), 500);
                        }}
                        sx={{
                          p: 4, borderRadius: 2, transition: "all 0.3s ease",
                          borderColor: highlightedOption === idx ? "primary.main" : "grey.300",
                          cursor: "pointer", minHeight: 150,
                        }}
                      >
                        {option.imageUrl && (
                          <Box sx={{ width: "100%", maxWidth: "clamp(50px, 15vw, 120px)", aspectRatio: "1 / 1", transition: "transform 0.25s ease", transform: highlightedOption === idx ? "scale(1.15)" : "scale(1)" }}>
                            <Box component="img" src={option.imageUrl} alt={option.text || "option"} sx={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 2, display: "block" }} />
                          </Box>
                        )}
                        {option.text && (
                          <Typography variant="caption" textAlign={align} fontWeight="bold" color={highlightedOption === idx ? "primary.main" : "text.secondary"} sx={{ wordBreak: "break-word", fontSize: { xs: "0.75rem", sm: "0.8rem" }, maxWidth: 80 }}>
                            {option.text}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1, mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    {currentLang === "ar"
                      ? "يمكنك اختيار الخيارات بالنقر عليها أو بتحريك المنزلق"
                      : "You can select options by clicking them or moving the slider"}
                  </Typography>

                  <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 1 }}>
                    <Slider
                      value={sliderValue}
                      onChange={(e, val) => { setSliderValue(val); const closest = Math.round(val); if (closest !== highlightedOption) setHighlightedOption(closest); }}
                      onChangeCommitted={(e, val) => { const finalIndex = Math.round(val); clearTimeout(autoSubmitRef.current); autoSubmitRef.current = setTimeout(() => handleVote(finalIndex), 700); }}
                      step={0.01} min={0} max={optionCount - 1}
                      sx={{ width: { xs: "85%", sm: 400 }, mt: 1, "& .MuiSlider-thumb": { width: 24, height: 24, bgcolor: "white", border: "2px solid", borderColor: "primary.main" }, "& .MuiSlider-track": { height: 8, bgcolor: "primary.main" }, "& .MuiSlider-rail": { height: 8, bgcolor: "grey.300" } }}
                    />
                  </Box>
                </>
              ) : (
                <Stack spacing={2} width="100%">
                  {(currentQuestion?.options || []).map((option, idx) => {
                    const isSelected = highlightedOption === idx;
                    const canSelect = highlightedOption === null;
                    return (
                      <Box
                        key={idx}
                        onClick={() => {
                          setHighlightedOption(idx);
                          clearTimeout(autoSubmitRef.current);
                          autoSubmitRef.current = setTimeout(() => handleVote(idx), 500);
                        }}
                        sx={{
                          p: 2, border: "2px solid",
                          borderColor: isSelected ? "primary.main" : "grey.300",
                          borderRadius: 3,
                          cursor: canSelect ? "pointer" : "default",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          transition: "all 0.3s",
                          "&:hover": canSelect ? { bgcolor: "rgba(0,0,0,0.05)" } : {},
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ gap: dir === "rtl" ? 2 : 0 }}>
                          {option.imageUrl && (
                            <Box sx={{ width: "100%", maxWidth: "clamp(50px, 15vw, 120px)", aspectRatio: "1 / 1", flexShrink: 0, transition: "transform 0.25s ease", transform: isSelected ? "scale(1.15)" : "scale(1)" }}>
                              <Box component="img" src={option.imageUrl} alt={option.text || "option"} sx={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 2, display: "block" }} />
                            </Box>
                          )}
                          {option.text && (
                            <Typography variant="body1" fontWeight="bold" sx={{ transition: "opacity 0.2s ease", opacity: isSelected ? 1 : 0.8 }}>
                              {option.text}
                            </Typography>
                          )}
                        </Stack>
                        {isSelected && (submitting ? <Box sx={{ width: 24, height: 24 }} /> : <ICONS.checkCircle fontSize="small" />)}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Thank You Dialog */}
      <Dialog
        open={finished}
        onClose={handleRestart}
        PaperProps={{ sx: { borderRadius: 4, p: 4, maxWidth: { xs: "90%", sm: 420 }, width: { xs: "90%", sm: "auto" }, mx: "auto", textAlign: "center", boxShadow: 6 } }}
      >
        <DialogTitle sx={{ fontSize: "2rem", fontWeight: "bold", color: "primary.main", textAlign: "center", pb: 1 }}>
          {t.thankYou}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Typography variant="body1" fontWeight="medium" color="text.secondary" textAlign="center">{t.voteRecorded}</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">{t.waitForResults}</Typography>
          <Box sx={{ mt: 3, width: 72, height: 72, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main">{closeTimer}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">{t.closingAutomatically}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 3 }}>
          <Button variant="contained" size="large" onClick={handleRestart} startIcon={<ICONS.check />}>
            {t.done}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
