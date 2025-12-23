"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Tooltip,
  Divider,
  Container,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import {
  addParticipant,
  deleteParticipant,
  exportSpinWheelParticipantsXlsx,
  getParticipantsBySlug,
  getSpinWheelSyncFilters,
  syncSpinWheelParticipants,
} from "@/services/eventwheel/spinWheelParticipantService";
import { getSpinWheelBySlug } from "@/services/eventwheel/spinWheelService";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import LoadingState from "@/components/LoadingState";
import NoDataAvailable from "@/components/NoDataAvailable";
import useSpinWheelSocket from "@/hooks/modules/eventwheel/useSpinWheelSocket";

const translations = {
  en: {
    participants: "Participants",
    manageParticipants: "Manage participants for",
    addParticipant: "Add Participant",
    save: "Save",
    name: "Name",
    phone: "Phone",
    company: "Company",
    deleteParticipant: "Delete Participant",
    deleteTitle: "Delete Participant?",
    deleteMessage:
      "Are you sure you want to move this item to the Recycle Bin?",
    delete: "Delete",
    syncParticipants: "Sync Participants",
    exportParticipants: "Export Participants",
  },
  ar: {
    participants: "المشاركون",
    manageParticipants: "إدارة المشاركين لـ",
    addParticipant: "إضافة مشارك",
    save: "حفظ",
    name: "الاسم",
    phone: "الهاتف",
    company: "الشركة",
    deleteParticipant: "حذف المشارك",
    deleteTitle: "حذف المشارك؟",
    deleteMessage: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    delete: "حذف",
    syncParticipants: "مزامنة المشاركين",
    exportParticipants: "تصدير المشاركين",
  },
};

const ParticipantsAdminPage = () => {
  const router = useRouter();
  const { t, dir } = useI18nLayout(translations);
  const params = useParams();
  const slug = params?.wheelSlug;
  const [participants, setParticipants] = useState([]);
  const [event, setEvent] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", company: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [availableScanners, setAvailableScanners] = useState([]);
  const [selectedScanners, setSelectedScanners] = useState([]);

  const { syncProgress } = useSpinWheelSocket({
    spinWheelId: event?._id,
  });

  const isSyncComplete =
    syncProgress.total > 0 && syncProgress.synced >= syncProgress.total;

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const eventData = await getSpinWheelBySlug(slug);
    setEvent(eventData);
  }, [slug]);

  const fetchParticipants = useCallback(async () => {
    if (!slug) return;
    const participantsData = await getParticipantsBySlug(slug);
    setParticipants(participantsData);
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchData();
      fetchParticipants();
    }
  }, [slug, fetchData, fetchParticipants]);

  useEffect(() => {
    if (syncing && isSyncComplete) {
      setSyncing(false);
      setSyncDialogOpen(false);
      setSelectedScanners([]);
      fetchParticipants();
    }
  }, [syncing, isSyncComplete]);

  const handleExport = async () => {
  await exportSpinWheelParticipantsXlsx(event._id);
};

  const handleOpenModal = () => {
    setForm({ name: "", phone: "", company: "" });
    setErrors({});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setErrors({});
  };

  const handleOpenSyncModal = async () => {
    setSyncDialogOpen(true);

    try {
      const res = await getSpinWheelSyncFilters(event._id);
      setAvailableScanners(res.scannedBy || []);
    } catch {
      setAvailableScanners([]);
    }
  };

  const handleSync = async () => {
    setSyncing(true);

    await syncSpinWheelParticipants(event._id, {
      filters: {
        scannedBy: selectedScanners,
      },
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name || form.name.trim() === "")
      newErrors.name = "Name is required";
    if (!form.phone || form.phone.trim() === "")
      newErrors.phone = "Phone is required";
    if (!form.company || form.company.trim() === "")
      newErrors.company = "Company is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddParticipant = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const payload = {
      ...form,
      spinWheelId: event._id,
    };
    await addParticipant(payload);
    setForm({ name: "", phone: "", company: "" });
    setSaving(false);
    setOpenModal(false);
    fetchParticipants();
  };

  const handleDeleteParticipant = async () => {
    await deleteParticipant(selectedParticipant);
    setParticipants((prev) =>
      prev.filter((p) => p._id !== selectedParticipant)
    );
    setConfirmDelete(false);
    setSelectedParticipant(null);
  };

  if (!slug || !event) return <LoadingState />;

  return (
    <Box dir={dir} sx={{ minHeight: "100vh", display: "flex" }}>
      <Container maxWidth="lg">
        <BreadcrumbsNav />

        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexWrap: "wrap",
            rowGap: 2,
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {t.participants}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t.manageParticipants} {event.title}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleExport}
              startIcon={<ICONS.download />}
              sx={getStartIconSpacing(dir)}
            >
              {t.exportParticipants}
            </Button>

            {event.type === "admin" && (
              <Button
                variant="contained"
                startIcon={<ICONS.add />}
                onClick={handleOpenModal}
                sx={getStartIconSpacing(dir)}
              >
                {t.addParticipant}
              </Button>
            )}

            {event.type === "synced" && (
              <Button
                variant="contained"
                color="info"
                startIcon={<ICONS.sync />}
                onClick={handleOpenSyncModal}
              >
                {t.syncParticipants}
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ py: 2 }}>
          {participants.length === 0 ? (
            <NoDataAvailable />
          ) : (
            <Grid container spacing={3} justifyContent="center">
              {participants.map((participant) => (
                <Grid item xs={12} sm={6} md={4} key={participant._id}>
                  <Card
                    elevation={3}
                    sx={{
                      position: "relative",
                      height: "100%",
                      minWidth: "250px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderRadius: 2,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                  >
                    <CardHeader title={participant.name} sx={{ pb: 0 }} />
                    <CardContent sx={{ flexGrow: 1 }}>
                      {participant.phone && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t.phone}:</strong> {participant.phone}
                        </Typography>
                      )}
                      {participant.company && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t.company}:</strong> {participant.company}
                        </Typography>
                      )}
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: "flex-end", p: 1.5 }}>
                      <Tooltip title={t.deleteParticipant}>
                        <IconButton
                          onClick={() => {
                            setSelectedParticipant(participant._id);
                            setConfirmDelete(true);
                          }}
                          color="error"
                        >
                          <ICONS.delete />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Add Participant Modal */}
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{t.addParticipant}</DialogTitle>
          <DialogContent>
            <TextField
              name="name"
              label={t.name}
              fullWidth
              margin="normal"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              error={!!errors.name}
              helperText={errors.name}
            />
            <TextField
              name="phone"
              label={t.phone}
              fullWidth
              margin="normal"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              required
              error={!!errors.phone}
              helperText={errors.phone}
            />
            <TextField
              name="company"
              label={t.company}
              fullWidth
              margin="normal"
              value={form.company}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, company: e.target.value }))
              }
              required
              error={!!errors.company}
              helperText={errors.company}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>{t.delete}</Button>
            <Button
              variant="contained"
              onClick={handleAddParticipant}
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {t.save}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmationDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDeleteParticipant}
          title={t.deleteTitle}
          message={t.deleteMessage}
          confirmButtonText={t.delete}
          confirmButtonIcon={<ICONS.delete />}
        />

        <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)}>
          <DialogTitle>Sync Participants</DialogTitle>
          <DialogContent>
            <TextField
              select
              label="Scanned By"
              fullWidth
              SelectProps={{ multiple: true }}
              value={selectedScanners}
              onChange={(e) => setSelectedScanners(e.target.value)}
            >
              {availableScanners.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName || user.email}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSync}
              disabled={syncing}
              startIcon={syncing && <CircularProgress size={18} />}
              sx={{
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                minWidth: 200,
              }}
            >
              <Typography variant="button">{t.syncParticipants}</Typography>

              {syncing && (
                <Typography variant="caption">
                  Synced {syncProgress.synced} / {syncProgress.total}
                </Typography>
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ParticipantsAdminPage;
