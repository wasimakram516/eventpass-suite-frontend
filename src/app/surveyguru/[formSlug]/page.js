"use client";

import { useEffect, useRef, useState } from "react";
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
  StepButton,
} from "@mui/material";
import { useParams } from "next/navigation";
import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import { submitSurveyResponseBySlug } from "@/services/surveyguru/surveyResponseService";
import ICONS from "@/utils/iconUtil";

const guessType = (q) => (q?.type || q?.questionType || "").toLowerCase();

export default function PublicSurveyPage() {
  const { formSlug: slug } = useParams();

  const tokenRef = useRef("");
  useEffect(() => {
    tokenRef.current =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token") || ""
        : "";
  }, []);

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("attendee");
  const [attendee, setAttendee] = useState({ name: "", email: "", company: "" });
  const [attendeeErr, setAttendeeErr] = useState({});
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const STEPS_PER_QUESTION = 5;
  const [progressStep, setProgressStep] = useState(0);

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

  // ---- scroll progress functionality ----
  useEffect(() => {
    const handleWheel = (e) => {
      const direction = e.deltaY > 0 ? 'down' : 'up';
      const total = form?.questions?.length || 0;

      if (direction === 'down') {
        const nextStep = progressStep + 1;
        if (nextStep >= STEPS_PER_QUESTION) {
          // Advance to next question at 0%
          if (currentIdx < total - 1) {
            setCurrentIdx((prev) => prev + 1);
            setProgressStep(0);
          }
        } else {
          setProgressStep(nextStep);
        }
      } else {
        if (progressStep > 0) {
          setProgressStep((prev) => Math.max(prev - 1, 0));
        } else if (currentIdx > 0) {
          // Move to previous question at 80% (step 4/5)
          setProgressStep(STEPS_PER_QUESTION - 1);
          setCurrentIdx((prev) => prev - 1);
        }
      }
    };

    if (phase === 'survey') {
      window.addEventListener('wheel', handleWheel, { passive: true });
      return () => window.removeEventListener('wheel', handleWheel);
    }
  }, [phase, progressStep, currentIdx, form?.questions?.length]);

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
    await new Promise(resolve => setTimeout(resolve, 150));

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
          text: t.includes("text") ? (a.text || "") : undefined,
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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/Surverybg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <Container maxWidth="sm" sx={{ py: 6, zIndex: 1 }}>
          <Typography variant="h6">Loading…</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Container>
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/Surverybg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <Container maxWidth="sm" sx={{ py: 8, zIndex: 1 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Survey unavailable
          </Typography>
          <Typography color="text.secondary">{"This survey cannot be found."}</Typography>
        </Container>
      </Box>
    );
  }

  if (phase === "submitted") {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/Surverybg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <Container maxWidth="sm" sx={{ py: 8, zIndex: 1 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Thank you!
            </Typography>
            <Typography color="text.secondary">Your response has been recorded.</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (phase === "attendee") {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/Surverybg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: { xs: 320, sm: 480, md: 600 },
            borderRadius: 3,
            p: { xs: 2, sm: 4 },
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ICONS.appRegister sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h5" fontWeight={800}>{form.title}</Typography>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 3 }}>{form.description}</Typography>
          <TextField
            label="Full Name"
            value={attendee.name}
            onChange={(e) => setAttendee((s) => ({ ...s, name: e.target.value }))}
            error={!!attendeeErr.name}
            helperText={attendeeErr.name || ""}
            fullWidth
            sx={{
              mb: 2,
              mx: 'auto',
              input: { fontSize: { xs: '0.95rem', sm: '1.05rem' } }
            }}
          />
          <TextField
            label="Email"
            value={attendee.email}
            onChange={(e) => setAttendee((s) => ({ ...s, email: e.target.value }))}
            error={!!attendeeErr.email}
            helperText={attendeeErr.email || ""}
            fullWidth
            sx={{
              mb: 2,
              mx: 'auto',
              input: { fontSize: { xs: '0.95rem', sm: '1.05rem' } }
            }}
          />
          <TextField
            label="Company"
            value={attendee.company}
            onChange={(e) => setAttendee((s) => ({ ...s, company: e.target.value }))}
            fullWidth
            sx={{
              mb: 2,
              mx: 'auto',
              input: { fontSize: { xs: '0.95rem', sm: '1.05rem' } }
            }}
          />
          <Button variant="contained" fullWidth onClick={startSurvey}>
            Start survey
          </Button>
        </Paper>
      </Box>
    );
  }

  // --- Survey phase: single white container with sidebar and question card ---
  if (phase === "survey") {
    const questions = form.questions || [];
    const currentQ = questions[currentIdx];
    if (!currentQ) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/Surverybg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <Container maxWidth="sm" sx={{ py: 8, zIndex: 1 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              No question found
            </Typography>
            <Typography color="text.secondary">There are no questions to display in this survey.</Typography>
          </Container>
        </Box>
      );
    }
    const t = guessType(currentQ);
    const a = answers[currentQ._id] || {};
    const isNps = t === "nps" || t === "rating";
    const isText = t.includes("text");
    const isSingle = t.includes("single") || (t.includes("choice") && !t.includes("multi"));
    const isMulti = t.includes("multi");
    const isIcon = currentQ.options && currentQ.options.some(opt => opt.imageUrl);
    const min = currentQ.scale?.min ?? (t === "rating" ? 1 : 0);
    const max = currentQ.scale?.max ?? (t === "rating" ? 5 : 10);
    const step = currentQ.scale?.step ?? 1;
    const npsRange = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);

    // Dynamic colors for right panel background and Next button
    const colorChoices = [
      {
        base: '#a7d8f0',
        dark: '#1e3a8a',
        gradient: 'linear-gradient(135deg, #a7d8f0 0%, #7dd3fc 50%, #38bdf8 100%)'
      },
      {
        base: '#c7f9cc',
        dark: '#166534',
        gradient: 'linear-gradient(135deg, #c7f9cc 0%, #86efac 50%, #4ade80 100%)'
      },
      {
        base: '#fde68a',
        dark: '#b45309',
        gradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 50%, #f59e0b 100%)'
      },
      {
        base: '#e9d5ff',
        dark: '#6b21a8',
        gradient: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 50%, #c084fc 100%)'
      },
      {
        base: '#c8e6e0',
        dark: '#0f766e',
        gradient: 'linear-gradient(135deg, #c8e6e0 0%, #7dd3fc 50%, #06b6d4 100%)'
      },
    ];
    const colorIndex = currentIdx % colorChoices.length;
    const rightBgColor = colorChoices[colorIndex].base;
    const actionColor = colorChoices[colorIndex].dark;

    const setAnswer = (qid, patch) => {
      setAnswers(prev => ({ ...prev, [qid]: { ...(prev[qid] || {}), ...patch } }));
    };
    const toggleMulti = (qid, optId) => {
      setAnswers(prev => {
        const curr = prev[qid]?.optionIds || [];
        const has = curr.includes(optId);
        const next = has ? curr.filter(id => id !== optId) : [...curr, optId];
        return { ...prev, [qid]: { ...(prev[qid] || {}), optionIds: next } };
      });
    };

    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(/Surverybg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <Box sx={{
          display: 'flex',
          bgcolor: '#fff',
          borderRadius: 3,
          boxShadow: 3,
          overflow: 'hidden',
          maxWidth: '90vw',
          width: '100%',
          maxWidth: 1000,
          minheight: '100vh',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: { xs: '100vh', md: 'auto' },
          borderRadius: { xs: 0, md: 3 },
          boxShadow: { xs: 0, md: 3 },
          maxWidth: { xs: '100vw', md: '90vw' },
          width: { xs: '100%', md: '100%' }
        }}>

          <Box sx={{
            width: 340,
            p: 4,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'flex-start',
            height: '100%'
          }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>{form.title}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{form.description}</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {questions.map((q, idx) => (
                <Box
                  key={q._id}
                  onClick={() => { setCurrentIdx(idx); setProgressStep(0); }}
                  sx={{
                    py: 1.2,
                    px: 0,
                    borderBottom: '1px solid #eee',
                    color: idx === currentIdx ? '#2563eb' : '#222',
                    fontWeight: idx === currentIdx ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: 18,
                    transition: 'color 0.2s',
                    mb: 0.5,
                    background: idx === currentIdx ? 'rgba(37,99,235,0.07)' : 'none',
                    borderLeft: idx === currentIdx ? '3px solid #2563eb' : '3px solid transparent',
                    pl: 2,
                    position: 'relative'
                  }}
                >
                  {q.label}
                  {/* Progress Line below the selected question */}
                  {idx === currentIdx && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      height: 3,
                      bgcolor: '#2563eb',
                      width: `${(progressStep / STEPS_PER_QUESTION) * 100}%`,
                      transition: 'width 0.3s ease',
                      zIndex: 1
                    }} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{
            flex: 1,
            background: { xs: colorChoices[colorIndex].gradient, md: colorChoices[colorIndex].gradient },
            pt: 4,
            pb: 4,
            pr: 4,
            pl: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            height: '100%',
            bgcolor: { xs: '#fff', md: rightBgColor },
            pt: { xs: 2, md: 4 },
            pb: { xs: 2, md: 4 },
            pr: { xs: 2, md: 4 },
            pl: { xs: 2, md: 0 },
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: { xs: 'space-between', md: 'flex-start' },
            minHeight: { xs: '100vh', md: 'auto' }
          }}>
            <Box sx={{
              display: { xs: 'flex', md: 'none' },
              p: 2,
              background: colorChoices[colorIndex].gradient,
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2,
              width: '100%'
            }}>
              <Stepper
                activeStep={currentIdx}
                nonLinear={true}
                sx={{
                  width: '100%',
                  '& .MuiStepConnector-root': {
                    top: 10,
                    left: 'calc(-50% + 16px)',
                    right: 'calc(50% + 16px)',
                  },
                  '& .MuiStepConnector-line': {
                    borderTopWidth: 2,
                    borderColor: '#000'
                  },
                  '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                    borderColor: actionColor
                  },
                  '& .MuiStepIcon-root': {
                    color: '#000',
                    '&.Mui-active': {
                      color: actionColor,
                    },
                    '&.Mui-completed': {
                      color: '#000',
                    }
                  }
                }}
              >
                {questions.map((q, idx) => (
                  <Step key={q._id}>
                    <StepButton
                      onClick={() => { setCurrentIdx(idx); setProgressStep(0); }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                    >
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box sx={{
              bgcolor: '#fff',
              borderRadius: '0px 12px 12px 0px',
              p: 4,
              width: '100%',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'none',
              borderRadius: { xs: '22px 22px 22px 22px', md: '0px 12px 12px 0px' },
              p: { xs: 2, md: 4 },
              minHeight: { xs: 'auto', md: 400 },
              flex: { xs: 1, md: 'none' }
            }}>
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                flex: { xs: 1, md: 'none' },
                mb: { xs: 3, md: 0 }
              }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{currentQ.label}</Typography>
                {currentQ.helpText && (
                  <Typography color="text.secondary" sx={{ mb: 1, fontSize: 15 }}>{currentQ.helpText}</Typography>
                )}

                <Box sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  width: '100%',
                  mt: 1,
                  justifyContent: { xs: 'center', md: 'flex-start' }
                }}>
                  {/* NPS/Rating */}
                  {isNps && (
                    <Box sx={{ display: 'flex', gap: 5, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                      {npsRange.map(num => (
                        <Button
                          key={num}
                          variant={a.number === num ? 'contained' : 'outlined'}
                          color={a.number === num ? 'primary' : 'inherit'}
                          sx={{ minWidth: 36, px: 0, fontWeight: 600, borderRadius: 2, bgcolor: a.number === num ? '#2563eb' : '#fff', color: a.number === num ? '#fff' : '#222', borderColor: '#ddd' }}
                          onClick={() => setAnswer(currentQ._id, { number: num })}
                        >
                          {num}
                        </Button>
                      ))}
                    </Box>
                  )}

                  {/* Icon/Image Choice */}
                  {isIcon && (isSingle || isMulti) && (
                    <Box sx={{ display: 'flex', gap: 7, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap' }}>
                      {currentQ.options.map(opt => (
                        <Box key={opt._id} sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Button
                            variant={'text'}
                            sx={{
                              borderRadius: 2,
                              minWidth: 64,
                              minHeight: 64,
                              p: 0.5,
                              mb: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'inherit',
                              border: Array.isArray(a.optionIds) && a.optionIds.includes(String(opt._id)) ? '3px solid #2563eb' : '2px solid transparent',
                              bgcolor: Array.isArray(a.optionIds) && a.optionIds.includes(String(opt._id)) ? 'rgba(37,99,235,0.1)' : 'transparent',
                              '&:hover': { transform: 'scale(1.03)', backgroundColor: 'transparent' },
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => isMulti ? toggleMulti(currentQ._id, String(opt._id)) : setAnswer(currentQ._id, { optionIds: [String(opt._id)] })}
                          >
                            {opt.imageUrl ? (
                              <img src={opt.imageUrl} alt={opt.label} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                            ) : (
                              <ICONS.image sx={{ fontSize: 60 }} />
                            )}
                          </Button>
                          <Typography variant="body2" sx={{ color: '#555', fontWeight: 500, maxWidth: 80, textAlign: 'center', fontSize: 14 }}>
                            {opt.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Single/Multiple Choice (no icons) */}
                  {!isIcon && (isSingle || isMulti) && (
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap' }}>
                      {currentQ.options.map(opt => (
                        <Button
                          key={opt._id}
                          variant={Array.isArray(a.optionIds) && a.optionIds.includes(String(opt._id)) ? 'contained' : 'outlined'}
                          sx={{
                            borderRadius: 3,
                            minWidth: 90,
                            minHeight: 48,
                            p: 1.5,
                            bgcolor: Array.isArray(a.optionIds) && a.optionIds.includes(String(opt._id)) ? '#2563eb' : '#f5f5f5',
                            color: Array.isArray(a.optionIds) && a.optionIds.includes(String(opt._id)) ? '#fff' : '#222',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                          onClick={() => isMulti ? toggleMulti(currentQ._id, String(opt._id)) : setAnswer(currentQ._id, { optionIds: [String(opt._id)] })}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </Box>
                  )}

                  {/* Text */}
                  {isText && (
                    <TextField
                      multiline
                      minRows={3}
                      fullWidth
                      value={a.text || ''}
                      onChange={e => setAnswer(currentQ._id, { text: e.target.value })}
                      placeholder={'Type your answer'}
                      sx={{ bgcolor: '#f5f5f5', borderRadius: 5 }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                mt: 3,
                position: 'relative',
                justifyContent: { xs: 'space-between', md: 'flex-end' },
                mt: { xs: 'auto', md: 3 },
                pb: { xs: 2, md: 0 },
                width: { xs: '100%', md: 'auto' }
              }}>
                <Button
                  variant="outlined"
                  disabled={currentIdx === 0}
                  onClick={() => { setCurrentIdx(idx => Math.max(0, idx - 1)); setProgressStep(0); }}
                  sx={{

                    minWidth: { xs: '48%', md: 120 },

                  }}
                  startIcon={<ICONS.back />}
                >
                  Previous
                </Button>
                {currentIdx < questions.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={() => { setCurrentIdx(idx => Math.min(questions.length - 1, idx + 1)); setProgressStep(0); }}
                    sx={{
                      bgcolor: actionColor,
                      '&:hover': { bgcolor: actionColor },
                      minWidth: { xs: '48%', md: 120 },
                    }}
                    endIcon={<ICONS.next />}
                  >
                    Next question
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={onSubmit}
                    sx={{
                      minWidth: 120,
                      borderRadius: 2,
                      minWidth: { xs: '48%', md: 120 },
                      width: { xs: '48%', md: 'auto' },
                      fontSize: { xs: 14, md: 16 }
                    }}
                    startIcon={<ICONS.send />}
                  >
                    Submit
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box >
    );
  }
}