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
  FormControl,
  InputLabel,
} from "@mui/material";
import ResultsChart from "@/components/cards/ResultsChart";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { getResults } from "@/services/votecast/pollsResultService";
import { resetVotes } from "@/services/votecast/pollService";
import { getAllBusinesses } from "@/services/businessService";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import FilterDrawer from "@/components/modals/FilterModal";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Poll Results Viewer",
    subtitle: "Select a business to view poll results and analytics.",
    selectBusiness: "Select Business",
    allPolls: "All Polls",
    activePolls: "Active Polls",
    archivedPolls: "Archived Polls",
    moreFilters: "More Filters",
    filters: "Filters",
    pollStatus: "Poll Status",
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
    moreFilters: "المزيد من الفلاتر",
    filters: "الفلاتر",
    pollStatus: "حالة الاستطلاع",

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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

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
          />
        )}

        {/* Main Content */}
        <Container maxWidth="lg">
          <BreadcrumbsNav />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            mb={2}
          >
            {/* Left: Title + Subtitle */}
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {t.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {t.subtitle}
              </Typography>
            </Box>

            {/* Right: Buttons */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems="flex-start"
              sx={{
                gap: dir === "rtl" ? 1 : 0,
              }}
            >
              {user?.role === "admin" && (
                <Button
                  variant="outlined"
                  onClick={() => setDrawerOpen(true)}
                  startIcon={<ICONS.business fontSize="small" />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  {t.selectBusiness}
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => setFilterDrawerOpen(true)}
                startIcon={<ICONS.filter fontSize="small" />}
                sx={{
                  ...getStartIconSpacing(dir),
                  width: { xs: "100%", md: "auto" },
                }}
              >
                {t.moreFilters}
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 4 }} />

          {!selectedBusiness ? (
            <EmptyBusinessState />
          ) : loading ? (
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <CircularProgress />
            </Box>
          ) : results.length === 0 ? (
            <NoDataAvailable />
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

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title={t.filters}
      >
        {selectedBusiness ? (
          <>
            <FormControl fullWidth sx={{ mb: 2 }} size="large">
              <InputLabel id="poll-status-label">{t.pollStatus}</InputLabel>
              <Select
                labelId="poll-status-label"
                value={pollStatus}
                onChange={handleStatusChange}
                label={t.pollStatus}
                MenuProps={{
                  disableScrollLock: true,
                  container:
                    typeof window !== "undefined" ? document.body : undefined,
                }}
              >
                <MenuItem value="all">{t.allPolls}</MenuItem>
                <MenuItem value="active">{t.activePolls}</MenuItem>
                <MenuItem value="archived">{t.archivedPolls}</MenuItem>
              </Select>
            </FormControl>

            {results.length > 0 && (
              <>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  sx={{ mb: 2 }}
                  onClick={() => setConfirmReset(true)}
                  startIcon={<ICONS.refresh fontSize="small" />}
                >
                  {t.resetVotes}
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() =>
                    window.open(
                      `/votecast/polls/${selectedBusiness}/results?status=${pollStatus === "all" ? "" : pollStatus
                      }`,
                      "_blank"
                    )
                  }
                  startIcon={<ICONS.fullscreen fontSize="small" />}
                >
                  {t.viewFullScreen}
                </Button>
              </>
            )}
          </>
        ) : null}
      </FilterDrawer>

      <ConfirmationDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetVotes}
        title={t.confirmVoteReset}
        message={t.resetConfirmation}
        confirmButtonText={t.resetButton}
        confirmButtonIcon={<ICONS.refresh fontSize="small" />}
      />
    </>
  );
}
