"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Stack,
  IconButton,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Divider,
} from "@mui/material";
import AppCard from "@/components/cards/AppCard";
import { useMessage } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import PollFormDrawer from "@/components/drawers/PollFormDrawer";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import ICONS from "@/utils/iconUtil";
import {
  getPolls,
  createPoll,
  updatePoll,
  deletePoll,
  clonePoll,
  exportPollsToExcel,
} from "@/services/votecast/pollService";
import { getVoteCastEventBySlug } from "@/services/votecast/eventService";
import useI18nLayout from "@/hooks/useI18nLayout";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import RecordMetadata from "@/components/RecordMetadata";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Manage Polls",
    subtitle: "Manage polls for this event.",
    createPoll: "Create Poll",
    exportPolls: "Export Polls",
    exporting: "Exporting...",
    clone: "Clone",
    edit: "Edit",
    delete: "Delete",
    deletePoll: "Delete Poll",
    deleteConfirmation:
      "Are you sure you want to move this item to the Recycle Bin?",
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
    eventNotFound: "Event not found.",
    noBusiness: "No business",
    createdBy: "Created:",
    createdAt: "Created At:",
    updatedBy: "Updated:",
    updatedAt: "Updated At:",
  },
  ar: {
    title: "إدارة الاستطلاعات",
    subtitle: "إدارة الاستطلاعات لهذه الفعالية.",
    createPoll: "إنشاء استطلاع",
    exportPolls: "تصدير الاستطلاعات",
    exporting: "جاري التصدير...",
    clone: "نسخ",
    edit: "تحرير",
    delete: "حذف",
    deletePoll: "حذف الاستطلاع",
    deleteConfirmation:
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
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
    eventNotFound: "الفعالية غير موجودة.",
    noBusiness: "لا توجد شركة",
    createdBy: "أنشئ:",
    createdAt: "تاريخ الإنشاء:",
    updatedBy: "حدث:",
    updatedAt: "تاريخ التحديث:",
  },
};

export default function ManagePollsPage() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showMessage } = useMessage();
  const { t, dir, language } = useI18nLayout(translations);

  const [polls, setPolls] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editPoll, setEditPoll] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  useEffect(() => {
    const fetchEventAndPolls = async () => {
      if (!eventSlug) return;

      setLoading(true);
      try {
        const eventData = await getVoteCastEventBySlug(eventSlug);
        if (eventData?.error || !eventData) {
          showMessage(t.eventNotFound, "error");
          setLoading(false);
          return;
        }
        setEvent(eventData);

        const pollsData = await getPolls(eventData._id);
        setPolls(pollsData || []);
      } catch (error) {
        showMessage(t.failedToFetchPolls, "error");
      }
      setLoading(false);
    };

    fetchEventAndPolls();
  }, [eventSlug]);

  const handleMediaDeleted = (optionIndex, updatedPoll) => {
    if (!updatedPoll?._id) return;

    setPolls((prev) =>
      prev.map((poll) => (poll._id === updatedPoll._id ? updatedPoll : poll))
    );

    if (editPoll?._id === updatedPoll._id) {
      setEditPoll(updatedPoll);
    }
  };

  const handleSubmit = async (formData, id = null) => {
    setLoading(true);

    if (id) {
      const result = await updatePoll(id, formData);
      setPolls((prev) => prev.map((poll) => (poll._id === id ? result : poll)));
      setOpenDrawer(false);
      setEditPoll(null);
    } else {
      const result = await createPoll(formData);
      setPolls((prev) => [...prev, result]);
      setOpenDrawer(false);
      setEditPoll(null);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);

    const result = await deletePoll(confirmDelete.id);

    setPolls((prev) => prev.filter((poll) => poll._id !== confirmDelete.id));
    setConfirmDelete({ open: false, id: null });

    setLoading(false);
  };

  const handleClone = async (pollId) => {
    setLoading(true);

    const result = await clonePoll(pollId);
    setPolls((prev) => [...prev, result]);

    setLoading(false);
  };

  const handleExport = async () => {
    if (!event?._id) {
      showMessage(t.eventNotFound, "error");
      return;
    }

    setExportLoading(true);
    try {
      await exportPollsToExcel(event._id);
    } catch (error) {
      showMessage(t.failedToExportPolls, "error");
    }
    setExportLoading(false);
  };

  if (!event && !loading) {
    return (
      <Container maxWidth="lg">
        <BreadcrumbsNav />
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Typography variant="h6" color="error">
            {t.eventNotFound}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box dir={dir}>
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
          <Box sx={{ flex: { xs: "1 1 100%", sm: "auto" } }}>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t.subtitle}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              flexShrink: 0,
              alignItems: "stretch",
              width: { xs: "100%", sm: "auto" },
              gap: dir === "rtl" ? 2 : 1,
            }}
          >
            {event && (
              <>
                <Button
                  variant="contained"
                  startIcon={<ICONS.add fontSize="small" />}
                  onClick={() => {
                    setEditPoll(null);
                    setOpenDrawer(true);
                  }}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.createPoll}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleExport}
                  disabled={exportLoading}
                  startIcon={
                    exportLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ICONS.download fontSize="small" />
                    )
                  }
                  sx={getStartIconSpacing(dir)}
                >
                  {exportLoading ? t.exporting : t.exportPolls}
                </Button>
              </>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {loading && polls.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : !polls || polls.length === 0 ? (
          <NoDataAvailable />
        ) : (
          event && (
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
                    width: { xs: "100%", sm: 420 },
                  }}
                >
                  <AppCard
                    sx={{
                      width: { xs: "100%", sm: 420 },
                      maxWidth: { xs: "100%", sm: 420 },
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      position: "relative",
                      p: 0,
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ px: 2, pt: 2 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={1}
                        sx={{
                          gap: dir === "rtl" ? 1 : 0,
                        }}
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
                        </Box>
                      </Stack>

                      <CardContent sx={{ flexGrow: 1, pt: 1, px: 0, pb: 0 }}>
                        <Stack spacing={1}>
                          {poll.options.map((opt, idx) => (
                            <Stack
                              key={idx}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{
                                overflow: "hidden",
                                gap: dir === "rtl" ? 1 : 0,
                              }}
                            >
                              {opt.imageUrl && (
                                <Avatar
                                  src={opt.imageUrl}
                                  alt={`Option ${idx + 1}`}
                                  variant="rounded"
                                  sx={{ width: 40, height: 40 }}
                                />
                              )}
                              {opt.text && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ flexGrow: 1 }}
                                >
                                  {opt.text}
                                </Typography>
                              )}
                            </Stack>
                          ))}
                        </Stack>
                      </CardContent>
                    </Box>

                    <RecordMetadata
                      createdBy={poll.createdBy}
                      updatedBy={poll.updatedBy}
                      createdAt={poll.createdAt}
                      updatedAt={poll.updatedAt}
                      locale={language === "ar" ? "ar-SA" : "en-GB"}
                      createdByLabel={t.createdBy}
                      createdAtLabel={t.createdAt}
                      updatedByLabel={t.updatedBy}
                      updatedAtLabel={t.updatedAt}
                    />

                    <CardActions
                      sx={{
                        justifyContent: "space-around",
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        border: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: "none",
                        p: 1,
                        bgcolor: "rgba(0,0,0,0.02)",
                        m: 0,
                      }}
                    >
                      <Tooltip title={t.clone}>
                        <IconButton
                          color="secondary"
                          onClick={() => handleClone(poll._id)}
                          sx={{
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                        >
                          <ICONS.copy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.edit}>
                        <IconButton
                          color="warning"
                          onClick={() => {
                            setEditPoll(poll);
                            setOpenDrawer(true);
                          }}
                          sx={{
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                        >
                          <ICONS.edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.delete}>
                        <IconButton
                          color="error"
                          onClick={() =>
                            setConfirmDelete({ open: true, id: poll._id })
                          }
                          sx={{
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                        >
                          <ICONS.delete />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </AppCard>
                </Grid>
              ))}
            </Grid>
          )
        )}

        <PollFormDrawer
          open={openDrawer}
          onClose={() => {
            setOpenDrawer(false);
            setEditPoll(null);
          }}
          onSubmit={handleSubmit}
          initialValues={editPoll}
          event={event}
          onMediaDeleted={handleMediaDeleted}
        />

        <ConfirmationDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          onConfirm={handleDelete}
          title={t.deletePoll}
          message={t.deleteConfirmation}
          confirmButtonText={t.deleteButton}
          confirmButtonIcon={<ICONS.delete fontSize="small" />}
        />

      </Container>
    </Box>
  );
}

