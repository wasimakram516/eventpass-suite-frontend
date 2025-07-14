"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Stack,
  IconButton,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  Select,
  InputLabel,
  MenuItem,
  FormControl,
} from "@mui/material";
import { getAllBusinesses } from "@/services/businessService";
import { useMessage } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import PollFormDrawer from "@/components/PollFormDrawer";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import SharePollModal from "@/components/SharePollModal";
import ICONS from "@/utils/iconUtil";
import {
  getPolls,
  createPoll,
  updatePoll,
  deletePoll,
  clonePoll,
  exportPollsToExcel,
} from "@/services/votecast/pollService";
import BusinessDrawer from "@/components/BusinessDrawer";
import useI18nLayout from "@/hooks/useI18nLayout";
import FilterModal from "@/components/FilterModal";
const translations = {
  en: {
    title: "Manage Polls",
    subtitle: "Select a business to view and manage its polls.",
    createPoll: "Create Poll",
    selectBusiness: "Select Business",
    exportPolls: "Export Polls",
    allPolls: "All Polls",
    activePolls: "Active Polls",
    archivedPolls: "Archived Polls",
    moreFilters: "More Filters",
    filters: "Filters",
    pollStatus: "Poll Status",
    noBusiness: "No business",
    clone: "Clone",
    edit: "Edit",
    delete: "Delete",
    sharePollLink: "Share Poll Link",
    deletePoll: "Delete Poll",
    deleteConfirmation:
      "Are you sure you want to delete this poll? This action cannot be undone.",
    deleteButton: "Delete",
    pollCreatedSuccess: "Poll created successfully",
    pollUpdatedSuccess: "Poll updated successfully",
    pollDeletedSuccess: "Poll deleted successfully",
    pollClonedSuccess: "Poll cloned successfully",
    failedToSavePoll: "Failed to save poll.",
    failedToDeletePoll: "Failed to delete poll.",
    failedToClonePoll: "Failed to clone poll",
    failedToExportPolls: "Failed to export polls.",
    failedToFetchPolls: "Failed to fetch polls.",
    noPermission: "You don't have permission to access this business's polls.",
    businessNotFound: "Business not found.",
    noBusinessForAccount:
      "No business found for your account. Please contact administrator.",
    failedToLoadBusinesses: "Failed to load businesses.",
    selectBusinessFirst: "Please select a business first.",
    selectBusinessToExport: "Please select a business to export polls.",
    noBusinessesAvailable: "No businesses available",
  },
  ar: {
    title: "إدارة الاستطلاعات",
    subtitle: "اختر شركة لعرض وإدارة استطلاعاتها.",
    createPoll: "إنشاء استطلاع",
    selectBusiness: "اختر الشركة",
    exportPolls: "تصدير الاستطلاعات",
    allPolls: "جميع الاستطلاعات",
    activePolls: "الاستطلاعات النشطة",
    archivedPolls: "الاستطلاعات المؤرشفة",
    noBusiness: "لا توجد شركة",
    clone: "نسخ",
    edit: "تحرير",
    delete: "حذف",
    moreFilters: "المزيد من الفلاتر",
    filters: "الفلاتر",
    pollStatus: "حالة الاستطلاع",
    sharePollLink: "مشاركة رابط الاستطلاع",
    deletePoll: "حذف الاستطلاع",
    deleteConfirmation:
      "هل أنت متأكد من أنك تريد حذف هذا الاستطلاع؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteButton: "حذف",
    pollCreatedSuccess: "تم إنشاء الاستطلاع بنجاح",
    pollUpdatedSuccess: "تم تحديث الاستطلاع بنجاح",
    pollDeletedSuccess: "تم حذف الاستطلاع بنجاح",
    pollClonedSuccess: "تم نسخ الاستطلاع بنجاح",
    failedToSavePoll: "فشل في حفظ الاستطلاع.",
    failedToDeletePoll: "فشل في حذف الاستطلاع.",
    failedToClonePoll: "فشل في نسخ الاستطلاع",
    failedToExportPolls: "فشل في تصدير الاستطلاعات.",
    failedToFetchPolls: "فشل في جلب الاستطلاعات.",
    noPermission: "ليس لديك صلاحية للوصول إلى استطلاعات هذه الشركة.",
    businessNotFound: "الشركة غير موجودة.",
    noBusinessForAccount:
      "لم يتم العثور على شركة لحسابك. يرجى الاتصال بالمسؤول.",
    failedToLoadBusinesses: "فشل في تحميل الشركات.",
    selectBusinessFirst: "يرجى اختيار شركة أولاً.",
    selectBusinessToExport: "يرجى اختيار شركة لتصدير الاستطلاعات.",
    noBusinessesAvailable: "لا توجد شركات متاحة",
  },
};

export default function ManagePollsPage() {
  const { user } = useAuth();
  const { showMessage } = useMessage();
  const { t, dir } = useI18nLayout(translations);

  const [polls, setPolls] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editPoll, setEditPoll] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePoll, setSharePoll] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [pollStatus, setPollStatus] = useState("all"); // "all", "active", "archived"
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);

      const businessList = await getAllBusinesses();
      setBusinesses(businessList);

      if (user?.role === "business") {
        const userBusiness = businessList.find(
          (business) =>
            business.slug === user.business?.slug ||
            business._id === user.business?._id
        );
        if (userBusiness) {
          setSelectedBusiness(userBusiness.slug);
          fetchPolls(userBusiness.slug, pollStatus);
        }
      }

      setLoading(false);
    };

    fetchBusinesses();
  }, [user, pollStatus]);

  // / --- Fetch polls from API ---
  const fetchPolls = async (businessSlug = "", status = "all") => {
    setLoading(true);
    const result = await getPolls(businessSlug, status === "all" ? "" : status);
    setPolls(result.data || result);

    setLoading(false);
  };
  // Poll creation and update ---
  const handleSubmit = async (formData, id = null) => {
    setLoading(true);

    if (id) {
      const result = await updatePoll(id, formData);
      setPolls((prev) => prev.map((poll) => (poll._id === id ? result : poll)));
      setOpenDrawer(false);
      setEditPoll(null);
    } else {
      const result = await createPoll(formData);
      const newPollWithBusiness = {
        ...result,
        business: selectedBusinessObject,
      };
      setPolls((prev) => [...prev, newPollWithBusiness]);
      setOpenDrawer(false);
      setEditPoll(null);
    }

    setLoading(false);
  };
  // Handle poll deletion
  const handleDelete = async () => {
    setLoading(true);

    const result = await deletePoll(confirmDelete.id);

    setPolls((prev) => prev.filter((poll) => poll._id !== confirmDelete.id));
    setConfirmDelete({ open: false, id: null });

    setLoading(false);
  };

  // --- Handle business selection (admin only) ---
  const handleBusinessSelect = (businessSlug, status = pollStatus) => {
    setSelectedBusiness(businessSlug);
    fetchPolls(businessSlug, status);
    setDrawerOpen(false);
  };

  // --- Handle poll cloning ---
  const handleClone = async (pollId) => {
    setLoading(true);

    const result = await clonePoll(pollId);
    const clonedPollWithBusiness = {
      ...(result.data || result),
      business: selectedBusinessObject,
    };

    setPolls((prev) => [...prev, clonedPollWithBusiness]);

    setLoading(false);
  };
  // Find the selected business object
  const selectedBusinessObject = businesses.find(
    (business) => business.slug === selectedBusiness
  );

  return (
    <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
      {/* --- Sidebar Drawer only for admin --- */}
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            rowGap: 2,
            mt: 2,
          }}
        >
          {/* Left: Heading */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "auto" } }}>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t.subtitle}
            </Typography>
          </Box>

          {/* Right: Main Actions + Filter Toggle */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              flexShrink: 0,
              alignItems: "stretch", // makes buttons 100% in column layout
              width: { xs: "100%", sm: "auto" }, // full width only on xs
            }}
          >
            {user?.role === "admin" && (
              <Button
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
                startIcon={<ICONS.business fontSize="small" />}
                fullWidth
              >
                {t.selectBusiness}
              </Button>
            )}

            {selectedBusiness && (
              <Button
                variant="contained"
                startIcon={<ICONS.add fontSize="small" />}
                onClick={() => {
                  setEditPoll(null);
                  setOpenDrawer(true);
                }}
                fullWidth
              >
                {t.createPoll}
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={() => setFilterDrawerOpen(true)}
              startIcon={<ICONS.filter fontSize="small" />}
              fullWidth
            >
              {t.moreFilters}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Polls Display */}
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
          selectedBusiness && (
            <Grid container spacing={3} justifyContent={"center"}>
              {polls.map((poll) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={poll._id}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Card
                    elevation={3}
                    sx={{
                      width: { xs: "100%", sm: 300 },
                      maxWidth: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      position: "relative",
                      px: 2,
                      py: 2,
                    }}
                  >
                    {/* Custom Header Stack */}
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={1}
                    >
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <ICONS.poll fontSize="small" />
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {poll.question}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ display: "block" }}
                        >
                          {poll.business?.name || t.noBusiness}
                        </Typography>
                      </Box>
                      <Chip
                        label={poll.status}
                        color={poll.status === "active" ? "success" : "default"}
                        size="small"
                      />
                    </Stack>

                    {/* Options */}
                    <CardContent sx={{ flexGrow: 1, pt: 1 }}>
                      <Stack spacing={1}>
                        {poll.options.map((opt, idx) => (
                          <Stack
                            key={idx}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ overflow: "hidden" }}
                          >
                            {opt.imageUrl && (
                              <Avatar
                                src={opt.imageUrl}
                                alt={`Option ${idx + 1}`}
                                variant="rounded"
                                sx={{ width: 40, height: 40 }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ flexGrow: 1 }}
                            >
                              {opt.text}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ justifyContent: "center", pt: 1 }}>
                      <Tooltip title={t.clone}>
                        <IconButton
                          color="secondary"
                          onClick={() => handleClone(poll._id)}
                        >
                          <ICONS.copy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.edit}>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setEditPoll(poll);
                            setOpenDrawer(true);
                          }}
                        >
                          <ICONS.edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.delete}>
                        <IconButton
                          color="error"
                          onClick={() =>
                            setConfirmDelete({ open: true, id: poll._id })
                          }
                        >
                          <ICONS.delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.sharePollLink}>
                        <IconButton
                          color="info"
                          onClick={() => {
                            setSharePoll(poll);
                            setShareOpen(true);
                          }}
                        >
                          <ICONS.share fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )
        )}

        {/* Drawer with Poll Status and Export Button */}
        <FilterModal
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
                  onChange={(e) => {
                    const status = e.target.value;
                    setPollStatus(status);
                    fetchPolls(
                      selectedBusiness,
                      status === "all" ? "" : status
                    );
                  }}
                  label={t.pollStatus}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                  MenuProps={{ disableScrollLock: true }}
                >
                  <MenuItem value="all">{t.allPolls}</MenuItem>
                  <MenuItem value="active">{t.activePolls}</MenuItem>
                  <MenuItem value="archived">{t.archivedPolls}</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                color="success"
                fullWidth
                onClick={async () => {
                  setLoading(true);
                  const result = await exportPollsToExcel(
                    selectedBusiness,
                    pollStatus === "all" ? "" : pollStatus
                  );
                  if (result?.error) {
                    showMessage(t.failedToExportPolls, "error");
                  }
                  setLoading(false);
                }}
              >
                {t.exportPolls}
              </Button>
            </>
          ) : null}
        </FilterModal>

        {/* Create/Edit Poll Drawer */}
        <PollFormDrawer
          open={openDrawer}
          onClose={() => {
            setOpenDrawer(false);
            setEditPoll(null);
          }}
          onSubmit={handleSubmit}
          initialValues={editPoll}
          business={selectedBusinessObject}
        />

        {/* Delete Poll Dialog */}
        <ConfirmationDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          onConfirm={handleDelete}
          title={t.sharePollLink}
          message={t.deleteConfirmation}
          confirmButtonText={t.deleteButton}
        />

        {/* Share Modal */}
        <SharePollModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          poll={sharePoll}
        />
      </Container>
    </Box>
  );
}
