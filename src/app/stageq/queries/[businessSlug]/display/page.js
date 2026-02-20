"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { getQuestionsByBusiness } from "@/services/stageq/questionService";
import Footer from "@/components/nav/Footer";
import { getBusinessBySlug } from "@/services/businessService";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import Background from "@/components/Background";
import { Shift } from "ambient-cbg";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateTexts } from "@/services/translationService";
import LanguageSelector from "@/components/LanguageSelector";
import { toArabicDigits } from "@/utils/arabicDigits";

const translations = {
  en: {
    noQuestionsYet: "No questions yet.",
  },
  ar: {
    noQuestionsYet: "لا توجد أسئلة بعد.",
  },
};

export default function LiveQuestionDisplay() {
  const { businessSlug } = useParams();
  const { globalConfig } = useGlobalConfig();
  const { t, dir, align, language } = useI18nLayout(translations);
  const [questions, setQuestions] = useState([]);
  const [translatedQuestionTexts, setTranslatedQuestionTexts] = useState({});
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.length) {
      setTranslatedQuestionTexts({});
      return;
    }
    let cancelled = false;
    const entries = list.map((q) => ({
      id: q._id,
      text: q && typeof q.text === "string" && q.text.trim() ? q.text : "",
    }));
    translateTexts(entries.map((e) => e.text), language)
      .then((results) => {
        if (cancelled) return;
        const map = {};
        entries.forEach((e, i) => {
          map[e.id] = results[i] || e.text;
        });
        setTranslatedQuestionTexts(map);
      })
      .catch(() => {
        if (!cancelled) setTranslatedQuestionTexts({});
      });
    return () => {
      cancelled = true;
    };
  }, [questions, language]);

  const fetchQuestions = async () => {
    setLoading(true);
    const [questionData, businessData] = await Promise.all([
      getQuestionsByBusiness(businessSlug),
      getBusinessBySlug(businessSlug),
    ]);
    const unanswered = questionData.filter((q) => !q.answered);
    setQuestions(unanswered);
    setBusiness(businessData);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 10000);
    return () => clearInterval(interval);
  }, [businessSlug]);

  const bubbles = useMemo(() => {
    const sorted = [...questions].sort((a, b) => b.votes - a.votes);
    return sorted.map((q) => {
      const clampedVotes = Math.min(q.votes, 10);
      const stepSize = (2 - 1.1) / 9;
      const fontSize = 1.1 + (clampedVotes - 1) * stepSize;
      const scale = 1 + clampedVotes * 0.05;
      return {
        ...q,
        floatDuration: `${3 + Math.random() * 3}s`,
        floatDelay: `${Math.random() * 2}s`,
        fadeDelay: `${Math.random() * 0.5}s`,
        fontSize: `${fontSize.toFixed(2)}rem`,
        scale: scale.toFixed(2),
      };
    });
  }, [questions]);

  if (loading && questions.length === 0) {
    return (
      <Box sx={{ position: "relative", minHeight: "100vh" }}>
        <Box
          minHeight="100vh"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Shift />
          <CircularProgress />
        </Box>
        <LanguageSelector top={20} right={20} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        px: { xs: 2, sm: 4 },
        pt: 2,
        pb: 10,
        overflowX: "hidden",
        textAlign: align,
      }}
      dir={dir}
    >
      <Shift />
      {business?.logoUrl && (
        <Box sx={{ textAlign: "center" }}>
          <img
            src={business.logoUrl}
            alt={`${business.name} Logo`}
            style={{
              width: "auto",
              height: "150px",
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      {globalConfig?.brandingMediaUrl && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <img
            src={globalConfig?.brandingMediaUrl}
            alt={`${globalConfig?.appName} Branding`}
            style={{
              width: "auto",
              height: "100px",
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      {/* Bubbles */}
      {questions.length === 0 ? (
        <Typography
          variant="h6"
          color="text.secondary"
          textAlign="center"
          mt={6}
        >
          {t.noQuestionsYet}
        </Typography>
      ) : (
        <div className="question-container">
          {bubbles.map((q) => {
            const style = {
              "--float-duration": q.floatDuration,
              "--float-delay": q.floatDelay,
              "--fade-delay": q.fadeDelay,
              "--scale": q.scale,
              fontSize: q.fontSize,
            };

            return (
              <div key={q._id} className="bubble-question" style={style}>
                {q.votes > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -12,
                      right: -12,
                      background: "#d32f2f",
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 8px rgba(0,0,0,0.3)",
                      fontSize: "1rem",
                    }}
                  >
                    {toArabicDigits(String(q.votes), language)}
                  </span>
                )}

                {translatedQuestionTexts[q._id] ?? q.text}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <Footer />
    </Box>
    <LanguageSelector top={20} right={20} />
    </Box>
  );
}
