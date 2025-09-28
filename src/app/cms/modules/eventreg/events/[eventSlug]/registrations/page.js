"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CircularProgress,
  IconButton,
  Button,
  Pagination,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  Container,
  Stack,
  CardActions,
  Tooltip,
} from "@mui/material";

import {
  getRegistrationsByEvent,
  deleteRegistration,
  getAllPublicRegistrationsByEvent,
  downloadSampleExcel,
  uploadRegistrations,
} from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { formatDate, formatDateTimeWithLocale } from "@/utils/dateUtils";
import { useParams } from "next/navigation";
import ICONS from "@/utils/iconUtil";
import WalkInModal from "@/components/WalkInModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import NoDataAvailable from "@/components/NoDataAvailable";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import useEventRegSocket from "@/hooks/modules/eventReg/useEventRegSocket";

export default function ViewRegistrations() {
  const { eventSlug } = useParams();

  const [eventDetails, setEventDetails] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const { progress } = useEventRegSocket({
    eventId: eventDetails?._id,
    onProgress: (data) => {
      setUploadProgress(data);
      if (data.uploaded === data.total) {
        setTimeout(() => setUploadProgress(null), 2000);
      }
    },
  });

  const { dir, t } = useI18nLayout({
    en: {
      title: "Event Details",
      description:
        "View event details and manage registrations for this event. Export registration data or delete entries as needed.",
      export: "Export to CSV",
      exporting: "Exporting...",
      downloadSample: "Download Sample",
      uploadFile: "Upload File",
      uploading: "Uploading...",
      records: "records",
      noRecords: "No registrations found for this event.",
      delete: "Delete",
      deleteMessage:
        "Are you sure you want to move this item to the Recycle Bin?",
      fullName: "Full Name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      companyLabel: "Company",
      token: "Token",
      registeredAt: "Registered At",
      viewWalkIns: "View Walk-in Records",
      deleteRecord: "Delete Registration",
      recordsPerPage: "Records per page",
      showing: "Showing",
      to: "to",
      of: "of",
    },
    ar: {
      title: "تفاصيل الحدث",
      description:
        "اعرض تفاصيل الحدث وقم بإدارة التسجيلات. يمكنك تصدير البيانات أو حذف السجلات.",
      export: "تصدير إلى CSV",
      exporting: "جاري التصدير...",
      downloadSample: "تنزيل نموذج",
      uploadFile: "رفع ملف",
      uploading: "جاري الرفع...",
      records: "سجلات",
      noRecords: "لا توجد تسجيلات لهذا الحدث.",
      delete: "حذف",
      deleteMessage:
        "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
      fullName: "الاسم الكامل",
      emailLabel: "البريد الإلكتروني",
      phoneLabel: "الهاتف",
      companyLabel: "الشركة",
      token: "الرمز",
      registeredAt: "تاريخ التسجيل",
      viewWalkIns: "عرض سجلات الحضور",
      deleteRecord: "حذف التسجيل",
      recordsPerPage: "عدد السجلات لكل صفحة",
      showing: "عرض",
      to: "إلى",
      of: "من",
    },
  });

  useEffect(() => {
    if (eventSlug) fetchData();
  }, [eventSlug, page, limit]);

  const fetchData = async () => {
    setLoading(true);

    const [evRes, regRes] = await Promise.all([
      getPublicEventBySlug(eventSlug),
      getRegistrationsByEvent(eventSlug, page, limit),
    ]);

    if (!evRes?.error) {
      setEventDetails(evRes);
      const fields = evRes.formFields?.length
        ? evRes.formFields.map((f) => ({
            name: f.inputName,
            label: f.inputName,
          }))
        : [
            { name: "fullName", label: t.fullName },
            { name: "email", label: t.emailLabel },
            { name: "phone", label: t.phoneLabel },
            { name: "company", label: t.companyLabel },
          ];
      setDynamicFields(fields);
    }

    if (!regRes?.error) {
      setRegistrations(regRes.data || []);
      setTotalRegistrations(regRes.pagination.totalRegistrations || 0);
    }

    setLoading(false);
  };

  const handleDownloadSample = async () => {
    if (!eventSlug) return;
    try {
      const blob = await downloadSampleExcel(eventSlug);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        eventDetails.slug || "event"
      }_registrations_template.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download sample:", err);
    }
  };

  const handleUpload = async (e) => {
    if (!eventSlug) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadRegistrations(eventSlug, file);
      // Refresh after upload
      fetchData();
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const handlePageChange = (_, value) => setPage(value);
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleDelete = async () => {
    const res = await deleteRegistration(registrationToDelete);
    if (!res?.error) {
      setRegistrations((prev) =>
        prev.filter((r) => r._id !== registrationToDelete)
      );
      setTotalRegistrations((t) => t - 1);
    }
    setDeleteDialogOpen(false);
  };

  const exportToCSV = async () => {
    if (!eventDetails) return;

    setExportLoading(true);
    const res = await getAllPublicRegistrationsByEvent(eventSlug);
    if (res?.error) return;

    const registrationsToExport = res;

    const lines = [];

    // Event metadata
    lines.push([`Event Slug:`, eventDetails.slug || `N/A`].join(`,`));
    lines.push([`Event Name:`, eventDetails.name || `N/A`].join(`,`));
    lines.push(
      [
        `Event Dates:`,
        formatDate(eventDetails.startDate) +
          (eventDetails.endDate &&
          eventDetails.endDate !== eventDetails.startDate
            ? ` to ${formatDate(eventDetails.endDate)}`
            : ``),
      ].join(`,`)
    );
    lines.push([`Venue:`, eventDetails.venue || `N/A`].join(`,`));
    lines.push([`Description:`, eventDetails.description || `N/A`].join(`,`));
    lines.push([`Logo URL:`, eventDetails.logoUrl || `N/A`].join(`,`));
    lines.push([`Event Type:`, eventDetails.eventType || `N/A`].join(`,`));
    lines.push([]);

    // Header row for registrations
    const regHeaders = [
      ...dynamicFields.map((f) => f.label),
      `Token`,
      t.registeredAt,
    ];
    lines.push(regHeaders.join(`,`));

    registrationsToExport.forEach((reg) => {
      const row = dynamicFields.map((f) => {
        return `"${(reg.customFields?.[f.name] ?? reg[f.name] ?? ``)
          .toString()
          .replace(/"/g, `""`)}"`;
      });
      row.push(
        `"${reg.token}"`,
        `"${formatDateTimeWithLocale(reg.createdAt)}"`
      );
      lines.push(row.join(`,`));
    });

    const allWalkIns = registrationsToExport.flatMap((reg) =>
      (reg.walkIns || []).map((w) => ({
        token: reg.token,
        scannedAt: w.scannedAt,
        scannedBy: w.scannedBy?.name || w.scannedBy?.email || `Unknown`,
      }))
    );

    if (allWalkIns.length > 0) {
      lines.push([]);
      lines.push([`Registration Token`, `Scanned At`, `Scanned By`].join(`,`));
      allWalkIns.forEach((w) => {
        lines.push(
          [
            `"${w.token}"`,
            `"${formatDateTimeWithLocale(w.scannedAt)}"`,
            `"${w.scannedBy.replace(/"/g, `""`)}"`,
          ].join(`,`)
        );
      });
    }

    // Add UTF-8 BOM here
    const csvContent = `\uFEFF` + lines.join(`\n`);
    const blob = new Blob([csvContent], { type: `text/csv;charset=utf-8;` });

    const link = document.createElement(`a`);
    link.href = URL.createObjectURL(blob);
    link.download = `${eventDetails.slug || `event`}_registrations.csv`;
    link.click();
    setExportLoading(false);
  };

  if (loading) {
    return (
      <Box
        minHeight="60vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ my: 3 }}
      >
        {/* Left side: title + description */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.description}
          </Typography>
        </Box>

        {/* Right side: action buttons */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            variant="outlined"
            startIcon={<ICONS.download />}
            onClick={handleDownloadSample}
            fullWidth
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
            fullWidth
          >
            {uploading && uploadProgress
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

          {totalRegistrations > 0 && (
            <Button
              variant="contained"
              onClick={exportToCSV}
              disabled={exportLoading}
              startIcon={
                exportLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ICONS.download />
                )
              }
              sx={getStartIconSpacing(dir)}
              fullWidth
            >
              {exportLoading ? t.exporting : t.export}
            </Button>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        px={2}
      >
        <Typography>
          {t.showing} {(page - 1) * limit + 1}-
          {Math.min(page * limit, totalRegistrations)} {t.of}{" "}
          {totalRegistrations} {t.records}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150, ml: 2 }}>
          <InputLabel>{t.recordsPerPage}</InputLabel>
          <Select
            value={limit}
            onChange={handleLimitChange}
            label={t.recordsPerPage}
            sx={{ pr: dir === "rtl" ? 1 : undefined }}
          >
            {[5, 10, 20, 50, 100, 250, 500].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!registrations.length ? (
        <NoDataAvailable />
      ) : (
        <>
          <Grid container spacing={4} justifyContent="center">
            {registrations.map((reg) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={reg._id}
                sx={{
                  display: { xs: "flex", sm: "block" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <Card
                  sx={{
                    width: "100%",
                    width: { xs: "100%", sm: 340 },
                    height: "100%",
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  {/* Header with token + date */}
                  <Box
                    sx={{
                      background: "linear-gradient(to right, #f5f5f5, #fafafa)", // ✅ subtle modern look
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      p: 2,
                    }}
                  >
                    <Stack spacing={0.6}>
                      {/* Token */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ICONS.qrcode
                          sx={{ fontSize: 28, color: "primary.main" }}
                        />
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={wrapTextBox}
                        >
                          {t.token}: {reg.token}
                        </Typography>
                      </Stack>

                      {/* Date with icon */}
                      <Typography
                        variant="caption"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: "text.secondary",
                        }}
                      >
                        <ICONS.time fontSize="inherit" sx={{ opacity: 0.7 }} />
                        {formatDateTimeWithLocale(reg.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Dynamic Fields */}
                  <CardContent sx={{ flexGrow: 1, px: 2, py: 1.5 }}>
                    {dynamicFields.map((f) => (
                      <Box
                        key={f.name}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          py: 0.8,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-of-type": { borderBottom: "none" },
                        }}
                      >
                        {/* Field Label */}
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                            color: "text.secondary",
                          }}
                        >
                          <ICONS.personOutline
                            fontSize="small"
                            sx={{ opacity: 0.6 }}
                          />
                          {f.label}
                        </Typography>

                        {/* Field Value */}
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            ml: 2,
                            textAlign: "right",
                            flex: 1,
                            color: "text.primary",
                            ...wrapTextBox, // ✅ allow wrapping
                          }}
                        >
                          {reg.customFields?.[f.name] ?? reg[f.name] ?? "—"}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>

                  {/* Actions */}
                  <CardActions
                    sx={{
                      justifyContent: "center",
                      borderTop: "1px solid rgba(0,0,0,0.08)",
                      bgcolor: "rgba(0,0,0,0.02)",
                      py: 1,
                    }}
                  >
                    <Tooltip title={t.viewWalkIns}>
                      <IconButton
                        color="info"
                        onClick={() => {
                          setSelectedRegistration(reg);
                          setWalkInModalOpen(true);
                        }}
                        sx={{
                          "&:hover": { transform: "scale(1.1)" },
                          transition: "0.2s",
                        }}
                      >
                        <ICONS.view />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={t.deleteRecord}>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setRegistrationToDelete(reg._id);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{
                          "&:hover": { transform: "scale(1.1)" },
                          transition: "0.2s",
                        }}
                      >
                        <ICONS.delete />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              dir="ltr"
              count={Math.ceil(totalRegistrations / limit)}
              page={page}
              onChange={handlePageChange}
            />
          </Box>
        </>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t.delete}
        message={t.deleteMessage}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
      />

      <WalkInModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        registration={selectedRegistration}
      />
    </Container>
  );
}
