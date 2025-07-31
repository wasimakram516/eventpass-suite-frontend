"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
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

  const { dir, t } = useI18nLayout({
    en: {
      title: "Event Details",
      description:
        "View event details and manage registrations for this event. Export registration data or delete entries as needed.",
      export: "Export to CSV",
      exporting: "Exporting...",
      records: "records",
      noRecords: "No registrations found for this event.",
      delete: "Delete Registration",
      deleteMessage: "Are you sure you want to delete this registration?",
      fullName: "Full Name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      companyLabel: "Company",
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
      records: "سجلات",
      noRecords: "لا توجد تسجيلات لهذا الحدث.",
      delete: "حذف التسجيل",
      deleteMessage: "هل أنت متأكد أنك تريد حذف هذا التسجيل؟",
      fullName: "الاسم الكامل",
      emailLabel: "البريد الإلكتروني",
      phoneLabel: "الهاتف",
      companyLabel: "الشركة",
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
    if (eventSlug) fetchData();
  }, [eventSlug, page, limit]);

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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.description}
          </Typography>
        </Box>
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
          >
            {exportLoading ? t.exporting || "Exporting..." : t.export}
          </Button>
        )}
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
                    minWidth: { sm: 250 },
                    maxWidth: { sm: 360 },
                    boxShadow: 3,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <CardContent>
                    {dynamicFields.map((f) => (
                      <Typography
                        key={f.name}
                        variant="body2"
                        sx={{ mt: 1, ...wrapTextBox }}
                      >
                        <strong>{f.label}</strong>{" "}
                        {reg.customFields?.[f.name] ?? reg[f.name] ?? "N/A"}
                      </Typography>
                    ))}
                    <Typography variant="body2" sx={{ mt: 1, ...wrapTextBox }}>
                      <strong>{t.registeredAt}</strong>{" "}
                      {formatDateTimeWithLocale(reg.createdAt)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center" }}>
                    <Tooltip title={t.viewWalkIns}>
                      <IconButton
                        color="info"
                        onClick={() => {
                          setSelectedRegistration(reg);
                          setWalkInModalOpen(true);
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
      />

      <WalkInModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        registration={selectedRegistration}
      />
    </Container>
  );
}
