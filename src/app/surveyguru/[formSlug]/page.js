"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Stack,
} from "@mui/material";
import { useParams } from "next/navigation";
import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import { submitSurveyResponseBySlug } from "@/services/surveyguru/surveyResponseService";
import ICONS from "@/utils/iconUtil";

const guessType = (q) => (q?.type || q?.questionType || "").toLowerCase();

// ---- Color palettes ----
const BASE_PALETTES = [
  {
    base: "#a7d8f0",
    action: "#1e3a8a",
    gradient: "linear-gradient(135deg, #a7d8f0 0%, #7dd3fc 50%, #38bdf8 100%)",
  },
  {
    base: "#c7f9cc",
    action: "#166534",
    gradient: "linear-gradient(135deg, #c7f9cc 0%, #86efac 50%, #4ade80 100%)",
  },
  {
    base: "#fde68a",
    action: "#b45309",
    gradient: "linear-gradient(135deg, #fde68a 0%, #fcd34d 50%, #f59e0b 100%)",
  },
  {
    base: "#e9d5ff",
    action: "#6b21a8",
    gradient: "linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 50%, #c084fc 100%)",
  },
  {
    base: "#c8e6e0",
    action: "#0f766e",
    gradient: "linear-gradient(135deg, #c8e6e0 0%, #7dd3fc 50%, #06b6d4 100%)",
  },
];

export default function PublicSurveyPage() {
  const { formSlug: slug } = useParams();
  const tokenRef = useRef("");
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
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("attendee"); // "attendee" | "survey" | "submitted"s
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

    const shuffled = [...BASE_PALETTES];
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

  const palette = palettes[currentIdx % palettes.length] || BASE_PALETTES[0];
  const actionColor = palette.action;
  const rightGradient = palette.gradient;

  useEffect(() => {
    progressRef.current = progressStep;
  }, [progressStep]);

  useEffect(() => {
    tokenRef.current =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token") || ""
        : "";
  }, []);

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
    const errs = {};
    if (!attendee.name.trim()) errs.name = "Full name is required";
    if (!attendee.email.trim()) errs.email = "Email is required";
    setAttendeeErr(errs);
    if (Object.keys(errs).length) return;
    setPhase("survey");
  };

  const onSubmit = async () => {
    const token = tokenRef.current;
    const questions = form?.questions || [];
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    await new Promise((resolve) => setTimeout(resolve, 150));

    const payload = {
      attendee,
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
          background: `
        radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
        radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
        radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
        radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
        linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
      `,
          filter: "saturate(1.05)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Container maxWidth="sm" sx={{ py: 6, zIndex: 1 }}>
          <Typography variant="h6">Loading…</Typography>
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
          background: `
        radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
        radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
        radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
        radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
        linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
      `,
          filter: "saturate(1.05)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Container maxWidth="sm" sx={{ py: 8, zIndex: 1 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Survey unavailable
          </Typography>
          <Typography color="text.secondary">
            {"This survey cannot be found."}
          </Typography>
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
          background: `
          radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
          radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
          radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
          radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
          linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
        `,
          filter: "saturate(1.05)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Container maxWidth="sm" sx={{ position: "relative" }}>
          {/* subtle ambient blobs */}
          <Box
            sx={{
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
                width: 220,
                height: 220,
                top: -40,
                right: -40,
                background:
                  "radial-gradient(closest-side, rgba(99,102,241,.35), transparent)",
              },
              "&::after": {
                width: 240,
                height: 240,
                left: -50,
                bottom: -50,
                background:
                  "radial-gradient(closest-side, rgba(16,185,129,.35), transparent)",
              },
            }}
          />

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              textAlign: "center",
              bgcolor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(10px)",
              border: "1px solid",
              borderColor: "rgba(148,163,184,0.35)",
              boxShadow:
                "0 10px 30px rgba(2,6,23,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
            }}
          >
            {/* success badge */}
            <Box
              sx={{
                mx: "auto",
                mb: 2.5,
                width: 88,
                height: 88,
                borderRadius: "999px",
                position: "relative",
                background:
                  "linear-gradient(135deg, #34d399 0%, #10b981 60%, #059669 100%)",
                boxShadow:
                  "0 12px 28px rgba(16,185,129,.35), inset 0 0 0 6px rgba(255,255,255,.35)",
                display: "grid",
                placeItems: "center",
              }}
            >
              {/* inner ring */}
              <Box
                sx={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "inherit",
                  background:
                    "conic-gradient(from 180deg at 50% 50%, rgba(16,185,129,.18), transparent 40% 60%, rgba(16,185,129,.18))",
                  filter: "blur(8px)",
                }}
              />
              {/* check mark (inline SVG) */}
              <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={{ width: 44, height: 44, color: "#fff" }}
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
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.02em",
                mb: 1,
                background:
                  "linear-gradient(90deg, #0f172a 0%, #2563eb 45%, #0ea5e9 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Thank you!
            </Typography>

            {/* message */}
            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              Your response has been recorded successfully.
            </Typography>

            {/* optional fine print */}
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", display: "block" }}
            >
              You may close this tab now.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (phase === "attendee") {
    const canStart =
      Boolean(attendee?.name?.trim()) &&
      Boolean(attendee?.email?.trim()) &&
      !attendeeErr?.name &&
      !attendeeErr?.email;

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `
          radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
          radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
          radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
          radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
          linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
        `,
          filter: "saturate(1.05)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          p: { xs: 1.5, sm: 2.5 },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: { xs: 360, sm: 520, md: 600 },
            borderRadius: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 3.5 },
          }}
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
            <Typography variant="h5" fontWeight={800} component="h1">
              {form.title}
            </Typography>
          </Box>

          {form.description && (
            <Typography
              color="text.secondary"
              sx={{ mb: 3, textAlign: "center" }}
            >
              {form.description}
            </Typography>
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
            <Stack>
              <TextField
                id="attendee-name"
                label="Full Name"
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
                inputProps={{ enterKeyHint: "next", "aria-label": "Full Name" }}
                sx={{
                  "& input": { fontSize: { xs: "0.95rem", sm: "1.05rem" } },
                }}
              />

              <TextField
                id="attendee-email"
                label="Email"
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
                inputProps={{
                  inputMode: "email",
                  enterKeyHint: "next",
                  "aria-label": "Email address",
                }}
                sx={{
                  "& input": { fontSize: { xs: "0.95rem", sm: "1.05rem" } },
                }}
              />

              <TextField
                id="attendee-company"
                label="Company (optional)"
                value={attendee.company}
                onChange={(e) =>
                  setAttendee((s) => ({ ...s, company: e.target.value }))
                }
                helperText={" "}
                fullWidth
                autoComplete="organization"
                inputProps={{ enterKeyHint: "done", "aria-label": "Company" }}
                sx={{
                  "& input": { fontSize: { xs: "0.95rem", sm: "1.05rem" } },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!canStart}
                endIcon={<ICONS.next />}
                sx={{
                  py: 1.25,
                  fontWeight: 800,
                }}
              >
                Start survey
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    );
  }

  // --- Survey phase ---
  if (phase === "survey") {
    const questions = form.questions || [];
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
            background: `
        radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
        radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
        radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
        radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
        linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
      `,
            filter: "saturate(1.05)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Container maxWidth="sm" sx={{ py: 8, zIndex: 1 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              No question found
            </Typography>
            <Typography color="text.secondary">
              There are no questions to display in this survey.
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
          background: `
      radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
      radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
      radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
      radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
    `,
          filter: "saturate(1.05)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "100%",
        }}
      >
        {/* ============ MOBILE VIEW (xs only) ============ */}
        <Box sx={{ display: { xs: "block", md: "none" }, width: "100%" }}>
          <Box
            sx={{
              width: "100%",
              background: rightGradient,
              position: "relative",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "stretch",
              p: 2,
              minHeight: "100vh",
              overflowX: "hidden",
            }}
          >
            {/* overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(800px 600px at 90% 10%, rgba(255,255,255,0.18) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />

            {/* Card */}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                width: "100%",
                bgcolor: "#fff",
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
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      boxSizing: "border-box",
                      border: `2px solid ${actionColor}`,
                      bgcolor: active || completed ? actionColor : "#fff",
                      color: active || completed ? "#fff" : actionColor,
                      fontSize: 12,
                      fontWeight: 700,
                      userSelect: "none",
                    }}
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
                  <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
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
                            borderColor: active ? actionColor : "#d6dbe3",
                            bgcolor: active ? actionColor : "#fff",
                            color: active ? "#fff" : "#1f2937",
                            "&:hover": {
                              bgcolor: active ? actionColor : "#f3f4f6",
                              borderColor: active ? actionColor : "#cfd5df",
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
                            borderColor: selected ? actionColor : "#e5e7eb",
                            bgcolor: selected ? "rgba(0,0,0,0.02)" : "#fff",
                            display: "grid",
                            placeItems: "center",
                            px: 1,
                            py: 1,
                            textTransform: "none",
                            "&:hover": {
                              borderColor: actionColor,
                              bgcolor: "#fafafa",
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
                                sx={{ fontSize: 56, color: "#6b7280" }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.75,
                                fontWeight: 600,
                                color: "#334155",
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
                            bgcolor: selected ? actionColor : "#fff",
                            borderColor: selected ? actionColor : "#e5e7eb",
                            color: selected ? "#fff" : "#1f2937",
                            "&:hover": {
                              bgcolor: selected ? actionColor : "#f9fafb",
                              borderColor: selected ? actionColor : "#d1d5db",
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
                    placeholder="Type your answer"
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      mx: "auto",
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#f8fafc",
                        borderRadius: 3,
                      },
                    }}
                  />
                )}
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "#fff",
                  borderTop: "1px solid",
                  borderColor: "divider",
                  pt: 1,
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    disabled={currentIdx === 0}
                    onClick={() => {
                      setCurrentIdx((idx) => Math.max(0, idx - 1));
                      setProgressStep(0);
                    }}
                    startIcon={<ICONS.back />}
                    sx={{
                      width: "100%",
                      minWidth: 0,
                      borderColor: actionColor,
                      color: actionColor,
                      fontWeight: 700,
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: actionColor,
                        bgcolor: "rgba(0,0,0,0.02)",
                      },
                    }}
                  >
                    Previous
                  </Button>

                  {currentIdx < questions.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={() => {
                        setCurrentIdx((idx) =>
                          Math.min(questions.length - 1, idx + 1)
                        );
                        setProgressStep(0);
                      }}
                      endIcon={<ICONS.next />}
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        bgcolor: actionColor,
                        "&:hover": { bgcolor: actionColor },
                        fontWeight: 800,
                        borderRadius: 2,
                      }}
                    >
                      Next
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
                      }}
                    >
                      Submit
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ============ DESKTOP VIEW (md+) ============ */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            bgcolor: "#fff",
            overflow: "hidden",
            flexDirection: "row",
            borderRadius: 3,
            boxShadow: 3,
            width: "100%",
            maxWidth: "90vw",
            minHeight: 640,
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
            }}
          >
            <Typography variant="h4" fontWeight={800} gutterBottom>
              {form.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {form.description}
            </Typography>
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {questions.map((q, idx) => (
                <Box
                  key={q._id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setProgressStep(0);
                  }}
                  sx={{
                    py: 2,
                    px: 0,
                    borderBottom: "1px solid #eee",
                    color: idx === currentIdx ? "#2563eb" : "#222",
                    fontWeight: idx === currentIdx ? 600 : 400,
                    cursor: "pointer",
                    fontSize: 18,
                    transition: "color 0.2s, background 0.2s",
                    mb: 0.5,
                    background:
                      idx === currentIdx ? "rgba(37,99,235,0.07)" : "none",
                    borderLeft:
                      idx === currentIdx
                        ? "3px solid #2563eb"
                        : "3px solid transparent",
                    pl: 2,
                    position: "relative",
                  }}
                >
                  {q.label}
                  {idx === currentIdx && (
                    <>
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -1,
                          left: 0,
                          right: 0,
                          height: 3,
                          bgcolor: "rgba(37,99,235,0.12)",
                          zIndex: 1,
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -1,
                          left: 0,
                          height: 3,
                          width: `${
                            (progressStep / STEPS_PER_QUESTION) * 100
                          }%`,
                          bgcolor: "#2563eb",
                          transition: "width 160ms linear",
                          zIndex: 2,
                        }}
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
              pt: 10,
              pr: 10,
              pb: 10,
              pl: 0,
              minHeight: 640,
            }}
          >
            {/* overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(800px 600px at 90% 10%, rgba(255,255,255,0.18) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />
            {/* Card */}
            <Box
              sx={{
                position: "relative",
                flex: 1,
                width: "100%",
                maxWidth: 760,
                bgcolor: "#fff",
                borderRadius: "0px 20px 20px 0px",
                p: 4,
                display: "grid",
                gridTemplateRows: "auto 1fr auto", // header / content / footer
                gap: 3,
                minHeight: 520,
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
                  <Typography color="text.secondary" sx={{ fontSize: 15 }}>
                    {currentQ.helpText}
                  </Typography>
                )}
              </Box>

              {/* Content */}
              <Box sx={{ display: "grid", placeItems: "center", px: 1 }}>
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
                            borderColor: active ? actionColor : "#d6dbe3",
                            bgcolor: active ? actionColor : "#fff",
                            color: active ? "#fff" : "#1f2937",
                            "&:hover": {
                              bgcolor: active ? actionColor : "#f3f4f6",
                              borderColor: active ? actionColor : "#cfd5df",
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
                            borderColor: selected ? actionColor : "#e5e7eb",
                            bgcolor: selected ? "rgba(0,0,0,0.02)" : "#fff",
                            display: "grid",
                            placeItems: "center",
                            px: 1,
                            py: 1,
                            textTransform: "none",
                            "&:hover": {
                              borderColor: actionColor,
                              bgcolor: "#fafafa",
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
                                sx={{ fontSize: 56, color: "#6b7280" }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.75,
                                fontWeight: 600,
                                color: "#334155",
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
                            bgcolor: selected ? actionColor : "#fff",
                            borderColor: selected ? actionColor : "#e5e7eb",
                            color: selected ? "#fff" : "#1f2937",
                            "&:hover": {
                              bgcolor: selected ? actionColor : "#f9fafb",
                              borderColor: selected ? actionColor : "#d1d5db",
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
                    placeholder="Type your answer"
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      mx: "auto",
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#f8fafc",
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
                <Button
                  variant="outlined"
                  disabled={currentIdx === 0}
                  onClick={() => {
                    setCurrentIdx((idx) => Math.max(0, idx - 1));
                    setProgressStep(0);
                  }}
                  startIcon={<ICONS.back />}
                  sx={{
                    borderColor: actionColor,
                    color: actionColor,
                    minWidth: 140,
                    fontWeight: 700,
                    "&:hover": {
                      borderColor: actionColor,
                      bgcolor: "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  Previous
                </Button>
                {currentIdx < questions.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setCurrentIdx((idx) =>
                        Math.min(questions.length - 1, idx + 1)
                      );
                      setProgressStep(0);
                    }}
                    endIcon={<ICONS.next />}
                    sx={{
                      bgcolor: actionColor,
                      "&:hover": { bgcolor: actionColor },
                      minWidth: 160,
                      fontWeight: 800,
                    }}
                  >
                    Next question
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={onSubmit}
                    startIcon={<ICONS.send />}
                    sx={{ minWidth: 160, fontWeight: 800 }}
                  >
                    Submit
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
