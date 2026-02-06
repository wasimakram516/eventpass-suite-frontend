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
  Pagination,
  Chip,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  addParticipant,
  deleteParticipant,
  exportSpinWheelParticipantsXlsx,
  getParticipantsBySlug,
  getParticipantsForCMS,
  getSpinWheelSyncFilters,
  syncSpinWheelParticipants,
  uploadParticipants,
  downloadSampleExcel,
  downloadCountryReference,
} from "@/services/eventwheel/spinWheelParticipantService";
import { getSpinWheelBySlug } from "@/services/eventwheel/spinWheelService";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import RecordMetadata from "@/components/RecordMetadata";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import LoadingState from "@/components/LoadingState";
import NoDataAvailable from "@/components/NoDataAvailable";
import useSpinWheelSocket from "@/hooks/modules/eventwheel/useSpinWheelSocket";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import { DEFAULT_ISO_CODE, formatPhoneNumberForDisplay } from "@/utils/countryCodes";

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
    uploadParticipants: "Upload Participants",
    uploadFile: "Upload File",
    uploading: "Uploading",
    downloadSample: "Download Sample",
    winner: "Winner",
    recordsPerPage: "Records per page",
    showing: "Showing",
    to: "to",
    of: "of",
    createdBy: "Created:",
    createdAt: "Created At:",
    updatedBy: "Updated:",
    updatedAt: "Updated At:",
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
    uploadParticipants: "رفع المشاركين",
    uploadFile: "رفع ملف",
    uploading: "جاري الرفع",
    downloadSample: "تنزيل النموذج",
    winner: "الفائز",
    recordsPerPage: "السجلات لكل صفحة",
    showing: "عرض",
    to: "إلى",
    of: "من",
    createdBy: "أنشئ:",
    createdAt: "تاريخ الإنشاء:",
    updatedBy: "حدث:",
    updatedAt: "تاريخ التحديث:",
  },
};

const ParticipantsAdminPage = () => {
  const router = useRouter();
  const { t, dir, language } = useI18nLayout(translations);
  const params = useParams();
  const slug = params?.wheelSlug;
  const [participants, setParticipants] = useState([]);
  const [event, setEvent] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", company: "", isoCode: DEFAULT_ISO_CODE });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [availableScanners, setAvailableScanners] = useState([]);
  const [selectedScanners, setSelectedScanners] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalParticipants: 0,
    perPage: 10,
  });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    const eventData = await getSpinWheelBySlug(slug);
    setEvent(eventData);
  }, [slug]);

  const fetchParticipants = useCallback(async (page = 1, limit = 10) => {
    if (!event?._id) return;
    setLoading(true);
    try {
      const response = await getParticipantsForCMS(event._id, page, limit);
      if (response?.data && response?.pagination) {
        setParticipants(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    } finally {
      setLoading(false);
    }
  }, [event?._id]);

  const handleUploadProgress = useCallback(
    (data) => {
      if (data.uploaded >= data.total && data.total > 0) {
        setTimeout(() => {
          setUploading(false);
          fetchParticipants(pagination.currentPage, pagination.perPage);
        }, 1000);
      }
    },
    [fetchParticipants, pagination.currentPage, pagination.perPage]
  );

  const { syncProgress, uploadProgress } = useSpinWheelSocket({
    spinWheelId: event?._id,
    onUploadProgress: handleUploadProgress,
  });

  const isSyncComplete =
    syncProgress.total > 0 && syncProgress.synced >= syncProgress.total;

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug, fetchData]);

  useEffect(() => {
    if (event?._id) {
      const page = pagination.currentPage;
      const limit = pagination.perPage;
      fetchParticipants(page, limit);
    }
  }, [event?._id, pagination.currentPage, pagination.perPage, fetchParticipants]);

  useEffect(() => {
    if (syncing && isSyncComplete) {
      setSyncing(false);
      setSyncDialogOpen(false);
      setSelectedScanners([]);
      fetchParticipants(pagination.currentPage, pagination.perPage);
    }
  }, [syncing, isSyncComplete, fetchParticipants, pagination.currentPage, pagination.perPage]);

  const handleUpload = async (e) => {
    if (!event?._id) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadParticipants(event._id, file);
      if (result?.error) {
        setUploading(false);
        e.target.value = "";
        return;
      }
      e.target.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    await exportSpinWheelParticipantsXlsx(event._id);
  };

  const handleDownloadSample = async () => {
    if (!event?._id) return;
    try {
      // Download sample Excel file
      const sampleBlob = await downloadSampleExcel(event._id);
      const sampleUrl = URL.createObjectURL(sampleBlob);
      const sampleLink = document.createElement("a");
      sampleLink.href = sampleUrl;
      sampleLink.download = `spinwheel_${event.slug || "participants"}_template.xlsx`;
      document.body.appendChild(sampleLink);
      sampleLink.click();
      document.body.removeChild(sampleLink);
      URL.revokeObjectURL(sampleUrl);

      // Download country reference file
      const countryBlob = await downloadCountryReference();
      const countryUrl = URL.createObjectURL(countryBlob);
      const countryLink = document.createElement("a");
      countryLink.href = countryUrl;
      countryLink.download = "country_reference.xlsx";
      document.body.appendChild(countryLink);
      countryLink.click();
      document.body.removeChild(countryLink);
      URL.revokeObjectURL(countryUrl);
    } catch (err) {
      console.error("Failed to download sample:", err);
    }
  };

  const handleOpenModal = () => {
    setForm({ name: "", phone: "", company: "", isoCode: DEFAULT_ISO_CODE });
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddParticipant = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const payload = {
      name: form.name,
      phone: form.phone,
      company: form.company,
      isoCode: form.isoCode,
      spinWheelId: event._id,
    };
    await addParticipant(payload);
    setForm({ name: "", phone: "", company: "", isoCode: DEFAULT_ISO_CODE });
    setSaving(false);
    setOpenModal(false);
    fetchParticipants(pagination.currentPage, pagination.perPage);
  };

  const handleDeleteParticipant = async () => {
    await deleteParticipant(selectedParticipant);
    setConfirmDelete(false);
    setSelectedParticipant(null);
    fetchParticipants(pagination.currentPage, pagination.perPage);
  };

  const handlePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, currentPage: value }));
  };

  const handlePerPageChange = (e) => {
    const newPerPage = Number(e.target.value);
    setPagination((prev) => ({ ...prev, perPage: newPerPage, currentPage: 1 }));
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
            {event.type === "admin" && (
              <>
                <Button
                  variant="contained"
                  startIcon={<ICONS.add />}
                  onClick={handleOpenModal}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.addParticipant}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleDownloadSample}
                  startIcon={<ICONS.download />}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.downloadSample}
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={
                    uploading ? <CircularProgress size={20} /> : <ICONS.upload />
                  }
                  disabled={uploading}
                  sx={getStartIconSpacing(dir)}
                >
                  {uploading && uploadProgress?.total
                    ? `${t.uploading} ${uploadProgress.uploaded}/${uploadProgress.total}`
                    : uploading
                      ? t.uploading
                      : t.uploadFile}
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={handleUpload}
                  />
                </Button>
              </>
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

            <Button
              variant="outlined"
              color="primary"
              onClick={handleExport}
              startIcon={<ICONS.download />}
              sx={getStartIconSpacing(dir)}
            >
              {t.exportParticipants}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Search, Filter, and Info Toolbar */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={2}
          mb={3}
          px={{ xs: 1, sm: 2 }}
        >
          {/* Left: Record info */}
          <Box width="100%" maxWidth={{ xs: "100%", md: "50%" }}>
            <Typography variant="body2" color="text.secondary">
              {t.showing}{" "}
              {pagination.totalParticipants === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.perPage + 1}
              -
              {Math.min(
                pagination.currentPage * pagination.perPage,
                pagination.totalParticipants
              )}{" "}
              {t.of} {pagination.totalParticipants}
            </Typography>
          </Box>

          {/* Right: Records per page */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              width: { xs: "100%", md: "auto" },
            }}
          >
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 150 },
              }}
            >
              <InputLabel>{t.recordsPerPage}</InputLabel>
              <Select
                value={pagination.perPage}
                onChange={handlePerPageChange}
                label={t.recordsPerPage}
              >
                {[5, 10, 20, 50, 100, 250, 500].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        <Box sx={{ py: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : participants.length === 0 ? (
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
                    <CardHeader
                      title={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="h6">{participant.name}</Typography>
                          {participant.isWinner && (
                            <Chip
                              label={t.winner}
                              color="success"
                              size="small"
                              sx={{ fontWeight: "bold" }}
                            />
                          )}
                        </Box>
                      }
                      sx={{ pb: 0 }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      {participant.phone && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t.phone}:</strong> {formatPhoneNumberForDisplay(participant.phone, participant.isoCode)}
                        </Typography>
                      )}
                      {participant.company && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t.company}:</strong> {participant.company}
                        </Typography>
                      )}
                      {participant.visible === false && (
                        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                          <strong>Removed from wheel</strong>
                        </Typography>
                      )}
                    </CardContent>
                    <RecordMetadata
                      createdByName={participant.createdBy}
                      updatedByName={participant.updatedBy}
                      createdAt={participant.createdAt}
                      updatedAt={participant.updatedAt}
                      createdByDisplayName={participant.name}
                      updatedByDisplayName={participant.name}
                      locale={language === "ar" ? "ar-SA" : "en-GB"}
                    />
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

          {/* Pagination */}
          {pagination.totalParticipants > pagination.perPage && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                dir="ltr"
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={handlePageChange}
              />
            </Box>
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
              type="tel"
              InputProps={{
                startAdornment: (
                  <CountryCodeSelector
                    value={form.isoCode}
                    onChange={(iso) =>
                      setForm((prev) => ({ ...prev, isoCode: iso }))
                    }
                    disabled={false}
                    dir={dir}
                  />
                ),
              }}
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
