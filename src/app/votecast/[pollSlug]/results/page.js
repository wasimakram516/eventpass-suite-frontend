"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { getPublicPollBySlug, getPollResults } from "@/services/votecast/pollService";
import ResultsChart from "@/components/cards/ResultsChart";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";

const translations = {
  en: {
    loading: "Loading...",
    noResults: "No results available.",
    failedToFetch: "Failed to fetch results",
    pollNotFound: "Poll not found",
  },
  ar: {
    loading: "جاري التحميل...",
    noResults: "لا توجد نتائج متاحة.",
    failedToFetch: "فشل في جلب النتائج",
    pollNotFound: "الاستطلاع غير موجود",
  },
};

export default function FullScreenResultsPage() {
  const { pollSlug } = useParams();
  const { t, dir, align } = useI18nLayout(translations);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (!pollSlug) return;
      setLoading(true);
      try {
        const pollData = await getPublicPollBySlug(pollSlug);
        if (!pollData || pollData.error) {
          setLoading(false);
          return;
        }
        setPoll(pollData);

        const data = await getPollResults(pollData._id);
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch poll results:", error);
      }
      setLoading(false);
    };

    init();

    // Auto-refresh every 10 seconds
    const interval = setInterval(async () => {
      if (!pollSlug) return;
      try {
        const pollData = await getPublicPollBySlug(pollSlug);
        if (pollData?._id) {
          const data = await getPollResults(pollData._id);
          setResults(Array.isArray(data) ? data : []);
        }
      } catch {
        // silent refresh failure
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [pollSlug]);

  if (loading && results.length === 0) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!poll) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <Typography variant="h6" color="error">
          {t.pollNotFound}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <LanguageSelector top={20} right={20} />
      <Box
        dir={dir}
        sx={{
          minHeight: "calc(100vh - 50px)",
          bgcolor: "background.default",
          pt: { xs: 10, md: 12 },
          px: { xs: 2, md: 4 },
        }}
      >
        {results.length > 0 ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 4,
              py: 4,
            }}
          >
            {results.map((question) => (
              <ResultsChart key={question._id} poll={question} />
            ))}
          </Box>
        ) : (
          <Typography textAlign={align} variant="h6" mt={12}>
            {t.noResults}
          </Typography>
        )}
      </Box>
    </>
  );
}
