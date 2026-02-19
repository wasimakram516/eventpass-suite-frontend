"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { getResults } from "@/services/votecast/pollsResultService";
import { getVoteCastEventBySlug } from "@/services/votecast/eventService";
import ResultsChart from "@/components/cards/ResultsChart";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";

const translations = {
  en: {
    loading: "Loading...",
    noResults: "No results available.",
    failedToFetch: "Failed to fetch results",
    eventNotFound: "Event not found",
  },
  ar: {
    loading: "جاري التحميل...",
    noResults: "لا توجد نتائج متاحة.",
    failedToFetch: "فشل في جلب النتائج",
    eventNotFound: "الفعالية غير موجودة",
  },
};

export default function FullScreenResultsPage() {
  const { eventSlug } = useParams();
  const { t, dir, align } = useI18nLayout(translations);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);

  const fetchResults = async () => {
    if (!event?._id) return;

    setLoading(true);
    try {
      const data = await getResults(event._id);
      setResults(data || []);
    } catch (error) {
      console.error("Failed to fetch results:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventSlug) return;

      try {
        const eventData = await getVoteCastEventBySlug(eventSlug);
        if (eventData?.error || !eventData) {
          setLoading(false);
          return;
        }
        setEvent(eventData);
      } catch (error) {
        console.error("Failed to fetch event:", error);
      }
    };

    fetchEvent();
  }, [eventSlug]);

  useEffect(() => {
    if (event?._id) {
      fetchResults();

      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchResults();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [event?._id]);

  if (loading && results.length === 0 && !event) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h6" color="error">
          {t.eventNotFound}
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
        {/* Results Section */}
        {loading && results.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "50vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : results.length > 0 ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 4,
              py: 4,
            }}
          >
            {results.map((poll) => (
              <ResultsChart key={poll._id} poll={poll} />
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

