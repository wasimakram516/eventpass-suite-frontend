"use client";

import { useEffect, useState } from "react";
import { useParams,useSearchParams } from "next/navigation";
import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import { getResults } from "@/services/votecast/pollsResultService";
import ResultsChart from "@/components/ResultsChart";

export default function FullScreenResultsPage() {
  const params = useParams();
const searchParams = useSearchParams();
const businessSlug = params.businessSlug;
const status = searchParams.get("status") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      const data = await getResults(businessSlug, status);
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch results", error);
    } finally {
      setLoading(false);
    }
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
        <Typography textAlign="center" variant="h6" mt={12}>
          No results available.
        </Typography>
      )}
    </Box>
  );
}
