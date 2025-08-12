"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Checkbox,
  Radio,
  FormControlLabel,
} from "@mui/material";
import { useParams } from "next/navigation";

import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import { submitSurveyResponseBySlug } from "@/services/surveyguru/surveyResponseService";

const guessType = (q) => (q?.type || q?.questionType || "").toLowerCase();

export default function PublicSurveyPage() {
  const { formSlug: slug } = useParams();

  // Keep token 100% stable (no re-renders on typing)
  const tokenRef = useRef("");
  useEffect(() => {
    tokenRef.current =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token") || ""
        : "";
  }, []);

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [phase, setPhase] = useState("attendee"); // "attendee" | "survey" | "submitted"
  const [attendee, setAttendee] = useState({ name: "", email: "", company: "" });
  const [attendeeErr, setAttendeeErr] = useState({});

  // answers shape: { [qId]: { optionIds?: string[], text?: string, number?: number } }
  const [answers, setAnswers] = useState({});

  // ---- load form once ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getPublicFormBySlug(slug);
        if (!mounted) return;
        setForm(data);
        setErr("");
      } catch (e) {
        setErr(e?.message || "Failed to load form");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  // ---- helpers to update state (stable, won’t reset other fields) ----
  const setAnswer = (qid, patch) => {
    setAnswers((prev) => ({ ...prev, [qid]: { ...(prev[qid] || {}), ...patch } }));
  };

  const toggleMulti = (qid, optId) => {
    setAnswers((prev) => {
      const curr = prev[qid]?.optionIds || [];
      const has = curr.includes(optId);
      const next = has ? curr.filter((id) => id !== optId) : [...curr, optId];
      return { ...prev, [qid]: { ...(prev[qid] || {}), optionIds: next } };
    });
  };

  // ---- attendee step ----
  const startSurvey = () => {
    const errs = {};
    if (!attendee.name.trim()) errs.name = "Full name is required";
    if (!attendee.email.trim()) errs.email = "Email is required";
    setAttendeeErr(errs);
    if (Object.keys(errs).length) return;
    setPhase("survey");
  };

  // ---- submit ----
  const onSubmit = async () => {
    try {
      const token = tokenRef.current;
      const questions = form?.questions || [];
      const payload = {
        attendee,
        answers: questions.map((q) => {
          const a = answers[q._id] || {};
          const t = guessType(q);
          return {
            questionId: q._id,
            optionIds:
              t.includes("multi") || t.includes("choice") || t.includes("single")
                ? a.optionIds || []
                : [],
            text: t.includes("text") ? a.text || "" : undefined,
            number:
              t.includes("number") || t.includes("rating")
                ? a.number ?? undefined
                : undefined,
          };
        }),
      };
      await submitSurveyResponseBySlug(slug, payload, { token });
      setPhase("submitted");
    } catch (e) {
      alert(e?.message || "Submission failed");
    }
  };

  // ---- render ----
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography variant="h6">Loading…</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Container>
    );
  }

  if (err || !form) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Survey unavailable
        </Typography>
        <Typography color="text.secondary">{err || "This survey cannot be found."}</Typography>
      </Container>
    );
  }

  if (phase === "submitted") {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Thank you!
          </Typography>
          <Typography color="text.secondary">Your response has been recorded.</Typography>
        </Paper>
      </Container>
    );
  }

  if (phase === "attendee") {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={2} mb={2}>
          <Typography variant="h5" fontWeight={800}>{form.title}</Typography>
          <Typography color="text.secondary">{form.description}</Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={attendee.name}
              onChange={(e) => setAttendee((s) => ({ ...s, name: e.target.value }))}
              error={!!attendeeErr.name}
              helperText={attendeeErr.name || ""}
              fullWidth
            />
            <TextField
              label="Email"
              value={attendee.email}
              onChange={(e) => setAttendee((s) => ({ ...s, email: e.target.value }))}
              error={!!attendeeErr.email}
              helperText={attendeeErr.email || ""}
              fullWidth
            />
            <TextField
              label="Company"
              value={attendee.company}
              onChange={(e) => setAttendee((s) => ({ ...s, company: e.target.value }))}
              fullWidth
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={startSurvey}>Start survey</Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // survey phase (minimal)
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2} mb={2}>
        <Typography variant="h5" fontWeight={800}>{form.title}</Typography>
        <Typography color="text.secondary">{form.description}</Typography>
      </Stack>

      <Stack spacing={2}>
        {(form.questions || []).map((q) => {
          const t = guessType(q);
          const a = answers[q._id] || {};
          const single = t.includes("single") || (t.includes("choice") && !t.includes("multi"));
          const multi = t.includes("multi");
          const isText = t.includes("text");
          const isNumber = t.includes("number") || t.includes("rating");

          return (
            <Paper key={q._id} elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" fontWeight={700}>{q.label}</Typography>

              { (single || multi) && (q.options || []).map((opt) => (
                <FormControlLabel
                  key={opt._id}
                  control={
                    multi ? (
                      <Checkbox
                        checked={Array.isArray(a.optionIds) && a.optionIds.includes(String(opt._id))}
                        onChange={() => toggleMulti(q._id, String(opt._id))}
                      />
                    ) : (
                      <Radio
                        checked={Array.isArray(a.optionIds) && a.optionIds[0] === String(opt._id)}
                        onChange={() => setAnswer(q._id, { optionIds: [String(opt._id)] })}
                      />
                    )
                  }
                  label={opt.label || "Option"}
                />
              ))}

              {isText && (
                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  value={a.text || ""}
                  onChange={(e) => setAnswer(q._id, { text: e.target.value })}
                  placeholder="Type your answer"
                  sx={{ mt: 1 }}
                />
              )}

              {isNumber && (
                <TextField
                  type="number"
                  fullWidth
                  value={typeof a.number === "number" ? a.number : ""}
                  onChange={(e) =>
                    setAnswer(q._id, {
                      number: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="Enter a number"
                  sx={{ mt: 1 }}
                />
              )}
            </Paper>
          );
        })}

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" color="success" onClick={onSubmit}>
            Submit
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
