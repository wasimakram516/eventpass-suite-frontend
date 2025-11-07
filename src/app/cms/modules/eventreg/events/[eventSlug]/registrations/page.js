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
  TextField,
  Chip,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import FilterDialog from "@/components/FilterModal";
import {
  getRegistrationsByEvent,
  deleteRegistration,
  getAllPublicRegistrationsByEvent,
  downloadSampleExcel,
  uploadRegistrations,
  getUnsentCount,
  sendBulkEmails,
  updateRegistration,
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
import { exportAllBadges } from "@/utils/exportBadges";
import EditRegistrationModal from "@/components/EditRegistrationModal";

const translations = {
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
    matchingRecords: "{count} matching record",
    matchingRecordsPlural: "{count} matching records",
    found: "found",
    exportAll: "Export All",
    exportFiltered: "Export Filtered",
    filters: "Filters",
    applyFilters: "Apply",
    clearFilters: "Clear",
    clearAll: "Clear All",
    activeFilters: "Active Filters",
    filterBy: "Filter by",
    from: "From",
    to: "To",
    scannedBy: "Scanned By (Name or Email)",
    scannedAt: "Scanned At",
    staffType: "Staff Type",
    searchPlaceholder: "Search...",
    apply: "Apply",
    clear: "Clear",
    filterRegistrations: "Filter Registrations",
    sendBulkEmails: "Send Bulk Emails",
    sendingEmails: "Sending Emails...",
    confirmBulkEmails:
      "Are you sure you want to send {count} bulk emails for this event?",
    emailSent: "Email Sent",
    emailNotSent: "Email Not Sent",
    exportBadges: "Export Badges",
    editRegistration: "Edit Registration",
    copyToken: "Copy Token",
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
    deleteMessage: "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
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
    matchingRecords: "{count} سجل مطابق",
    matchingRecordsPlural: "{count} سجلات مطابقة",
    found: "تم العثور عليها",
    exportAll: "تصدير الكل",
    exportFiltered: "تصدير النتائج المصفاة",
    filters: "تصفية",
    applyFilters: "تطبيق",
    clearFilters: "مسح",
    clearAll: "مسح الكل",
    activeFilters: "الفلاتر النشطة",
    filterBy: "تصفية حسب",
    from: "من",
    to: "إلى",
    scannedBy: "تم المسح بواسطة (الاسم أو البريد الإلكتروني)",
    scannedAt: "تاريخ المسح",
    staffType: "نوع الطاقم",
    searchPlaceholder: "بحث...",
    apply: "تطبيق",
    clear: "مسح",
    filterRegistrations: "تصفية التسجيلات",
    sendBulkEmails: "إرسال رسائل البريد الإلكتروني الجماعية",
    sendingEmails: "جاري إرسال الرسائل...",
    confirmBulkEmails:
      "هل أنت متأكد أنك تريد إرسال {count} رسالة بريد إلكتروني جماعية لهذا الحدث؟",
    emailSent: "تم الإرسال",
    emailNotSent: "لم يتم الإرسال",
    exportbadges: "تصدير الشارات",
    editRegistration: "تعديل التسجيل",
    copyToken: "نسخ الرمز",
  },
};

export default function ViewRegistrations() {
  const { eventSlug } = useParams();
  const { dir, t } = useI18nLayout(translations);

  const BASE_DATE_FILTERS = {
    createdAtFromMs: null,
    createdAtToMs: null,
    scannedAtFromMs: null,
    scannedAtToMs: null,
    scannedBy: "",
    token: "",
  };

  function buildFilterState(fieldsLocal, prev = {}) {
    const dynamic = Object.fromEntries(
      (fieldsLocal || []).map((f) => [f.name, prev[f.name] ?? ""])
    );
    return { ...BASE_DATE_FILTERS, ...dynamic };
  }

  const [eventDetails, setEventDetails] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [fieldMetaMap, setFieldMetaMap] = useState({});
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [unsentEmailCount, setUnsentEmailCount] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exportingBadges, setExportingBadges] = useState(false);

  const [rawSearch, setRawSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState(BASE_DATE_FILTERS);

  const [sendingEmails, setSendingEmails] = useState(false);
  const [confirmEmailDialogOpen, setConfirmEmailDialogOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState(null);

  useEffect(() => {
    if (eventSlug) fetchData();
  }, [eventSlug]);

  useEffect(() => {
    const id = setTimeout(
      () => setSearchTerm(rawSearch.trim().toLowerCase()),
      20
    );
    return () => clearTimeout(id);
  }, [rawSearch]);

  const { uploadProgress, emailProgress } = useEventRegSocket({
    eventId: eventDetails?._id,
  });

  const handleSaveEdit = async (updatedFields) => {
    const res = await updateRegistration(editingReg._id, updatedFields);
    if (!res?.error) {
      setAllRegistrations((prev) =>
        prev.map((r) =>
          r._id === editingReg._id
            ? { ...r, customFields: { ...r.customFields, ...updatedFields } }
            : r
        )
      );
      setEditModalOpen(false);
    } else {
      alert(res.error);
    }
  };

  const handleSendBulkEmails = async () => {
    setConfirmEmailDialogOpen(false);
    setSendingEmails(true);
    try {
      await sendBulkEmails(eventSlug);
    } catch (err) {
      console.error("Bulk email send failed:", err);
    } finally {
      fetchData();
      setUnsentEmailCount(0);
      setSendingEmails(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);

    const evRes = await getPublicEventBySlug(eventSlug);
    const unsentRes = await getUnsentCount(eventSlug);
    setUnsentEmailCount(unsentRes?.unsentCount || 0);

    const fieldsLocal =
      !evRes?.error && evRes.formFields?.length
        ? evRes.formFields.map((f) => ({
            name: f.inputName,
            type: (f.inputType || "text").toLowerCase(),
            values: Array.isArray(f.values) ? f.values : [],
          }))
        : [
            { name: "fullName", type: "text", values: [] },
            { name: "email", type: "text", values: [] },
            { name: "phone", type: "text", values: [] },
            { name: "company", type: "text", values: [] },
          ];

    if (!evRes?.error) {
      setEventDetails(evRes);
      setTotalRegistrations(evRes.registrations);
    }
    setDynamicFields(fieldsLocal);
    setFieldMetaMap(
      Object.fromEntries(
        fieldsLocal.map((f) => [f.name, { type: f.type, values: f.values }])
      )
    );

    // Ensure filters include ALL dynamic keys
    setFilters((prev) => buildFilterState(fieldsLocal, prev));

    // 2) Helper to build search haystack ONCE per record (includes all dynamic fields)
    function buildHaystack(reg) {
      const dyn = fieldsLocal.map(
        (f) => reg.customFields?.[f.name] ?? reg[f.name]
      );
      const walk = (reg.walkIns || []).flatMap((w) => [
        w.scannedBy?.name,
        w.scannedBy?.email,
      ]);
      return [
        reg.fullName,
        reg.email,
        reg.phone,
        reg.company,
        reg.token,
        ...dyn,
        ...walk,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    }

    // 3) Fetch ALL registrations ONCE and preprocess
    const regsRes = await getAllPublicRegistrationsByEvent(eventSlug);
    if (!regsRes?.error) {
      const prepped = regsRes.map((r) => ({
        ...r,
        _createdAtMs: Date.parse(r.createdAt),
        _scannedAtMs: (r.walkIns || []).map((w) => Date.parse(w.scannedAt)),
        _haystack: buildHaystack(r),
      }));
      setAllRegistrations(prepped);
    }

    setLoading(false);
  };

  const filteredRegistrations = React.useMemo(() => {
    const {
      createdAtFromMs,
      createdAtToMs,
      scannedAtFromMs,
      scannedAtToMs,
      ...restFilters
    } = filters;

    return allRegistrations.filter((reg) => {
      if (searchTerm && !reg._haystack.includes(searchTerm)) return false;

      // Date: createdAt (UTC ms bounds)
      if (createdAtFromMs != null && reg._createdAtMs < createdAtFromMs)
        return false;
      if (createdAtToMs != null && reg._createdAtMs > createdAtToMs)
        return false;

      // Date: scannedAt (any walk-in within range)
      if (scannedAtFromMs != null || scannedAtToMs != null) {
        const ok = reg._scannedAtMs.some((d) => {
          if (scannedAtFromMs != null && d < scannedAtFromMs) return false;
          if (scannedAtToMs != null && d > scannedAtToMs) return false;
          return true;
        });
        if (!ok) return false;
      }

      // Generic dynamic filters (all fields)
      for (const [key, rawValue] of Object.entries(restFilters)) {
        if (rawValue == null || rawValue === "") continue;
        if (key.endsWith("Ms") || key.endsWith("From") || key.endsWith("To"))
          continue;

        if (key === "scannedBy") {
          const hit = (reg.walkIns || []).some((w) =>
            [w.scannedBy?.name, w.scannedBy?.email]
              .filter(Boolean)
              .some((v) =>
                v
                  .toString()
                  .toLowerCase()
                  .includes(String(rawValue).toLowerCase())
              )
          );
          if (!hit) return false;
          continue;
        }

        const meta = fieldMetaMap[key];
        const regValue =
          reg.customFields?.[key] ??
          reg[key] ??
          (key === "token"
            ? reg.token
            : key === "createdAt"
            ? reg.createdAt
            : "");

        const v = String(regValue ?? "").toLowerCase();
        const f = String(rawValue).toLowerCase();

        const isExact =
          meta && ["radio", "list", "select", "dropdown"].includes(meta.type);
        if (isExact ? v !== f : !v.includes(f)) return false;
      }

      return true;
    });
  }, [allRegistrations, filters, searchTerm, fieldMetaMap]);

  const paginatedRegistrations = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRegistrations.slice(start, start + limit);
  }, [filteredRegistrations, page, limit]);

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
      setAllRegistrations((prev) =>
        prev.filter((r) => r._id !== registrationToDelete)
      );

      setTotalRegistrations((t) => t - 1);
    }
    setDeleteDialogOpen(false);
  };

  const handleExportRegs = async () => {
    if (!eventDetails) return;

    setExportLoading(true);

    const isFiltered =
      searchTerm ||
      Object.keys(filters).some(
        (k) => filters[k] && !k.endsWith("From") && !k.endsWith("To")
      );

    let registrationsToExport = [];

    if (isFiltered) {
      registrationsToExport = filteredRegistrations;
    } else {
      const res = await getAllPublicRegistrationsByEvent(eventSlug);
      if (res?.error) return;
      registrationsToExport = res;
    }

    const lines = [];

    // ---- Event metadata ----
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

    // ---- Registrations Section ----
    lines.push([`=== Registrations ===`]);
    const regHeaders = [
      ...dynamicFields.map((f) => getFieldLabel(f.name)),
      t.token,
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

    // ---- Walk-ins Section ----
    const allWalkIns = registrationsToExport.flatMap((reg) =>
      (reg.walkIns || []).map((w) => ({
        ...w,
        regData: reg,
      }))
    );

    if (allWalkIns.length > 0) {
      lines.push([]);
      lines.push([`=== Walk-ins ===`]);

      const walkInHeaders = [
        ...dynamicFields.map((f) => getFieldLabel(f.name)),
        t.token,
        t.registeredAt,
        t.scannedAt,
        t.scannedBy,
        t.staffType,
      ];
      lines.push(walkInHeaders.join(`,`));

      allWalkIns.forEach((w) => {
        const reg = w.regData;

        const row = dynamicFields.map((f) => {
          return `"${(reg.customFields?.[f.name] ?? reg[f.name] ?? "")
            .toString()
            .replace(/"/g, `""`)}"`;
        });

        // Capitalize staff type safely
        const staffTypeRaw = w.scannedBy?.staffType || "N/A";
        const staffType =
          staffTypeRaw && staffTypeRaw !== "N/A"
            ? staffTypeRaw.charAt(0).toUpperCase() + staffTypeRaw.slice(1)
            : "N/A";

        row.push(
          `"${reg.token}"`,
          `"${reg.createdAt ? formatDateTimeWithLocale(reg.createdAt) : ""}"`,
          `"${w.scannedAt ? formatDateTimeWithLocale(w.scannedAt) : ""}"`,
          `"${(w.scannedBy?.name || w.scannedBy?.email || "Unknown").replace(
            /"/g,
            `""`
          )}"`,
          `"${staffType}"`
        );

        lines.push(row.join(`,`));
      });
    }

    // ---- Save CSV ----
    const csvContent = `\uFEFF` + lines.join(`\n`);
    const blob = new Blob([csvContent], {
      type: `text/csv;charset=utf-8;`,
    });

    const link = document.createElement(`a`);
    link.href = URL.createObjectURL(blob);
    link.download = `${eventDetails.slug || `event`}_${
      isFiltered ? "filtered" : "all"
    }_registrations.csv`;
    link.click();

    setExportLoading(false);
  };

  const handleExportBadges = async () => {
    try {
      setExportingBadges(true);
      await exportAllBadges(paginatedRegistrations, eventDetails);
    } catch (err) {
      console.error("Badge export failed:", err);
    } finally {
      setExportingBadges(false);
    }
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
  const getFieldLabel = (fieldName) => {
    const labelMap = {
      fullName: t.fullName,
      email: t.emailLabel,
      phone: t.phoneLabel,
      company: t.companyLabel,
    };
    return labelMap[fieldName] || fieldName;
  };
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
      </Stack>
      {/* Right side: action buttons */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          width: { xs: "100%", sm: "auto" },
          gap: dir === "rtl" ? 1 : 0,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ICONS.download />}
          onClick={handleDownloadSample}
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
            color="secondary"
            disabled={sendingEmails}
            startIcon={
              sendingEmails ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.email />
              )
            }
            onClick={() => setConfirmEmailDialogOpen(true)}
            sx={getStartIconSpacing(dir)}
          >
            {sendingEmails && emailProgress
              ? `${t.sendingEmails} ${emailProgress.sent}/${unsentEmailCount}`
              : sendingEmails
              ? t.sendingEmails
              : t.sendBulkEmails}
          </Button>
        )}

        {totalRegistrations > 0 && (
          <Button
            variant="contained"
            onClick={handleExportRegs}
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
            {exportLoading
              ? t.exporting
              : searchTerm || Object.keys(filters).some((k) => filters[k])
              ? t.exportFiltered
              : t.exportAll}
          </Button>
        )}

        {totalRegistrations > 0 && (
          <Button
            variant="contained"
            color="primary"
            disabled={exportingBadges}
            startIcon={
              exportingBadges ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.pdf />
              )
            }
            onClick={handleExportBadges}
            sx={getStartIconSpacing(dir)}
          >
            {exportingBadges ? t.exporting : `${t.exportBadges} (Page ${page})`}
          </Button>
        )}
      </Stack>

      <Divider sx={{ my: 3 }} />

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
            {t.showing} {(page - 1) * limit + 1}-
            {Math.min(page * limit, totalRegistrations)} {t.of}{" "}
            {totalRegistrations} {t.records}
          </Typography>

          {/* Matching results counter */}
          {(searchTerm || Object.keys(filters).some((k) => filters[k])) && (
            <Typography
              variant="body2"
              color="primary"
              fontWeight="500"
              mt={0.5}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <ICONS.search fontSize="small" sx={{ opacity: 0.7 }} />
              {filteredRegistrations.length === 1
                ? t.matchingRecords.replace(
                    "{count}",
                    filteredRegistrations.length
                  )
                : t.matchingRecordsPlural.replace(
                    "{count}",
                    filteredRegistrations.length
                  )}{" "}
              {t.found}
            </Typography>
          )}
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="flex-end"
          width="100%"
          sx={
            dir === "rtl"
              ? {
                  columnGap: 1.5,
                  rowGap: 1.5,
                }
              : {}
          }
        >
          <TextField
            size="small"
            variant="outlined"
            placeholder={t.searchPlaceholder}
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <ICONS.search
                  fontSize="small"
                  sx={{
                    mr: dir === "rtl" ? 0 : 1,
                    ml: dir === "rtl" ? 1 : 0,
                    opacity: 0.6,
                  }}
                />
              ),
              sx:
                dir === "rtl"
                  ? {
                      paddingRight: 2,
                    }
                  : {},
            }}
            sx={{
              flex: 1,
              minWidth: { xs: "100%", sm: 220 },
              mr: dir === "rtl" ? 0 : 1.5,
              ml: dir === "rtl" ? 1.5 : 0,
            }}
          />
          <Button
            variant="outlined"
            startIcon={<ICONS.filter />}
            onClick={() => setFilterModalOpen(true)}
            sx={{
              width: { xs: "100%", sm: "auto" },
              ...getStartIconSpacing(dir),
            }}
          >
            {t.filters}
          </Button>

          {/* Records per page */}
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: "100%", sm: 150 },
              "& .MuiSelect-icon": {
                left: dir === "rtl" ? "auto" : 7,
                right: dir === "rtl" ? 7 : "auto",
              },
            }}
          >
            <InputLabel>{t.recordsPerPage}</InputLabel>
            <Select
              value={limit}
              onChange={handleLimitChange}
              label={t.recordsPerPage}
              sx={{
                textAlign: dir === "rtl" ? "left" : "right",
              }}
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

      {/* Active Filters Summary */}
      {(() => {
        const activeFilterEntries = [];

        // text-based filters
        Object.entries(filters).forEach(([key, val]) => {
          if (val && !key.endsWith("Ms")) activeFilterEntries.push([key, val]);
        });

        // date-based filters
        if (filters.createdAtFromMs || filters.createdAtToMs) {
          activeFilterEntries.push([
            "Registered At",
            `${
              filters.createdAtFromMs
                ? formatDateTimeWithLocale(filters.createdAtFromMs)
                : "—"
            } → ${
              filters.createdAtToMs
                ? formatDateTimeWithLocale(filters.createdAtToMs)
                : "—"
            }`,
          ]);
        }
        if (filters.scannedAtFromMs || filters.scannedAtToMs) {
          activeFilterEntries.push([
            "Scanned At",
            `${
              filters.scannedAtFromMs
                ? formatDateTimeWithLocale(filters.scannedAtFromMs)
                : "—"
            } → ${
              filters.scannedAtToMs
                ? formatDateTimeWithLocale(filters.scannedAtToMs)
                : "—"
            }`,
          ]);
        }

        if (activeFilterEntries.length === 0) return null;

        return (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
              mb: 3,
              px: { xs: 1, sm: 2 },
            }}
          >
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              {t.activeFilters}:
            </Typography>

            {activeFilterEntries.map(([key, val]) => {
              const translatedKey =
                key === "token"
                  ? t.token
                  : key === "Registered At"
                  ? t.registeredAt
                  : key === "Scanned At"
                  ? t.scannedAt
                  : key === "scannedBy"
                  ? t.scannedBy
                  : getFieldLabel(key);
              return (
                <Chip
                  key={key}
                  label={`${translatedKey}: ${val}`}
                  onDelete={() => {
                    setFilters((prev) => {
                      const updated = { ...prev };
                      if (key === "Registered At") {
                        updated.createdAtFromMs = null;
                        updated.createdAtToMs = null;
                      } else if (key === "Scanned At") {
                        updated.scannedAtFromMs = null;
                        updated.scannedAtToMs = null;
                      } else {
                        updated[key] = "";
                      }
                      return updated;
                    });
                  }}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={
                    dir === "rtl"
                      ? {
                          pr: 4.5,
                          pl: 2,
                          "& .MuiChip-label": {
                            whiteSpace: "nowrap",
                          },
                        }
                      : {}
                  }
                />
              );
            })}

            <Button
              size="small"
              color="secondary"
              startIcon={<ICONS.close />}
              onClick={() =>
                setFilters({
                  ...Object.fromEntries(dynamicFields.map((f) => [f.name, ""])),
                  createdAtFromMs: null,
                  createdAtToMs: null,
                  scannedAtFromMs: null,
                  scannedAtToMs: null,
                  scannedBy: "",
                  token: "",
                })
              }
              sx={getStartIconSpacing(dir)}
            >
              {t.clearAll}
            </Button>
          </Box>
        );
      })()}

      {!filteredRegistrations.length ? (
        <NoDataAvailable />
      ) : (
        <>
          <Grid container spacing={4} justifyContent="center">
            {paginatedRegistrations.map((reg) => (
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
                      background: "linear-gradient(to right, #f5f5f5, #fafafa)",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      p: 2,
                    }}
                  >
                    <Stack spacing={0.6}>
                      {/* Token (copyable) */}
                      <Stack
                        direction="row"
                        alignItems="center"
                        sx={{ gap: dir === "rtl" ? 1 : 1 }}
                      >
                        <ICONS.qrcode
                          sx={{ fontSize: 28, color: "primary.main" }}
                        />

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            bgcolor: "rgba(0,0,0,0.04)",
                            px: 1.2,
                            py: 0.5,
                            borderRadius: 1.5,
                            flexWrap: "wrap",
                            flex: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: "text.secondary" }}
                          >
                            {t.token}:
                          </Typography>

                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                              color: "primary.main",
                            }}
                          >
                            {reg.token}
                          </Typography>

                          <Tooltip title={t.copyToken}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(reg.token);
                              }}
                              sx={{
                                p: 0.5,
                                color: "primary.main",
                                "&:hover": {
                                  backgroundColor: "transparent",
                                  opacity: 0.8,
                                },
                              }}
                            >
                              <ICONS.copy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
                        <Box
                          component="span"
                          sx={{ direction: "ltr", unicodeBidi: "embed" }}
                        >
                          {formatDateTimeWithLocale(reg.createdAt)}
                        </Box>
                      </Typography>
                    </Stack>
                    {/* Email Sent Status */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.6}
                      sx={{ mt: 0.3 }}
                    >
                      {reg.emailSent ? (
                        <>
                          <ICONS.checkCircle
                            sx={{ fontSize: 20, color: "success.main" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: "success.main", fontWeight: 500 }}
                          >
                            {t.emailSent || "Email Sent"}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <ICONS.checkCircleOutline
                            sx={{ fontSize: 20, color: "warning.main" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: "warning.main", fontWeight: 500 }}
                          >
                            {t.emailNotSent || "Not Sent"}
                          </Typography>
                        </>
                      )}
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
                          {getFieldLabel(f.name)}
                        </Typography>

                        {/* Field Value */}
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            ml: 2,
                            textAlign: dir === "rtl" ? "left" : "right",
                            flex: 1,
                            color: "text.primary",
                            ...wrapTextBox,
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

                    <Tooltip title={t.editRegistration}>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setEditingReg(reg);
                          setEditModalOpen(true);
                        }}
                      >
                        <ICONS.edit fontSize="small" />
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
            {filteredRegistrations.length > limit && (
              <Pagination
                dir="ltr"
                count={Math.ceil(filteredRegistrations.length / limit)}
                page={page}
                onChange={(_, v) => setPage(v)}
              />
            )}
          </Box>
        </>
      )}

      <EditRegistrationModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        registration={editingReg}
        formFields={eventDetails.formFields || []}
        onSave={handleSaveEdit}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t.delete}
        message={t.deleteMessage}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
      />

      <ConfirmationDialog
        open={confirmEmailDialogOpen}
        onClose={() => setConfirmEmailDialogOpen(false)}
        onConfirm={handleSendBulkEmails}
        title={t.sendBulkEmails}
        message={t.confirmBulkEmails.replace(
          "{count}",
          unsentEmailCount.toString()
        )}
        confirmButtonText={t.sendBulkEmails}
        confirmButtonIcon={<ICONS.email />}
        confirmButtonColor="secondary"
      />

      <WalkInModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        registration={selectedRegistration}
      />

      <FilterDialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={t.filterRegistrations || "Filter Registrations"}
      >
        <Stack spacing={2}>
          {/* --- Dynamic Custom / Classic Fields (use dynamicFields) --- */}
          {dynamicFields.map((f) => (
            <Box key={f.name}>
              <Typography variant="subtitle2" gutterBottom>
                {getFieldLabel(f.name)}
              </Typography>

              {/* Dropdowns for radio/list/select-like fields */}
              {["radio", "list", "select", "dropdown"].includes(
                (f.type || "").toLowerCase()
              ) &&
              Array.isArray(f.values) &&
              f.values.length > 0 ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{`Select ${getFieldLabel(f.name)}`}</InputLabel>
                  <Select
                    label={`Select ${getFieldLabel(f.name)}`}
                    value={filters[f.name] ?? ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [f.name]: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {f.values.map((val) => (
                      <MenuItem key={val} value={val}>
                        {val}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  size="small"
                  placeholder={`${t.filterBy} ${getFieldLabel(f.name)}`}
                  value={filters[f.name] ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      [f.name]: e.target.value,
                    }))
                  }
                  fullWidth
                />
              )}
            </Box>
          ))}

          {/* --- Always show Token + Registered At range --- */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t.token}
            </Typography>
            <TextField
              size="small"
              placeholder={`${t.filterBy} ${t.token}`}
              value={filters.token || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, token: e.target.value }))
              }
              fullWidth
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t.registeredAt}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                width: "100%",
                gap: dir === "rtl" ? 1 : 0,
              }}
            >
              <DateTimePicker
                label={t.from}
                value={
                  filters.createdAtFromMs
                    ? dayjs(filters.createdAtFromMs)
                    : null
                }
                onChange={(val) =>
                  setFilters((f) => ({
                    ...f,
                    createdAtFromMs: val
                      ? dayjs(val).utc().startOf("day").valueOf()
                      : null,
                  }))
                }
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
              <DateTimePicker
                label={t.to}
                value={
                  filters.createdAtToMs ? dayjs(filters.createdAtToMs) : null
                }
                onChange={(val) =>
                  setFilters((f) => ({
                    ...f,
                    createdAtToMs: val
                      ? dayjs(val).utc().endOf("day").valueOf()
                      : null,
                  }))
                }
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Stack>
          </Box>

          {/* --- Walk-in Filters --- */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t.scannedBy}
            </Typography>
            <TextField
              size="small"
              placeholder={`${t.filterBy} ${t.scannedBy}`}
              value={filters.scannedBy || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, scannedBy: e.target.value }))
              }
              fullWidth
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t.scannedAt}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                gap: dir === "rtl" ? 1 : undefined,
              }}
            >
              {dir === "rtl" ? (
                <>
                  <DateTimePicker
                    label={t.to}
                    value={
                      filters.scannedAtToMs
                        ? dayjs(filters.scannedAtToMs)
                        : null
                    }
                    onChange={(val) =>
                      setFilters((f) => ({
                        ...f,
                        scannedAtToMs: val
                          ? dayjs(val).utc().endOf("day").valueOf()
                          : null,
                      }))
                    }
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                  <DateTimePicker
                    label={t.from}
                    value={
                      filters.scannedAtFromMs
                        ? dayjs(filters.scannedAtFromMs)
                        : null
                    }
                    onChange={(val) =>
                      setFilters((f) => ({
                        ...f,
                        scannedAtFromMs: val
                          ? dayjs(val).utc().startOf("day").valueOf()
                          : null,
                      }))
                    }
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                </>
              ) : (
                <>
                  <DateTimePicker
                    label={t.from}
                    value={
                      filters.scannedAtFromMs
                        ? dayjs(filters.scannedAtFromMs)
                        : null
                    }
                    onChange={(val) =>
                      setFilters((f) => ({
                        ...f,
                        scannedAtFromMs: val
                          ? dayjs(val).utc().startOf("day").valueOf()
                          : null,
                      }))
                    }
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                  <DateTimePicker
                    label={t.to}
                    value={
                      filters.scannedAtToMs
                        ? dayjs(filters.scannedAtToMs)
                        : null
                    }
                    onChange={(val) =>
                      setFilters((f) => ({
                        ...f,
                        scannedAtToMs: val
                          ? dayjs(val).utc().endOf("day").valueOf()
                          : null,
                      }))
                    }
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                </>
              )}
            </Stack>
          </Box>

          {/* --- Buttons --- */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            mt={2}
            sx={dir === "rtl" ? { gap: 2 } : {}}
          >
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ICONS.clear />}
              onClick={() =>
                setFilters({
                  ...Object.fromEntries(dynamicFields.map((f) => [f.name, ""])),
                  createdAtFromMs: null,
                  createdAtToMs: null,
                  scannedAtFromMs: null,
                  scannedAtToMs: null,
                  scannedBy: "",
                  token: "",
                })
              }
              sx={getStartIconSpacing(dir)}
            >
              {t.clear}
            </Button>
            <Button
              variant="contained"
              onClick={() => setFilterModalOpen(false)}
              startIcon={<ICONS.check />}
              sx={getStartIconSpacing(dir)}
            >
              {t.apply}
            </Button>
          </Stack>
        </Stack>
      </FilterDialog>
    </Container>
  );
}
