"use client";
import {
  Box,
  Container,
  Typography,
  Stack,
  Divider,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import { useEffect, useState } from "react";
import { useMessage } from "@/contexts/MessageContext";
import { getAllBusinesses } from "@/services/businessService";
import {
  getQuestionsByBusiness,
  updateQuestion,
  deleteQuestion,
} from "@/services/stageq/questionService";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { useAuth } from "@/contexts/AuthContext";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import LoadingState from "@/components/LoadingState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Manage Questions",
    description:
      "Select a business to review and moderate questions submitted by visitors.",
    selectBusinessButton: "Select Business",
    openFullScreenButton: "Open Full Screen",
    editQuestionTitle: "Edit Question",
    editQuestionLabel: "Question Text",
    updateButton: "Update",
    cancelButton: "Cancel",
    deleteQuestionTitle: "Delete Question",
    deleteQuestionMessage:
      "Are you sure you want to move this item to the Recycle Bin?",
    deleteButton: "Delete",
    markAsAnswered: "Mark as Answered",
    markAsUnanswered: "Mark as Unanswered",
    editQuestionTooltip: "Edit Question",
    deleteQuestionTooltip: "Delete Question",
    anonymous: "Anonymous",
    notProvided: "Not provided",
    vote: "vote",
    votes: "votes",
    failedToUpdateAnsweredStatus: "Failed to update answered status",
  },
  ar: {
    title: "إدارة الأسئلة",
    description: "اختر عملاً لمراجعة وتعديل الأسئلة المرسلة من الزوار.",
    selectBusinessButton: "اختيار العمل",
    openFullScreenButton: "فتح في شاشة كاملة",
    editQuestionTitle: "تحرير السؤال",
    editQuestionLabel: "نص السؤال",
    updateButton: "تحديث",
    cancelButton: "إلغاء",
    deleteQuestionTitle: "حذف السؤال",
    deleteQuestionMessage:
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    deleteButton: "حذف",
    markAsAnswered: "تمييز كمجاب عليه",
    markAsUnanswered: "تمييز كغير مجاب عليه",
    editQuestionTooltip: "تحرير السؤال",
    deleteQuestionTooltip: "حذف السؤال",
    anonymous: "مجهول",
    notProvided: "غير مقدم",
    vote: "صوت",
    votes: "أصوات",
    failedToUpdateAnsweredStatus: "فشل في تحديث حالة الإجابة",
  },
};
export default function ManageQuestionsPage() {
  const { showMessage } = useMessage();
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const { t, dir } = useI18nLayout(translations);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const fetchBusinesses = async () => {
    const data = await getAllBusinesses();
    setBusinesses(data);

    if (user?.role === "business" && !selectedBusiness) {
      const userBusiness = data.find(
        (business) => business.slug === user.business?.slug
      );
      if (userBusiness) {
        setSelectedBusiness(userBusiness.slug);
        fetchQuestions(userBusiness.slug);
      }
    } else if (selectedBusiness) {
      fetchQuestions(selectedBusiness);
    }
  };

  const fetchQuestions = async (slug) => {
    setLoading(true);
    const data = await getQuestionsByBusiness(slug);
    setQuestions(data);
    setLoading(false);
  };

  const handleBusinessSelect = (businessSlug) => {
    setSelectedBusiness(businessSlug);
    fetchQuestions(businessSlug);
    setDrawerOpen(false);
  };

  const handleDelete = async () => {
    await deleteQuestion(confirmDelete.id);
    fetchQuestions(selectedBusiness);
    setConfirmDelete({ open: false, id: null });
  };

  const handleEditSubmit = async () => {
    await updateQuestion(editData._id, { text: editData.text });
    fetchQuestions(selectedBusiness);
    setEditDialogOpen(false);
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusiness) return;

    fetchQuestions(selectedBusiness);

    const interval = setInterval(() => {
      fetchQuestions(selectedBusiness);
    }, 10000); // every 10 seconds

    return () => clearInterval(interval);
  }, [selectedBusiness]);

  return (
    <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Main Content */}
      <Container maxWidth="lg">
        <BreadcrumbsNav />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          mb={3}
        >
          {/* Title + Description */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.description}
            </Typography>
          </Box>

          {/* Buttons */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{
              width: { xs: "100%", sm: "auto" },
              gap: dir === "rtl" ? 1 : 0,
            }}
          >
            {(user?.role === "admin" || user?.role === "superadmin") && (
              <Button
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
                startIcon={<ICONS.business fontSize="small" />}
                size="medium"
                sx={{ ...getStartIconSpacing(dir) }}
              >
                {t.selectBusinessButton}
              </Button>
            )}
            {selectedBusiness && (
              <Button
                variant="contained"
                color="success"
                onClick={() =>
                  window.open(
                    `/stageq/queries/${selectedBusiness}/display`,
                    "_blank"
                  )
                }
                startIcon={<ICONS.fullscreen fontSize="small" />}
                size="medium"
                sx={{ ...getStartIconSpacing(dir) }}
              >
                {t.openFullScreenButton}
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : questions.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {questions.map((q) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={q._id}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    width: { xs: "100%", sm: "300px" },
                    borderRadius: 3,
                    boxShadow: 1,
                    bgcolor: "#fefefe",
                    px: 1,
                    py: 1.5,
                  }}
                >
                  <CardContent>
                    {/* Question Text */}
                    <Typography
                      fontWeight="bold"
                      fontSize="1.05rem"
                      color="text.primary"
                      sx={{ lineHeight: 1.4 }}
                    >
                      {q.text}
                    </Typography>
                  </CardContent>

                  {/* Visitor Info & Actions Grouped Together */}
                  <Box
                    sx={{
                      px: 2,
                      pb: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {/* Votes + Answered Toggle */}
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ gap: dir === "rtl" ? 1 : 0 }}
                      >
                        {<ICONS.thumb fontSize="small" />}
                        <Typography variant="body2" color="text.secondary">
                          {q.votes} {q.votes === 1 ? t.vote : t.votes}
                        </Typography>
                      </Stack>

                      <Tooltip
                        title={
                          q.answered ? t.markAsUnanswered : t.markAsAnswered
                        }
                      >
                        <IconButton
                          onClick={async () => {
                            try {
                              await updateQuestion(q._id, {
                                answered: !q.answered,
                              });
                              fetchQuestions(selectedBusiness);
                            } catch {
                              showMessage(
                                t.failedToUpdateAnsweredStatus,
                                "error"
                              );
                            }
                          }}
                          color={q.answered ? "success" : "default"}
                          size="small"
                        >
                          {q.answered ? (
                            <ICONS.checkCircle />
                          ) : (
                            <ICONS.checkCircleOutline />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Divider sx={{ my: 1 }} />

                    <Stack spacing={0.5}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ gap: dir === "rtl" ? 1 : 0 }}
                      >
                        <ICONS.person fontSize="small" />
                        <Typography variant="body2">
                          {q.visitor?.name || t.anonymous}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ gap: dir === "rtl" ? 1 : 0 }}
                      >
                        <ICONS.phone fontSize="small" />
                        <Typography variant="body2">
                          {q.visitor?.phone || t.notProvided}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ gap: dir === "rtl" ? 1 : 0 }}
                      >
                        <ICONS.business fontSize="small" />
                        <Typography variant="body2">
                          {q.visitor?.company || t.notProvided}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Actions */}
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      mt={1}
                    >
                      <Tooltip title={t.editQuestionTooltip}>
                        <IconButton
                          onClick={() => {
                            setEditData(q);
                            setEditDialogOpen(true);
                          }}
                          color="primary"
                          size="small"
                        >
                          <ICONS.edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.deleteQuestionTooltip}>
                        <IconButton
                          onClick={() =>
                            setConfirmDelete({ open: true, id: q._id })
                          }
                          color="error"
                          size="small"
                        >
                          <ICONS.delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t.editQuestionTitle}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t.editQuestionLabel}
              multiline
              minRows={3}
              value={editData?.text || ""}
              onChange={(e) =>
                setEditData({ ...editData, text: e.target.value })
              }
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: dir === "rtl" ? 1 : 0 }}>
            {dir === "rtl" ? (
              <>
                <Button
                  onClick={handleEditSubmit}
                  variant="contained"
                  endIcon={<ICONS.save fontSize="small" />}
                  sx={{ ...getStartIconSpacing(dir) }}
                >
                  {t.updateButton}
                </Button>
                <Button
                  onClick={() => setEditDialogOpen(false)}
                  color="error"
                  variant="outlined"
                  endIcon={<ICONS.close fontSize="small" />}
                  sx={{ ...getStartIconSpacing(dir) }}
                >
                  {t.cancelButton}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setEditDialogOpen(false)}
                  color="error"
                  variant="outlined"
                  startIcon={<ICONS.close fontSize="small" />}
                  sx={{ ...getStartIconSpacing(dir) }}
                >
                  {t.cancelButton}
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  variant="contained"
                  startIcon={<ICONS.save fontSize="small" />}
                  sx={{ ...getStartIconSpacing(dir) }}
                >
                  {t.updateButton}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {(user?.role === "admin" || user?.role === "superadmin") && (
          <BusinessDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            businesses={businesses}
            selectedBusinessSlug={selectedBusiness}
            onSelect={handleBusinessSelect}
          />
        )}

        {/* Delete Dialog */}
        <ConfirmationDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          onConfirm={handleDelete}
          title={t.deleteQuestionTitle}
          message={t.deleteQuestionMessage}
          confirmButtonText={t.deleteButton}
          confirmButtonIcon={<ICONS.delete fontSize="small" />}
          cancelButtonIcon={<ICONS.close fontSize="small" />}
        />
      </Container>
    </Box>
  );
}
