"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { SURVEY_PALETTES } from "@/styles/theme";
import {
  Box,
  Button,
  Container,
  LinearProgress,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Stack,
} from "@mui/material";
import { useParams, useSearchParams } from "next/navigation";
import AppCard from "@/components/cards/AppCard";
import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import { submitSurveyResponseBySlug } from "@/services/surveyguru/surveyResponseService";
import ICONS from "@/utils/iconUtil";
import Background from "@/components/Background";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateTexts } from "@/services/translationService";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const guessType = (q) => (q?.type || q?.questionType || "").toLowerCase();

export const surveyTranslations = {
  en: {
    // General
    loading: "Loading…",
    surveyUnavailable: "Survey unavailable",
    surveyNotFound: "This survey cannot be found.",
    noQuestionFound: "No question found",
    noQuestionsToDisplay: "There are no questions to display in this survey.",
    thankYouTitle: "Thank you!",
    thankYouMessage: "Your response has been recorded successfully.",
    youMayClose: "You may close this tab now.",

    // Attendee screen
    fullName: "Full Name",
    fullNameRequired: "Full name is required",
    email: "Email",
    emailRequired: "Email is required",
    companyOptional: "Organization (optional)",
    startSurvey: "Start survey",
    anonymousNoticeTitle: "Anonymous Survey",
    anonymousNoticeBody:
      "This survey is anonymous. Your personal information is not collected or stored with your answers.",

    // Survey footer
    previous: "Previous",
    next: "Next",
    nextQuestion: "Next question",
    submit: "Submit",

    // Text question placeholder
    typeYourAnswer: "Type your answer",

    // Anonymous mode (if needed for any badge)
    anonymousSurvey: "Anonymous Survey",
  },

  ar: {
    // General
    loading: "جاري التحميل…",
    surveyUnavailable: "الاستبيان غير متاح",
    surveyNotFound: "تعذر العثور على هذا الاستبيان.",
    noQuestionFound: "لا توجد أسئلة",
    noQuestionsToDisplay: "لا توجد أسئلة لعرضها في هذا الاستبيان.",
    thankYouTitle: "شكرًا لك!",
    thankYouMessage: "تم تسجيل إجابتك بنجاح.",
    youMayClose: "يمكنك الآن إغلاق هذه الصفحة.",

    // Attendee screen
    fullName: "الاسم الكامل",
    fullNameRequired: "الاسم الكامل مطلوب",
    email: "البريد الإلكتروني",
    emailRequired: "البريد الإلكتروني مطلوب",
    companyOptional: "المؤسسة (اختياري)",
    startSurvey: "ابدأ الاستبيان",
    anonymousNoticeTitle: "استبيان مجهول",
    anonymousNoticeBody:
      "هذا الاستبيان مجهول. لا يتم جمع أو حفظ معلوماتك الشخصية مع إجاباتك.",

    // Survey footer
    previous: "السابق",
    next: "التالي",
    nextQuestion: "السؤال التالي",
    submit: "إرسال",

    // Text question placeholder
    typeYourAnswer: "اكتب إجابتك هنا",

    // Anonymous mode
    anonymousSurvey: "استبيان مجهول الهوية",
  },
};

export default function PublicSurveyPage() {
  const { lang, formSlug: slug } = useParams();
  const searchParams = useSearchParams();
  const urlLanguage = lang === "ar" ? "ar" : "en";
  const { t: trans, dir, language } = useI18nLayout(surveyTranslations, urlLanguage);

  const token = searchParams?.get("token") || "";
  const hasToken = Boolean(token);
  const gestureAccumRef = useRef(0);
  const gestureCooldownRef = useRef(false);
  const lastDirRef = useRef(null);
  const GESTURE_COOLDOWN_MS = 280;

  const [attendeeErr, setAttendeeErr] = useState({});
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const [progressStep, setProgressStep] = useState(0);
  const progressRef = useRef(0);

  const GESTURE_THRESHOLD = 400;
  const STEPS_PER_QUESTION = 220;
  const INTRA_STEP_THRESHOLD = GESTURE_THRESHOLD / STEPS_PER_QUESTION;

  const [form, setForm] = useState(null);
  const [tForm, setTForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("attendee"); // "attendee" | "survey" | "submitted"
  const [attendee, setAttendee] = useState({
    name: "",
    email: "",
    company: "",
  });

  const totalQ = form?.questions?.length || 0;

  const palettes = useMemo(() => {
    const s = String(slug || "");
    let seed = 0;
    for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) | 0;

    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };

    const shuffled = [...SURVEY_PALETTES];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (!totalQ) return shuffled;
    return Array.from(
      { length: totalQ },
      (_, i) => shuffled[i % shuffled.length]
    );
  }, [slug, totalQ]);

  const palette = palettes[currentIdx % palettes.length] || SURVEY_PALETTES[0];
  const actionColor = palette.action;
  const rightGradient = palette.gradient;

  useEffect(() => {
    progressRef.current = progressStep;
  }, [progressStep]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await getPublicFormBySlug(slug);
      if (!mounted) return;
      setForm(data);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!form) return;

    const translateDynamic = async () => {
      const dynamicTexts = [];

      // Form-level fields
      dynamicTexts.push(form.title || "");
      dynamicTexts.push(form.description || "");

      // Question fields
      form.questions.forEach((q) => {
        dynamicTexts.push(q.label || "");
        dynamicTexts.push(q.helpText || "");
        if (Array.isArray(q.options)) {
          q.options.forEach((opt) => dynamicTexts.push(opt.label || ""));
        }
      });

      const results = await translateTexts(dynamicTexts, language);

      let idx = 0;

      const tTitle = results[idx++] || form.title;
      const tDesc = results[idx++] || form.description;

      const tQuestions = form.questions.map((q) => {
        const label = results[idx++] || q.label;
        const help = results[idx++] || q.helpText;

        let tOptions = [];
        if (Array.isArray(q.options)) {
          tOptions = q.options.map((opt) => {
            return {
              ...opt,
              label: results[idx++] || opt.label,
            };
          });
        }

        return {
          ...q,
          label,
          helpText: help,
          options: tOptions,
        };
      });

      setTForm({
        ...form,
        title: tTitle,
        description: tDesc,
        questions: tQuestions,
      });
    };

    translateDynamic();
  }, [form, language]);

  // ---- scroll by gestures ----
  useEffect(() => {
    if (phase !== "survey") return;

    const handleWheel = (e) => {
      const total = form?.questions?.length || 0;
      if (total <= 0) return;

      // prevent native page scroll for consistent gesture handling
      e.preventDefault();

      const dir = e.deltaY > 0 ? "down" : "up";
      // reset accumulation if direction flips
      if (lastDirRef.current && lastDirRef.current !== dir) {
        gestureAccumRef.current = 0;
      }
      lastDirRef.current = dir;

      // accumulate absolute movement
      gestureAccumRef.current += Math.abs(e.deltaY);

      // how many intra-steps should we apply for this event?
      const stepsToApply = Math.floor(
        gestureAccumRef.current / INTRA_STEP_THRESHOLD
      );
      if (stepsToApply <= 0) return;

      gestureAccumRef.current = gestureAccumRef.current % INTRA_STEP_THRESHOLD;

      // local mirrors to compute final values once
      let nextProgress = progressRef.current;
      let didQuestionChange = false;

      for (let i = 0; i < stepsToApply; i++) {
        if (dir === "down") {
          if (nextProgress < STEPS_PER_QUESTION - 1) {
            nextProgress += 1;
          } else {
            if (!gestureCooldownRef.current) {
              setCurrentIdx((prev) => {
                const capped = Math.min(prev + 1, total - 1);
                if (capped !== prev) didQuestionChange = true;
                return capped;
              });
              nextProgress = 0;
              gestureCooldownRef.current = true;
              setTimeout(
                () => (gestureCooldownRef.current = false),
                GESTURE_COOLDOWN_MS
              );
            }
          }
        } else {
          // dir === "up"
          if (nextProgress > 0) {
            nextProgress -= 1;
          } else {
            if (!gestureCooldownRef.current) {
              setCurrentIdx((prev) => {
                const capped = Math.max(prev - 1, 0);
                if (capped !== prev) didQuestionChange = true;
                return capped;
              });
              nextProgress = STEPS_PER_QUESTION - 1;
              gestureCooldownRef.current = true;
              setTimeout(
                () => (gestureCooldownRef.current = false),
                GESTURE_COOLDOWN_MS
              );
            }
          }
        }
      }

      if (
        !didQuestionChange ||
        (didQuestionChange && nextProgress !== progressRef.current)
      ) {
        setProgressStep(nextProgress);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [phase, form?.questions?.length]);

  useEffect(() => {
    const total = form?.questions?.length || 0;
    if (!total) return;
    setCurrentIdx((idx) => Math.min(Math.max(idx, 0), total - 1));
  }, [form?.questions?.length]);

  const startSurvey = () => {
    if (form?.isAnonymous || hasToken) {
      // skip attendee validation
      setPhase("survey");
      return;
    }

    const errs = {};
    if (!attendee.name.trim()) errs.name = trans.fullNameRequired;
    if (!attendee.email.trim()) errs.email = trans.emailRequired;
    setAttendeeErr(errs);
    if (Object.keys(errs).length) return;

    setPhase("survey");
  };

  const onSubmit = async () => {
    const questions = form?.questions || [];
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    await new Promise((resolve) => setTimeout(resolve, 150));

    const payload = {
      attendee: form?.isAnonymous || hasToken
        ? { name: null, email: null, company: null }
        : attendee,
      answers: questions.map((q) => {
        const questionId = q._id;
        const a = answers[questionId] || {};
        const t = guessType(q);
        const result = {
          questionId: questionId,
          optionIds:
            t.includes("multi") || t.includes("choice") || t.includes("single")
              ? a.optionIds || []
              : [],
          text: t.includes("text") ? a.text || "" : undefined,
          number:
            t.includes("number") || t.includes("rating") || t === "nps"
              ? a.number ?? undefined
              : undefined,
        };

        return result;
      }),
    };

    await submitSurveyResponseBySlug(slug, payload, { token });
    setPhase("submitted");
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Background />
        <LanguageSelector top={20} right={20} />
        <Container dir={dir} maxWidth="sm" sx={{ py: 6, zIndex: 1 }}>
          <Typography variant="h6">{trans.loading}</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Container>
      </Box>
    );
  }

  if (!form) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Background />
        <LanguageSelector top={20} right={20} />
        <Container dir={dir} maxWidth="sm" sx={{ py: 8, zIndex: 1 }}>
          <Typography variant="h5" gutterBottom sx={{
            fontWeight: 700
          }}>
            {trans.surveyUnavailable}
          </Typography>
          <Typography sx={{
            color: "text.secondary"
          }}>{trans.surveyNotFound}</Typography>
        </Container>
      </Box>
    );
  }

  if (phase === "submitted") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Background />
        <LanguageSelector top={20} right={20} />
        <Container dir={dir} maxWidth="sm" sx={{ position: "relative" }}>
          {/* subtle ambient blobs */}
          <Box
            sx={(theme) => ({
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                borderRadius: "50%",
                filter: "blur(28px)",
                opacity: 0.5,
              },
              "&::before": {
                width: 220, height: 220, top: -40, right: -40,
                background: theme.palette.surveyguru.ambientBlobIndigo,
              },
              "&::after": {
                width: 240, height: 240, left: -50, bottom: -50,
                background: theme.palette.surveyguru.ambientBlobGreen,
              },
            })}
          />

          <AppCard
            elevation={0}
            sx={(theme) => ({
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              textAlign: "center",
              bgcolor: theme.palette.overlay.card,
              backdropFilter: "blur(10px)",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: theme.palette.surveyguru.successCardShadow,
            })}
          >
            {/* success badge */}
            <Box
              sx={(theme) => ({
                mx: "auto", mb: 2.5, width: 88, height: 88,
                borderRadius: "999px", position: "relative",
                background: theme.palette.surveyguru.successBadgeGradient,
                boxShadow: theme.palette.surveyguru.successBadgeShadow,
                display: "grid",
                placeItems: "center",
              })}
            >
              {/* inner ring */}
              <Box
                sx={(theme) => ({
                  position: "absolute",
                  inset: -8,
                  borderRadius: "inherit",
                  background: theme.palette.surveyguru.successBadgeRing,
                  filter: "blur(8px)",
                })}
              />
              {/* check mark (inline SVG) */}
              <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={(theme) => ({ width: 44, height: 44, color: theme.palette.common.white })}
              >
                <path
                  fill="currentColor"
                  d="M9.0 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4l-9.3 9.3z"
                />
              </Box>
            </Box>

            {/* title */}
            <Typography
              variant="h4"
              sx={(theme) => ({
                fontWeight: 900,
                letterSpacing: "-0.02em",
                mb: 1,
                background: theme.palette.surveyguru.titleGradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              })}
            >
              {trans.thankYouTitle}
            </Typography>

            {/* message */}
            <Typography
              sx={{
                color: "text.secondary",
                mb: 2.5
              }}>
              {trans.thankYouMessage}
            </Typography>

            {/* optional fine print */}
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", display: "block" }}
            >
              {trans.youMayClose}
            </Typography>
          </AppCard>
        </Container>
      </Box>
    );
  }

  if (phase === "attendee") {
    const isAnonymousMode = Boolean(form?.isAnonymous);
    const canStart =
      hasToken ||
      isAnonymousMode ||
      (Boolean(attendee?.name?.trim()) &&
        Boolean(attendee?.email?.trim()) &&
        !attendeeErr?.name &&
        !attendeeErr?.email);

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          p: { xs: 1.5, sm: 2.5 },
        }}
      >
        <Background />
        <LanguageSelector top={20} right={20} />
        <AppCard
          elevation={3}
          sx={(theme) => ({
            width: "100%",
            maxWidth: { xs: 360, sm: 520, md: 600 },
            borderRadius: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 3.5 },
            ...(isAnonymousMode
              ? {
                border: `1px solid ${theme.palette.surveyguru.anonymousBorder}`,
                background: theme.palette.mode === "dark"
                  ? theme.palette.surveyguru.anonymousBgDark
                  : theme.palette.surveyguru.anonymousBgLight,
              }
              : {}),
          })}
        >
          <Box
            sx={{
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <ICONS.appRegister
              sx={{ fontSize: 40, color: "primary.main", mr: 1.5 }}
            />
            <Typography variant="h5" component="h1" sx={{
              fontWeight: 800
            }}>
              {tForm?.title}
            </Typography>
          </Box>
          {isAnonymousMode && (
            <Stack
              direction={dir === "rtl" ? "row-reverse" : "row"}
              sx={{
                justifyContent: "center",
                mb: 1.5
              }}>
              <Box
                sx={(theme) => ({
                  px: 1.25, py: 0.4, borderRadius: 10,
                  bgcolor: "warning.main",
                  color: theme.palette.common.white,
                  fontSize: 12, fontWeight: 700, letterSpacing: 0.2,
                })}
              >
                {trans.anonymousNoticeTitle}
              </Box>
            </Stack>
          )}

          {tForm?.description && (
            <Typography
              sx={{
                color: "text.secondary",
                mb: 3,
                textAlign: "center"
              }}>
              {tForm?.description}
            </Typography>
          )}
          {isAnonymousMode && (
            <Box
              sx={(theme) => ({
                mb: 2.5, p: 1.5, borderRadius: 1.5,
                bgcolor: theme.palette.surveyguru.anonymousNoticeBg,
                border: `1px solid ${theme.palette.surveyguru.anonymousNoticeBorder}`,
                ...(dir === "rtl"
                  ? { borderRight: `6px solid ${theme.palette.surveyguru.anonymousAccent}` }
                  : { borderLeft: `6px solid ${theme.palette.surveyguru.anonymousAccent}` }),
              })}
            >
              <Stack direction={dir === "rtl" ? "row-reverse" : "row"} spacing={1} sx={{ alignItems: "flex-start" }}>
                <ICONS.info sx={(theme) => ({ color: theme.palette.surveyguru.anonymousIconColor, fontSize: 20, mt: 0.2 })} />
                <Box>
                  <Typography variant="subtitle2" sx={(theme) => ({ color: theme.palette.surveyguru.anonymousTitleColor, fontWeight: 800, mb: 0.25 })}>
                    {trans.anonymousNoticeTitle}
                  </Typography>
                  <Typography variant="body2" sx={(theme) => ({ color: theme.palette.surveyguru.anonymousIconColor })}>
                    {trans.anonymousNoticeBody}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* form enables Enter-to-submit */}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (canStart) startSurvey();
            }}
            noValidate
          >
            <Stack dir={dir}>
              {!hasToken && !form?.isAnonymous && (
                <>
                  <TextField
                    id="attendee-name"
                    label={trans.fullName}
                    value={attendee.name}
                    onChange={(e) =>
                      setAttendee((s) => ({ ...s, name: e.target.value }))
                    }
                    error={!!attendeeErr.name}
                    helperText={attendeeErr.name || " "}
                    fullWidth
                    required
                    autoFocus
                    autoComplete="name"
                    sx={{
                      "& input": { fontSize: { xs: "0.95rem", sm: "1.05rem" } },
                    }}
                    slotProps={{
                      htmlInput: { enterKeyHint: "next", "aria-label": "Full Name" }
                    }}
                  />

                  <TextField
                    id="attendee-email"
                    label={trans.email}
                    type="email"
                    value={attendee.email}
                    onChange={(e) =>
                      setAttendee((s) => ({ ...s, email: e.target.value }))
                    }
                    error={!!attendeeErr.email}
                    helperText={attendeeErr.email || " "}
                    fullWidth
                    required
                    autoComplete="email"
                    sx={{
                      "& input": { fontSize: { xs: "0.95rem", sm: "1.05rem" } },
                    }}
                    slotProps={{
                      htmlInput: {
                        inputMode: "email",
                        enterKeyHint: "next",
                        "aria-label": "Email address",
                      }
                    }}
                  />

                  <TextField
                    id="attendee-company"
                    label={trans.companyOptional}
                    value={attendee.company}
                    onChange={(e) =>
                      setAttendee((s) => ({ ...s, company: e.target.value }))
                    }
                    helperText={" "}
                    fullWidth
                    autoComplete="organization"
                    sx={{
                      "& input": { fontSize: { xs: "0.95rem", sm: "1.05rem" } },
                    }}
                    slotProps={{
                      htmlInput: { enterKeyHint: "done", "aria-label": "Organization" }
                    }}
                  />
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!canStart}
                startIcon={<ICONS.next />}
                sx={{
                  py: 1.25,
                  fontWeight: 800,
                  ...(isAnonymousMode ? { mt: 0.5 } : {}),
                  ...getStartIconSpacing(dir),
                }}
              >
                {trans.startSurvey}
              </Button>
            </Stack>
          </Box>
        </AppCard>
      </Box>
    );
  }

  // --- Survey phase ---
  if (phase === "survey") {
    const questions = tForm?.questions || [];
    const safeIdx = Math.min(
      Math.max(currentIdx, 0),
      Math.max(questions.length - 1, 0)
    );
    const currentQ = questions[safeIdx];
    if (!currentQ) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Background />
          <LanguageSelector top={20} right={20} />
          <Container dir={dir} maxWidth="sm" sx={{ py: 8, zIndex: 1 }}>
            <Typography variant="h5" gutterBottom sx={{
              fontWeight: 700
            }}>
              {trans.noQuestionFound}
            </Typography>
            <Typography sx={{
              color: "text.secondary"
            }}>
              {trans.noQuestionsToDisplay}
            </Typography>
          </Container>
        </Box>
      );
    }

    const t = guessType(currentQ);
    const a = answers[currentQ._id] || {};
    const isNps = t === "nps" || t === "rating";
    const isText = t.includes("text");
    const isChoice = t.includes("multi") || t.includes("choice");
    const isIcon =
      currentQ.options && currentQ.options.some((opt) => opt.imageUrl);
    const min = currentQ.scale?.min ?? (t === "rating" ? 1 : 0);
    const max = currentQ.scale?.max ?? (t === "rating" ? 5 : 10);
    const step = currentQ.scale?.step ?? 1;
    const npsRange = Array.from(
      { length: Math.floor((max - min) / step) + 1 },
      (_, i) => min + i * step
    );

    const setAnswer = (qid, patch) => {
      setAnswers((prev) => ({
        ...prev,
        [qid]: { ...(prev[qid] || {}), ...patch },
      }));
    };
    const selectSingleOption = (qid, optId) => {
      setAnswers((prev) => {
        const curr = prev[qid]?.optionIds || [];
        const has = curr.includes(optId);
        const next = has ? [] : [optId];
        return { ...prev, [qid]: { ...(prev[qid] || {}), optionIds: next } };
      });
    };
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          position: "relative",
        }}
      >
        <Background />
        <LanguageSelector top={20} right={20} />
        {/* ============ MOBILE VIEW (xs only) ============ */}
        <Box
          dir={dir}
          sx={{ display: { xs: "block", md: "none" }, width: "100%" }}
        >
          <Box
            sx={{
              width: "100%",
              background: rightGradient,
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
              minHeight: "100vh",
              overflowX: "hidden",
            }}
          >
            {/* overlay */}
            <Box
              sx={(theme) => ({
                position: "absolute",
                inset: 0,
                background: theme.palette.surveyguru.panelOverlay,
                pointerEvents: "none",
              })}
            />

            {/* Card */}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                width: "100%",
                bgcolor: "background.paper",
                borderRadius: 3,
                p: 2.5,
                display: "grid",
                gridTemplateRows: "auto auto 1fr auto", // stepper / header / content / footer
                gap: 2,
                minHeight: "70vh",
                overflowX: "hidden",
              }}
            >
              {/* Stepper */}
              {(() => {
                const DotIcon = ({ active, completed, icon }) => (
                  <Box
                    sx={(theme) => ({
                      width: 24, height: 24, borderRadius: "50%",
                      display: "grid", placeItems: "center", boxSizing: "border-box",
                      border: `2px solid ${actionColor}`,
                      bgcolor: active || completed ? actionColor : theme.palette.common.white,
                      color: active || completed ? theme.palette.common.white : actionColor,
                      fontSize: 12, fontWeight: 700, userSelect: "none",
                    })}
                  >
                    {icon}
                  </Box>
                );
                return (
                  <Box sx={{ px: 0.5 }}>
                    <Stepper
                      activeStep={currentIdx}
                      connector={null}
                      sx={{
                        pointerEvents: "none",
                        width: "100%",
                        maxWidth: "100%",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        columnGap: 0.5,
                        rowGap: 0.5,
                        ".MuiStep-root": { p: 0, m: 0, flex: "0 0 auto" },
                        ".MuiStepLabel-label": { display: "none" },
                      }}
                    >
                      {questions.map((_, i) => (
                        <Step key={i}>
                          <StepLabel StepIconComponent={DotIcon} />
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                );
              })()}

              {/* Header */}
              <Box sx={{ wordBreak: "break-word", textAlign: "center", mt: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    mb: currentQ?.helpText ? 0.5 : 0,
                    lineHeight: 1.25,
                    fontSize: 18,
                  }}
                >
                  {currentQ.label}
                </Typography>
                {!!currentQ.helpText && (
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: 13.5
                    }}>
                    {currentQ.helpText}
                  </Typography>
                )}
              </Box>

              {/* Content */}
              <Box
                sx={{
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 0.5,
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                {/* NPS / Rating */}
                {isNps && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 640,
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    {npsRange.map((num) => {
                      const active = a.number === num;
                      return (
                        <Button
                          key={num}
                          onClick={() =>
                            setAnswer(currentQ._id, { number: num })
                          }
                          variant={active ? "contained" : "outlined"}
                          sx={{
                            flex: "0 1 44px",
                            minWidth: 0,
                            px: 0,
                            minHeight: 40,
                            fontWeight: 700,
                            borderRadius: 2,
                            borderColor: active ? actionColor : "divider",
                            bgcolor: active ? actionColor : "background.paper",
                            color: active ? "primary.contrastText" : "text.primary",
                            "&:hover": {
                              bgcolor: active ? actionColor : "action.hover",
                              borderColor: active ? actionColor : "divider",
                            },
                          }}
                        >
                          {num}
                        </Button>
                      );
                    })}
                  </Box>
                )}

                {/* Icon/Image Choice */}
                {isIcon && isChoice && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 1.5,
                    }}
                  >
                    {currentQ.options.map((opt) => {
                      const selected =
                        Array.isArray(a.optionIds) &&
                        a.optionIds.includes(String(opt._id));
                      return (
                        <Button
                          key={opt._id}
                          onClick={() =>
                            selectSingleOption(currentQ._id, String(opt._id))
                          }
                          variant="outlined"
                          sx={{
                            flex: "1 1 96px",
                            maxWidth: 140,
                            minWidth: 0,
                            height: "auto",
                            borderRadius: 3,
                            borderWidth: selected ? 2.5 : 1,
                            borderColor: selected ? actionColor : "divider",
                            bgcolor: selected ? "action.selected" : "background.paper",
                            display: "grid",
                            placeItems: "center",
                            px: 1,
                            py: 1,
                            textTransform: "none",
                            "&:hover": {
                              borderColor: actionColor,
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <Box sx={{ textAlign: "center", width: "100%" }}>
                            {opt.imageUrl ? (
                              <img
                                src={opt.imageUrl}
                                alt={opt.label}
                                style={{
                                  width: 56,
                                  height: 56,
                                  objectFit: "contain",
                                  maxWidth: "100%",
                                }}
                              />
                            ) : (
                              <ICONS.image
                                sx={{ fontSize: 56, color: "text.disabled" }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.75,
                                fontWeight: 600,
                                color: "text.primary",
                                fontSize: 12.5,
                                maxWidth: 120,
                                mx: "auto",
                                wordBreak: "break-word",
                              }}
                            >
                              {opt.label}
                            </Typography>
                          </Box>
                        </Button>
                      );
                    })}
                  </Box>
                )}

                {/* Multiple Choice (no icons) — wraps DOWN */}
                {!isIcon && isChoice && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    {currentQ.options.map((opt) => {
                      const selected =
                        Array.isArray(a.optionIds) &&
                        a.optionIds.includes(String(opt._id));
                      return (
                        <Button
                          key={opt._id}
                          onClick={() =>
                            selectSingleOption(currentQ._id, String(opt._id))
                          }
                          variant={selected ? "contained" : "outlined"}
                          sx={{
                            flex: "1 1 140px",
                            minWidth: 0,
                            justifyContent: "center",
                            borderRadius: 3,
                            minHeight: 44,
                            px: 1.25,
                            fontWeight: 700,
                            fontSize: 13.5,
                            bgcolor: selected ? actionColor : "background.paper",
                            borderColor: selected ? actionColor : "divider",
                            color: selected ? "primary.contrastText" : "text.primary",
                            "&:hover": {
                              bgcolor: selected ? actionColor : "action.hover",
                              borderColor: selected ? actionColor : "divider",
                            },
                          }}
                        >
                          {opt.label}
                        </Button>
                      );
                    })}
                  </Box>
                )}

                {/* Text */}
                {isText && (
                  <TextField
                    multiline
                    minRows={4}
                    fullWidth
                    value={a.text || ""}
                    onChange={(e) =>
                      setAnswer(currentQ._id, { text: e.target.value })
                    }
                    placeholder={trans.typeYourAnswer}
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      mx: "auto",
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "background.default",
                        borderRadius: 3,
                      },
                    }}
                  />
                )}
              </Box>

              {/* Footer */}
              <Box
                sx={(theme) => ({
                  position: "sticky", bottom: 0, left: 0, right: 0,
                  background: theme.palette.common.white,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  pt: 1, zIndex: 2,
                })}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                  }}
                >
                  {/* PREVIOUS */}
                  <Button
                    variant="outlined"
                    disabled={currentIdx === 0}
                    onClick={() => {
                      setCurrentIdx((idx) => Math.max(0, idx - 1));
                      setProgressStep(0);
                    }}
                    startIcon={dir === "ltr" ? <ICONS.back /> : <ICONS.next />}
                    sx={{
                      width: "100%",
                      minWidth: 0,
                      borderColor: actionColor,
                      color: actionColor,
                      fontWeight: 700,
                      borderRadius: 2,
                      ...getStartIconSpacing(dir),
                      "&:hover": {
                        borderColor: actionColor,
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {trans.previous}
                  </Button>

                  {/* NEXT or SUBMIT */}
                  {currentIdx < questions.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={() => {
                        setCurrentIdx((idx) =>
                          Math.min(questions.length - 1, idx + 1)
                        );
                        setProgressStep(0);
                      }}
                      startIcon={dir === "rtl" ? <ICONS.back /> : <ICONS.next />}
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        bgcolor: actionColor,
                        "&:hover": { bgcolor: actionColor },
                        fontWeight: 800,
                        borderRadius: 2,
                        ...getStartIconSpacing(dir),
                      }}
                    >
                      {trans.next}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={onSubmit}
                      startIcon={<ICONS.send />}
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        fontWeight: 800,
                        borderRadius: 2,
                        ...getStartIconSpacing(dir),
                      }}
                    >
                      {trans.submit}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        {/* ============ DESKTOP VIEW (md+) ============ */}
        <Box
          dir={dir}
          sx={{
            display: { xs: "none", md: "flex" },
            bgcolor: "background.paper",
            overflow: "hidden",
            flexDirection: "row",
            borderRadius: 3,
            boxShadow: 3,
            width: "100%",
            maxWidth: "90vw",
            height: "min(86vh, 920px)",
            minHeight: 620,
          }}
        >
          {/* Left Sidebar */}
          <Box
            sx={{
              width: "40%",
              p: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              height: "100%",
              minHeight: 0,
            }}
          >
            <Typography variant="h4" gutterBottom sx={{
              fontWeight: 800
            }}>
              {tForm?.title}
            </Typography>
            <Typography
              sx={{
                color: "text.secondary",
                mb: 3
              }}>
              {tForm?.description}
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
              {questions.map((q, idx) => (
                <Box
                  key={q._id}
                  onClick={() => { setCurrentIdx(idx); setProgressStep(0); }}
                  sx={(theme) => ({
                    py: 2, px: 0,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    color: idx === currentIdx ? theme.palette.surveyguru.sidebarActiveColor : "text.primary",
                    fontWeight: idx === currentIdx ? 600 : 400,
                    cursor: "pointer",
                    fontSize: 18,
                    transition: "color 0.2s, background 0.2s",
                    mb: 0.5,
                    background: idx === currentIdx ? theme.palette.surveyguru.sidebarActiveBg : "none",
                    borderLeft: idx === currentIdx
                      ? `3px solid ${theme.palette.surveyguru.sidebarActiveColor}`
                      : "3px solid transparent",
                    pl: 2,
                    position: "relative",
                  })}
                >
                  {q.label}
                  {idx === currentIdx && (
                    <>
                      <Box
                        sx={(theme) => ({
                          position: "absolute", bottom: -1, left: 0, right: 0, height: 3,
                          bgcolor: theme.palette.surveyguru.sidebarProgressTrack,
                          zIndex: 1,
                        })}
                      />
                      <Box
                        sx={(theme) => ({
                          position: "absolute", bottom: -1, left: 0, height: 3,
                          width: `${(progressStep / STEPS_PER_QUESTION) * 100}%`,
                          bgcolor: theme.palette.surveyguru.sidebarActiveColor,
                          transition: "width 160ms linear",
                          zIndex: 2,
                        })}
                      />
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Panel */}
          <Box
            sx={{
              width: "60%",
              background: rightGradient,
              position: "relative",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "stretch",
              pt: { md: 4, lg: 6 },
              pr: { md: 4, lg: 6 },
              pb: { md: 4, lg: 6 },
              pl: 0,
              minHeight: 620,
            }}
          >
            {/* overlay */}
            <Box
              sx={(theme) => ({
                position: "absolute",
                inset: 0,
                background: theme.palette.surveyguru.panelOverlay,
                pointerEvents: "none",
              })}
            />
            {/* Card */}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                width: "100%",
                maxWidth: 760,
                bgcolor: "background.paper",
                borderRadius: "0px 20px 20px 0px",
                p: 4,
                display: "grid",
                gridTemplateRows: "auto 1fr auto", // header / content / footer
                gap: 3,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    mb: currentQ?.helpText ? 0.5 : 0,
                    lineHeight: 1.25,
                    fontSize: 22,
                  }}
                >
                  {currentQ.label}
                </Typography>
                {!!currentQ.helpText && (
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: 15
                    }}>
                    {currentQ.helpText}
                  </Typography>
                )}
              </Box>

              {/* Content */}
              <Box
                sx={{
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 1,
                }}
              >
                {/* NPS / Rating */}
                {isNps && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 640,
                      mx: "auto",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(52px, 1fr))",
                      gap: 1,
                    }}
                  >
                    {npsRange.map((num) => {
                      const active = a.number === num;
                      return (
                        <Button
                          key={num}
                          onClick={() =>
                            setAnswer(currentQ._id, { number: num })
                          }
                          variant={active ? "contained" : "outlined"}
                          sx={{
                            minHeight: 48,
                            fontWeight: 700,
                            borderRadius: 2,
                            borderColor: active ? actionColor : "divider",
                            bgcolor: active ? actionColor : "background.paper",
                            color: active ? "primary.contrastText" : "text.primary",
                            "&:hover": {
                              bgcolor: active ? actionColor : "action.hover",
                              borderColor: active ? actionColor : "divider",
                            },
                          }}
                        >
                          {num}
                        </Button>
                      );
                    })}
                  </Box>
                )}

                {/* Icon/Image Choice */}
                {isIcon && isChoice && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      mx: "auto",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(108px, 1fr))",
                      gap: 2,
                    }}
                  >
                    {currentQ.options.map((opt) => {
                      const selected =
                        Array.isArray(a.optionIds) &&
                        a.optionIds.includes(String(opt._id));
                      return (
                        <Button
                          key={opt._id}
                          onClick={() =>
                            selectSingleOption(currentQ._id, String(opt._id))
                          }
                          variant="outlined"
                          sx={{
                            height: 104,
                            borderRadius: 3,
                            borderWidth: selected ? 2.5 : 1,
                            borderColor: selected ? actionColor : "divider",
                            bgcolor: selected ? "action.selected" : "background.paper",
                            display: "grid",
                            placeItems: "center",
                            px: 1,
                            py: 1,
                            textTransform: "none",
                            "&:hover": {
                              borderColor: actionColor,
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <Box sx={{ textAlign: "center" }}>
                            {opt.imageUrl ? (
                              <img
                                src={opt.imageUrl}
                                alt={opt.label}
                                style={{
                                  width: 56,
                                  height: 56,
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <ICONS.image
                                sx={{ fontSize: 56, color: "text.disabled" }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.75,
                                fontWeight: 600,
                                color: "text.primary",
                                fontSize: 13.5,
                                maxWidth: 120,
                                mx: "auto",
                              }}
                            >
                              {opt.label}
                            </Typography>
                          </Box>
                        </Button>
                      );
                    })}
                  </Box>
                )}

                {/* Multiple Choice (no icons) */}
                {!isIcon && isChoice && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      mx: "auto",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 1.5,
                    }}
                  >
                    {currentQ.options.map((opt) => {
                      const selected =
                        Array.isArray(a.optionIds) &&
                        a.optionIds.includes(String(opt._id));
                      return (
                        <Button
                          key={opt._id}
                          onClick={() =>
                            selectSingleOption(currentQ._id, String(opt._id))
                          }
                          variant={selected ? "contained" : "outlined"}
                          sx={{
                            justifyContent: "center",
                            borderRadius: 3,
                            minHeight: 48,
                            px: 1.75,
                            fontWeight: 700,
                            fontSize: 14.5,
                            bgcolor: selected ? actionColor : "background.paper",
                            borderColor: selected ? actionColor : "divider",
                            color: selected ? "primary.contrastText" : "text.primary",
                            "&:hover": {
                              bgcolor: selected ? actionColor : "action.hover",
                              borderColor: selected ? actionColor : "divider",
                            },
                          }}
                        >
                          {opt.label}
                        </Button>
                      );
                    })}
                  </Box>
                )}

                {/* Text */}
                {isText && (
                  <TextField
                    multiline
                    minRows={4}
                    fullWidth
                    value={a.text || ""}
                    onChange={(e) =>
                      setAnswer(currentQ._id, { text: e.target.value })
                    }
                    placeholder={trans.typeYourAnswer}
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      mx: "auto",
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "background.default",
                        borderRadius: 3,
                      },
                    }}
                  />
                )}
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                  pt: 1,
                }}
              >
                {/* PREVIOUS BUTTON */}
                <Button
                  variant="outlined"
                  disabled={currentIdx === 0}
                  onClick={() => {
                    setCurrentIdx((idx) => Math.max(0, idx - 1));
                    setProgressStep(0);
                  }}
                  startIcon={dir === "ltr" ? <ICONS.back /> : <ICONS.next />}
                  sx={{
                    borderColor: actionColor,
                    color: actionColor,
                    minWidth: 140,
                    fontWeight: 700,
                    "&:hover": {
                      borderColor: actionColor,
                      bgcolor: "action.hover",
                    },
                    ...getStartIconSpacing(dir),
                  }}
                >
                  {trans.previous}
                </Button>

                {/* NEXT OR SUBMIT */}
                {currentIdx < questions.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setCurrentIdx((idx) =>
                        Math.min(questions.length - 1, idx + 1)
                      );
                      setProgressStep(0);
                    }}
                    startIcon={dir === "rtl" ? <ICONS.back /> : <ICONS.next />}
                    sx={{
                      bgcolor: actionColor,
                      "&:hover": { bgcolor: actionColor },
                      minWidth: 160,
                      fontWeight: 800,
                      ...getStartIconSpacing(dir),
                    }}
                  >
                    {trans.nextQuestion}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={onSubmit}
                    startIcon={<ICONS.send />}
                    sx={{
                      minWidth: 160,
                      fontWeight: 800,
                      ...getStartIconSpacing(dir),
                    }}
                  >
                    {trans.submit}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
}
