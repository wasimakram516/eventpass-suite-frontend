"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { getResults } from "@/services/votecast/pollsResultService";
import ResultsChart from "@/components/ResultsChart";
import useI18nLayout from "@/hooks/useI18nLayout";
const translations = {
  en: {
    loading: "Loading...",
    noResults: "No results available.",
    failedToFetch: "Failed to fetch results",
  },
  ar: {
    loading: "جاري التحميل...",
    noResults: "لا توجد نتائج متاحة.",
    failedToFetch: "فشل في جلب النتائج",
  },
};
export default function FullScreenResultsPage() {
  const params = useParams();
  const { t, dir, align } = useI18nLayout(translations);
  const searchParams = useSearchParams();
  const businessSlug = params.businessSlug;
  const status = searchParams.get("status") || "";
  console.log("Translation:", t.loading);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    const data = await getResults(businessSlug, status);
    setResults(data);
    setLoading(false);
  };

  useEffect(() => {
    if (businessSlug) {
      fetchResults();

      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchResults();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [businessSlug, status]);

  if (loading && results.length === 0) {
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

  return (
    <Box
      dir={dir}
      sx={{
        minHeight: "calc(100vh - 50px)",
        bgcolor: "background.default",
        pt: { xs: 10, md: 12 },
        px: { xs: 2, md: 4 },
      }}
    >
      {/* ✅ Results Section */}
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
  );
}
