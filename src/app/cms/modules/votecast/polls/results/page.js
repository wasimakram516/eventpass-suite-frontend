"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
} from "@mui/material";
import ResultsChart from "@/components/ResultsChart";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import BusinessDrawer from "@/components/BusinessDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { getResults } from "@/services/votecast/pollsResultService";
import { resetVotes } from "@/services/votecast/pollService";
import { getAllBusinesses } from "@/services/businessService";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Poll Results Viewer",
    subtitle: "Select a business to view poll results and analytics.",
    selectBusiness: "Select Business",
    allPolls: "All Polls",
    activePolls: "Active Polls",
    archivedPolls: "Archived Polls",
    resetVotes: "Reset Votes",
    viewFullScreen: "View Full Screen",
    confirmVoteReset: "Confirm Vote Reset",
    resetConfirmation:
      "Are you sure you want to reset all votes for the selected polls? This action cannot be undone.",
    resetButton: "Reset",
    votesResetSuccess: "Votes reset successfully",
    failedToLoadBusinesses: "Failed to load businesses.",
    failedToFetchResults: "Failed to fetch poll results.",
    failedToResetVotes: "Failed to reset votes.",
    noBusinessesAvailable: "No businesses available",
  },
  ar: {
    title: "عارض نتائج الاستطلاع",
    subtitle: "اختر شركة لعرض نتائج الاستطلاع والتحليلات.",
    selectBusiness: "اختر الشركة",
    allPolls: "جميع الاستطلاعات",
    activePolls: "الاستطلاعات النشطة",
    archivedPolls: "الاستطلاعات المؤرشفة",
    resetVotes: "إعادة تعيين الأصوات",
    viewFullScreen: "عرض بملء الشاشة",
    confirmVoteReset: "تأكيد إعادة تعيين الأصوات",
    resetConfirmation:
      "هل أنت متأكد من أنك تريد إعادة تعيين جميع الأصوات للاستطلاعات المحددة؟ لا يمكن التراجع عن هذا الإجراء.",
    resetButton: "إعادة تعيين",
    votesResetSuccess: "تم إعادة تعيين الأصوات بنجاح",
    failedToLoadBusinesses: "فشل في تحميل الشركات.",
    failedToFetchResults: "فشل في جلب نتائج الاستطلاع.",
    failedToResetVotes: "فشل في إعادة تعيين الأصوات.",
    noBusinessesAvailable: "لا توجد شركات متاحة",
  },
};
export default function ResultsPage() {
  const { user } = useAuth();
  const { showMessage } = useMessage();
  const { t, dir } = useI18nLayout(translations);
  const [businesses, setBusinesses] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [pollStatus, setPollStatus] = useState("all");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      const businessList = await getAllBusinesses();
      setBusinesses(businessList);

      if (user?.role === "business") {
        const businessSlug = user.business.slug || businessList[0]?.slug || "";
        setSelectedBusiness(businessSlug);
        fetchResults(businessSlug, pollStatus);
      }
      setLoading(false);
    };

    fetchBusinesses();
  }, [user]);

  const fetchResults = async (businessSlug = "", status = "all") => {
    setLoading(true);

    const data = await getResults(businessSlug, status === "all" ? "" : status);
    setResults(data);

    setLoading(false);
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    setPollStatus(status);
    const businessSlug =
      user?.role === "business" ? user.business.slug : selectedBusiness;
    fetchResults(businessSlug, status === "all" ? "" : status);
  };

  const handleBusinessSelect = (businessSlug, status = pollStatus) => {
    console.log("In handle business Select:", businessSlug, status);
    setSelectedBusiness(businessSlug);
    fetchResults(businessSlug, status === "all" ? "" : status);
    setDrawerOpen(false);
  };

  const handleResetVotes = async () => {
    setLoading(true);

    const result = await resetVotes(
      selectedBusiness,
      pollStatus === "all" ? "" : pollStatus
    );

    fetchResults(selectedBusiness, pollStatus === "all" ? "" : pollStatus);

    setLoading(false);
    setConfirmReset(false);
  };

  return (
    <>
      <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
        {user?.role === "admin" && (
          <BusinessDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            businesses={businesses}
            selectedBusinessSlug={selectedBusiness}
            onSelect={handleBusinessSelect}
            title={t.selectBusiness}
            noDataText={t.noBusinessesAvailable}
          />
        )}

        {/* Main Content */}
        <Container maxWidth="lg">
          <BreadcrumbsNav />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "left" }}
            spacing={2}
            mb={2}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {t.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {" "}
                {t.subtitle}
              </Typography>
            </Box>

            <Stack direction={{ sm: "column", md:"row" }} spacing={2}>
              {user?.role === "admin" && (
                <Button
                  variant="outlined"
                  onClick={() => setDrawerOpen(true)}
                  startIcon={<ICONS.business fontSize="small" />}
                >
                  {t.selectBusiness}
                </Button>
              )}

              {(user?.role === "business" ||
                (user?.role === "admin" && selectedBusiness)) && (
                <Select
                  value={pollStatus}
                  onChange={handleStatusChange}
                  size="small"
                  sx={{ minWidth: 150 }}
                  MenuProps={{
                    disableScrollLock: true,
                  }}
                >
                  <MenuItem value="all">{t.allPolls}</MenuItem>
                  <MenuItem value="active">{t.activePolls}</MenuItem>
                  <MenuItem value="archived">{t.archivedPolls}</MenuItem>
                </Select>
              )}

              {results.length > 0 && selectedBusiness && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setConfirmReset(true)}
                >
                  {t.resetVotes}
                </Button>
              )}

              {results.length > 0 && selectedBusiness && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() =>
                    window.open(
                      `/votecast/polls/${selectedBusiness}/results?status=${
                        pollStatus === "all" ? "" : pollStatus
                      }`,
                      "_blank"
                    )
                  }
                >
                  {t.viewFullScreen}
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ mb: 4 }} />

          {!selectedBusiness ? (
          <Box
            sx={{
              mt: 8,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "text.secondary",
            }}
          >
            <ICONS.business sx={{ fontSize: 72, mb: 2 }} />
            <Typography variant="h6">{t.selectBusiness}</Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
            results.length > 0 && (
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
            )
          )}
        </Container>
      </Box>

      <ConfirmationDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetVotes}
        title={t.confirmVoteReset}
        message={t.resetConfirmation}
        confirmButtonText={t.resetButton}
      />
    </>
  );
}
