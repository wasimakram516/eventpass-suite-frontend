"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Alert,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import FilterDialog from "@/components/modals/FilterModal";
import {
  getRegistrationsByEvent,
  deleteRegistration,
  getAllPublicRegistrationsByEvent,
  downloadSampleExcel,
  uploadRegistrations,
  getUnsentCount,
  sendBulkEmails,
  sendBulkWhatsApp,
  updateRegistration,
  updateRegistrationApproval,
  getInitialRegistrations,
  exportRegistrations,
  createRegistration,
  createWalkIn,
} from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";

import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import { formatDate, formatDateTimeWithLocale } from "@/utils/dateUtils";
import { useParams } from "next/navigation";
import ICONS from "@/utils/iconUtil";
import WalkInModal from "@/components/modals/WalkInModal";
import BulkEmailModal from "@/components/modals/BulkEmailModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import NoDataAvailable from "@/components/NoDataAvailable";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import useEventRegSocket from "@/hooks/modules/eventReg/useEventRegSocket";
import { exportAllBadges } from "@/utils/exportBadges";
import RegistrationModal from "@/components/modals/RegistrationModal";
import { useMessage } from "@/contexts/MessageContext";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import BadgePDF from "@/components/badges/BadgePDF";

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
    exportFiltered: "Export filtered",
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
    sendBulkEmails: "Notifications",
    sendingEmails: "Sending notifications...",
    confirmBulkEmails:
      "Are you sure you want to send {count} bulk notifications for this event?",
    emailSent: "Email Sent",
    emailNotSent: "Email Not Sent",
    whatsappSent: "WhatsApp Sent",
    whatsappNotSent: "WhatsApp Not Sent",
    inviteSent: "Invitation sent",
    inviteNotSent: "Invitation not sent",
    exportBadges: "Export Badges",
    printBadge: "Print Badge",
    editRegistration: "Edit Registration",
    createRegistration: "New",
    copyToken: "Copy Token",
    approve: "Approve",
    reject: "Reject",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
    status: "Status",
    emailStatus: "Email Status",
    whatsappStatus: "WhatsApp Status",
    all: "All",
    sent: "Sent",
    notSent: "Not Sent",
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
    exportFiltered: "تصدير المصفى",
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
    sendBulkEmails: "الإشعارات",
    sendingEmails: "جاري إرسال الإشعارات...",
    confirmBulkEmails:
      "هل أنت متأكد أنك تريد إرسال {count} إشعارات جماعية لهذا الحدث؟",
    emailSent: "تم الإرسال",
    emailNotSent: "لم يتم الإرسال",
    whatsappSent: "تم إرسال واتساب",
    whatsappNotSent: "لم يتم إرسال واتساب",
    inviteSent: "تم إرسال الدعوة",
    inviteNotSent: "لم تُرسل الدعوة",
    exportbadges: "تصدير الشارات",
    printBadge: "طباعة الشارة",
    editRegistration: "تعديل التسجيل",
    createRegistration: "جديد",
    copyToken: "نسخ الرمز",
    approve: "موافقة",
    reject: "رفض",
    approved: "موافق عليه",
    rejected: "مرفوض",
    pending: "قيد الانتظار",
    status: "الحالة",
    emailStatus: "حالة البريد الإلكتروني",
    whatsappStatus: "حالة واتساب",
    all: "الكل",
    sent: "تم الإرسال",
    notSent: "لم يتم الإرسال",
  },
};

export default function ViewRegistrations() {
  const { eventSlug } = useParams();
  const { dir, t } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const BASE_DATE_FILTERS = {
    createdAtFromMs: null,
    createdAtToMs: null,
    scannedAtFromMs: null,
    scannedAtToMs: null,
    scannedBy: "",
    token: "",
    status: "",
    emailSent: "",
    whatsappSent: "",
  };

  function buildFilterState(fieldsLocal, prev = {}) {
    const dynamic = Object.fromEntries(
      (fieldsLocal || []).map((f) => [f.name, prev[f.name] ?? ""])
    );
    return { ...BASE_DATE_FILTERS, ...dynamic };
  }
  const dynamicFieldsRef = useRef([]);
  const lastLoadedRef = useRef(null);

  const [eventDetails, setEventDetails] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [fieldMetaMap, setFieldMetaMap] = useState({});
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (eventSlug) fetchData();
  }, [eventSlug]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(rawSearch.trim().toLowerCase());
      setPage(1);
    }, 20);
    return () => clearTimeout(id);
  }, [rawSearch]);

  // Helper to build search haystack (component level)
  const buildHaystack = (reg, fieldsLocal) => {
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
  };

  const fetchData = async () => {
    setLoading(true);
    setIsLoadingMore(false);

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
    dynamicFieldsRef.current = fieldsLocal;

    setFieldMetaMap(
      Object.fromEntries(
        fieldsLocal.map((f) => [f.name, { type: f.type, values: f.values }])
      )
    );

    setFilters((prev) => buildFilterState(fieldsLocal, prev));

    const regsRes = await getInitialRegistrations(eventSlug);
    if (!regsRes?.error) {
      const initialData = regsRes.data || [];
      const prepped = initialData.map((r) => {
        return {
          ...r,
          approvalStatus: r.approvalStatus || "pending",
          _createdAtMs: Date.parse(r.createdAt),
          _scannedAtMs: (r.walkIns || []).map((w) => Date.parse(w.scannedAt)),
          _haystack: buildHaystack(r, fieldsLocal),
        };
      });

      setAllRegistrations(prepped);

      // If more records exist, show loading indicator
      if (regsRes.total > regsRes.loaded) {
        setIsLoadingMore(true);
      }
    }

    setLoading(false);
  };

  // ---- Loading Progress Handler ----
  const handleLoadingProgress = useCallback((payload) => {
    if (!payload) return;

    const { loaded, total, data } = payload;

    // Prevent infinite loop if backend keeps sending same loaded value
    if (lastLoadedRef.current === loaded) return;
    lastLoadedRef.current = loaded;

    if (data?.length) {
      const processed = data.map((r) => {
        return {
          ...r,
          approvalStatus: r.approvalStatus || "pending",
          _createdAtMs: Date.parse(r.createdAt),
          _scannedAtMs: (r.walkIns || []).map((w) => Date.parse(w.scannedAt)),
          _haystack: buildHaystack(r, dynamicFieldsRef.current),
        };
      });

      setAllRegistrations((prev) => {
        const map = new Map(prev.map((r) => [r._id, r]));
        processed.forEach((r) => {
          const existing = map.get(r._id) || {};
          map.set(r._id, { ...existing, ...r });
        });
        return Array.from(map.values());
      });
    }

    if (loaded >= total) {
      setIsLoadingMore(false);
    }
  }, []);

  // ---- Upload Progress Handler ----
  const handleUploadProgress = useCallback((data) => {
    const { uploaded, total } = data;

    // When upload completes
    if (uploaded === total && total > 0) {
      setUploading(false);

      // Refresh ONLY after upload finishes
      fetchData();
    }
  }, []);

  // ---- Email Progress Handler ----
  const handleEmailProgress = useCallback(
    (data) => {
      const { processed, total, sent, failed } = data;

      // finished
      if (processed === total) {
        setSendingEmails(false);
        setBulkEmailModalOpen(false);

        // refresh UI
        fetchData();
        setUnsentEmailCount(0);

        if (total === 0) {
          showMessage(
            "No notifications to send. No registrations match the selected filter.",
            "info"
          );
        } else {
          showMessage(
            `Bulk notification completed — ${sent} sent, ${failed} failed, out of ${total} total.`,
            "success"
          );
        }
      }
    },
    [showMessage, fetchData]
  );

  const handleNewRegistration = useCallback(
    (data) => {
      if (!data?.registration) return;

      const reg = data.registration;

      const processed = {
        ...reg,
        approvalStatus: reg.approvalStatus || "pending",
        _createdAtMs: Date.parse(reg.createdAt),
        _scannedAtMs: (reg.walkIns || []).map((w) => Date.parse(w.scannedAt)),
        _haystack: buildHaystack(reg, dynamicFieldsRef.current),
      };

      setAllRegistrations((prev) => {
        const exists = prev.some((r) => r._id === processed._id);
        if (exists) return prev;

        return [processed, ...prev];
      });

      setTotalRegistrations((prev) => prev + 1);
    },
    []
  );

  // ---- Use hook with stable callbacks ----
  const { uploadProgress, emailProgress } = useEventRegSocket({
    eventId: eventDetails?._id,
    onLoadingProgress: handleLoadingProgress,
    onUploadProgress: handleUploadProgress,
    onEmailProgress: handleEmailProgress,
    onNewRegistration: handleNewRegistration,
  });

  const handleSaveEdit = async (updatedFields) => {
    const res = await updateRegistration(editingReg._id, updatedFields);
    if (res?.error) {
      showMessage(res.message || "Failed to update registration", "error");
      return;
    }
    setAllRegistrations((prev) =>
      prev.map((r) => {
        if (r._id === editingReg._id) {
          const hasCustomFields = eventDetails?.formFields?.length > 0;
          if (hasCustomFields) {
            return { ...r, customFields: { ...r.customFields, ...updatedFields } };
          } else {
            return {
              ...r,
              fullName: updatedFields["Full Name"] !== undefined ? updatedFields["Full Name"] : r.fullName,
              email: updatedFields["Email"] !== undefined ? updatedFields["Email"] : r.email,
              phone: updatedFields["Phone"] !== undefined ? updatedFields["Phone"] : r.phone,
              company: updatedFields["Company"] !== undefined ? updatedFields["Company"] : r.company,
            };
          }
        }
        return r;
      })
    );
    setEditModalOpen(false);
  };

  const handleCreateRegistration = async (fields) => {
    const hasCustomFields = eventDetails?.formFields?.length > 0;
    let payload = { slug: eventSlug };

    if (hasCustomFields) {
      payload = { ...fields, slug: eventSlug };
    } else {
      const fieldMap = {
        "Full Name": "fullName",
        Email: "email",
        Phone: "phone",
        Company: "company",
      };
      Object.keys(fields).forEach((key) => {
        const mappedKey = fieldMap[key] || key;
        payload[mappedKey] = fields[key];
      });
    }

    const res = await createRegistration(payload);

    if (res?.error) {
      return;
    }

    setCreateModalOpen(false);
    showMessage("Registration created successfully", "success");
    fetchData();
  };


  const filteredRegistrations = React.useMemo(() => {
    const {
      createdAtFromMs,
      createdAtToMs,
      scannedAtFromMs,
      scannedAtToMs,
      status,
      emailSent,
      whatsappSent,
      ...restFilters
    } = filters;

    return allRegistrations.filter((reg) => {
      if (searchTerm && !reg._haystack.includes(searchTerm)) return false;

      if (status && status !== "all") {
        if ((reg.approvalStatus || "pending") !== status) return false;
      }

      if (emailSent && emailSent !== "all") {
        const isSent = !!reg.emailSent;
        if (emailSent === "sent" && !isSent) return false;
        if (emailSent === "not_sent" && isSent) return false;
      }

      if (whatsappSent && whatsappSent !== "all") {
        const isSent = !!reg.whatsappSent;
        if (whatsappSent === "sent" && !isSent) return false;
        if (whatsappSent === "not_sent" && isSent) return false;
      }

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
      link.download = `${eventDetails.slug || "event"
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
      const result = await uploadRegistrations(eventSlug, file);
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

  const handleApprovalChange = async (registrationId, status) => {
    const res = await updateRegistrationApproval(registrationId, status);
    if (!res?.error) {
      const newStatus = res?.approvalStatus || status;
      setAllRegistrations((prev) =>
        prev.map((r) =>
          r._id === registrationId ? { ...r, approvalStatus: newStatus } : r
        )
      );
    }
  };

  const renderInvitationStatus = (reg) => (
    <Stack spacing={0.5} sx={{ width: "100%" }}>
      <Typography
        variant="caption"
        color={reg.emailSent ? "success.main" : "warning.main"}
        sx={{ display: "flex", alignItems: "center", gap: 0.6, fontWeight: 500 }}
      >
        <ICONS.email fontSize="small" sx={{ color: "primary.main" }} />
        {reg.emailSent && (
          <ICONS.checkCircle fontSize="small" sx={{ color: "success.main" }} />
        )}
        <Box component="span">
          {reg.emailSent ? t.inviteSent : t.inviteNotSent}
        </Box>
      </Typography>

      <Typography
        variant="caption"
        color={reg.whatsappSent ? "success.main" : "warning.main"}
        sx={{ display: "flex", alignItems: "center", gap: 0.6, fontWeight: 500 }}
      >
        <ICONS.whatsapp fontSize="small" sx={{ color: "#25D366" }} />
        {reg.whatsappSent && (
          <ICONS.checkCircle fontSize="small" sx={{ color: "success.main" }} />
        )}
        <Box component="span">
          {reg.whatsappSent ? t.inviteSent : t.inviteNotSent}
        </Box>
      </Typography>
    </Stack>
  );

  const renderConfirmation = (reg) => {
    const status = (reg.approvalStatus || "pending").toLowerCase();
    const isApproved = status === "approved";
    const isRejected = status === "rejected";

    let statusText = t.pending;
    let statusColor = "warning.main";
    let statusIcon = <ICONS.warning fontSize="small" />;

    if (isApproved) {
      statusText = t.approved;
      statusColor = "success.main";
      statusIcon = <ICONS.checkCircle fontSize="small" />;
    } else if (isRejected) {
      statusText = t.rejected;
      statusColor = "error.main";
      statusIcon = <ICONS.close fontSize="small" />;
    }

    return (
      <Typography
        variant="caption"
        color={statusColor}
        sx={{ display: "flex", alignItems: "center", gap: 0.6, fontWeight: 500 }}
      >
        {statusIcon}
        {statusText}
      </Typography>
    );
  };

  const handleExportRegs = async () => {
    if (!eventDetails) return;

    setExportLoading(true);

    try {
      // -------------------------------
      // Build query params for backend
      // -------------------------------
      const query = {};

      // Search
      if (searchTerm) query.search = searchTerm;

      // Token
      if (filters.token) query.token = filters.token;

      // Date filters (created)
      if (filters.createdAtFromMs) query.createdFrom = filters.createdAtFromMs;
      if (filters.createdAtToMs) query.createdTo = filters.createdAtToMs;

      // Date filters (scanned)
      if (filters.scannedAtFromMs) query.scannedFrom = filters.scannedAtFromMs;
      if (filters.scannedAtToMs) query.scannedTo = filters.scannedAtToMs;

      // Scanned By
      if (filters.scannedBy) query.scannedBy = filters.scannedBy;

      if (filters.status && filters.status !== "all") {
        query.status = filters.status;
      }
      if (filters.emailSent && filters.emailSent !== "all") {
        query.emailSent = filters.emailSent;
      }
      if (filters.whatsappSent && filters.whatsappSent !== "all") {
        query.whatsappSent = filters.whatsappSent;
      }

      // Dynamic fields using backend format: field_<name>
      dynamicFields.forEach((f) => {
        const v = filters[f.name];
        if (v) query[`field_${f.name}`] = v;
      });

      // Client timezone for date formatting
      query.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // -------------------------------
      // CALL YOUR SERVICE METHOD
      // -------------------------------
      const blob = await exportRegistrations(eventSlug, query);

      // -------------------------------
      // Download CSV
      // -------------------------------
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      const suffix = Object.keys(query).length > 0 ? "filtered" : "all";
      a.download = `${eventDetails.slug}_${suffix}_registrations.csv`;

      a.href = url;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }

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

  const handlePrintBadge = async (registration) => {
    if (!registration?.token) return;

    try {
      let qrCodeDataUrl = "";
      try {
        qrCodeDataUrl = await QRCode.toDataURL(registration.token, {
          width: 300,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
      } catch {
        // ignore minor QR errors (badge can still print)
      }

      const fullName =
        registration.customFields?.["Full Name"] ||
        registration.customFields?.["fullName"] ||
        registration.customFields?.["Name"] ||
        registration.customFields?.["name"] ||
        (
          (registration.customFields?.["First Name"] ||
            registration.customFields?.["firstName"] ||
            registration.customFields?.["FirstName"] ||
            "") +
          " " +
          (registration.customFields?.["Last Name"] ||
            registration.customFields?.["lastName"] ||
            registration.customFields?.["LastName"] ||
            "")
        ).trim() ||
        registration.fullName ||
        "Unnamed Visitor";

      const company =
        registration.customFields?.["Company"] ||
        registration.customFields?.["Institution"] ||
        registration.customFields?.["Organization"] ||
        registration.customFields?.["organization"] ||
        registration.customFields?.["institution"] ||
        registration.company ||
        "";

      // Commented out - Title/Designation not displayed on badge anymore (might be needed in future)
      // const customFields = registration.customFields || {};
      // const pickTitle = (fields) => {
      //   if (!fields || typeof fields !== "object") return null;
      //   const normalize = (str = "") => String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
      //   const target = "title";
      //   const candidates = new Set([
      //     target,
      //     normalize("designation"),
      //     normalize("job title"),
      //     normalize("position"),
      //     normalize("role"),
      //   ]);
      //   for (const [key, value] of Object.entries(fields)) {
      //     const nk = normalize(key);
      //     if (candidates.has(nk)) return value;
      //   }
      //   return null;
      // };
      // const title = pickTitle(customFields) || registration.title || "";

      const badgeData = {
        fullName,
        company,
        // Commented out - Title/Designation not displayed on badge anymore (might be needed in future)
        // title,
        badgeIdentifier: registration.badgeIdentifier || "",
        token: registration.token,
        showQrOnBadge: eventDetails?.showQrOnBadge ?? true,
      };

      const doc = <BadgePDF data={badgeData} qrCodeDataUrl={qrCodeDataUrl} />;
      const blob = await pdf(doc).toBlob();

      const blobUrl = URL.createObjectURL(blob);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        const printWindow = window.open(blobUrl, "_blank");
        if (!printWindow) {
          showMessage("Please allow pop-ups to print the badge.", "warning");
          return;
        }
        printWindow.onload = async () => {
          printWindow.focus();
          printWindow.print();
          await createWalkIn(registration._id);
          await refreshRegistrationWalkIns(registration._id);
        };
        return;
      }

      const width = Math.floor(window.outerWidth * 0.9);
      const height = Math.floor(window.outerHeight * 0.9);
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const printWindow = window.open(
        "",
        "_blank",
        `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no,status=no`
      );

      if (!printWindow) {
        showMessage("Please allow pop-ups to print the badge.", "warning");
        return;
      }

      printWindow.document.write(`
      <html>
        <head>
          <title>Print Badge</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              overflow: hidden;
              background: #fff;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe
            src="${blobUrl}"
            onload="this.contentWindow.focus(); this.contentWindow.print();"
          ></iframe>
        </body>
      </html>
    `);
      printWindow.document.close();

      await createWalkIn(registration._id);
      await refreshRegistrationWalkIns(registration._id);
    } catch (err) {
      showMessage("Badge could not be generated. Please try again.", "warning");
      console.error("Print badge error:", err);
    }
  };

  const refreshRegistrationWalkIns = async (registrationId) => {
    if (!registrationId) return;
    try {
      const regsRes = await getInitialRegistrations(eventSlug);
      if (!regsRes?.error) {
        const initialData = regsRes.data || [];
        const prepped = initialData.map((r) => {
          return {
            ...r,
            _createdAtMs: Date.parse(r.createdAt),
            _scannedAtMs: (r.walkIns || []).map((w) => Date.parse(w.scannedAt)),
            _haystack: buildHaystack(r, dynamicFieldsRef.current),
          };
        });
        setAllRegistrations(prepped);
        const updatedReg = prepped.find((r) => r._id === registrationId);
        if (updatedReg && selectedRegistration?._id === registrationId) {
          setSelectedRegistration(updatedReg);
        }
      }
    } catch (err) {
      console.error("Failed to refresh registration walk-ins:", err);
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
          variant="contained"
          color="primary"
          startIcon={<ICONS.add />}
          onClick={() => setCreateModalOpen(true)}
          sx={getStartIconSpacing(dir)}
        >
          {t.createRegistration}
        </Button>

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
            onClick={() => setBulkEmailModalOpen(true)}
            sx={getStartIconSpacing(dir)}
          >
            {sendingEmails && emailProgress.total
              ? `${t.sendingEmails} ${emailProgress.processed}/${emailProgress.total}`
              : sendingEmails
                ? t.sendingEmails
                : t.sendBulkEmails}
          </Button>
        )}

        {totalRegistrations > 0 && (
          <Button
            variant="outlined"
            color="success"
            onClick={handleExportRegs}
            disabled={exportLoading}
            startIcon={
              exportLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.description />
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
            variant="outlined"
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
            {exportingBadges ? t.exporting : t.exportBadges}
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
        {/* Left: Record info with loading progress */}
        <Box width="100%" maxWidth={{ xs: "100%", md: "50%" }}>
          {isLoadingMore && (
            <Typography
              variant="body2"
              color="info.main"
              fontWeight="500"
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
            >
              <CircularProgress size={14} thickness={5} sx={{ mr: 0.5 }} />
              Loading {allRegistrations.length} of {totalRegistrations} records
            </Typography>
          )}
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
            }}
          >
            <InputLabel>{t.recordsPerPage}</InputLabel>
            <Select
              value={limit}
              onChange={handleLimitChange}
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

      {/* Active Filters Summary */}
      {(() => {
        const activeFilterEntries = [];

        // text-based filters
        Object.entries(filters).forEach(([key, val]) => {
          if (val && !key.endsWith("Ms") && val !== "all") {
            activeFilterEntries.push([key, val]);
          }
        });

        // date-based filters
        if (filters.createdAtFromMs || filters.createdAtToMs) {
          activeFilterEntries.push([
            "Registered At",
            `${filters.createdAtFromMs
              ? formatDateTimeWithLocale(filters.createdAtFromMs)
              : "—"
            } → ${filters.createdAtToMs
              ? formatDateTimeWithLocale(filters.createdAtToMs)
              : "—"
            }`,
          ]);
        }
        if (filters.scannedAtFromMs || filters.scannedAtToMs) {
          activeFilterEntries.push([
            "Scanned At",
            `${filters.scannedAtFromMs
              ? formatDateTimeWithLocale(filters.scannedAtFromMs)
              : "—"
            } → ${filters.scannedAtToMs
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
                        : key === "status"
                          ? t.status
                          : key === "emailSent"
                            ? t.emailStatus
                            : key === "whatsappSent"
                              ? t.whatsappStatus
                              : getFieldLabel(key);

              let displayValue = val;
              if (key === "status") {
                if (val === "pending") displayValue = t.pending;
                else if (val === "approved") displayValue = t.approved;
                else if (val === "rejected") displayValue = t.rejected;
              } else if (key === "emailSent" || key === "whatsappSent") {
                if (val === "sent") displayValue = t.sent;
                else if (val === "not_sent") displayValue = t.notSent;
              }

              return (
                <Chip
                  key={key}
                  label={`${translatedKey}: ${displayValue}`}
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
                    {/* Invitation Status - Show for all events */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.6}
                      sx={{ mt: 0.3 }}
                    >
                      {renderInvitationStatus(reg)}
                    </Stack>

                    {/* Approval Status - Show for approval-based events */}
                    {eventDetails?.requiresApproval && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.6}
                      >
                        {renderConfirmation(reg)}
                      </Stack>
                    )}
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
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: eventDetails?.requiresApproval
                          ? "space-between"
                          : "center",
                        gap: 1.2,
                        width: "100%",
                      }}
                    >
                      {/* Approval Dropdown - Only show if event requires approval */}
                      {eventDetails?.requiresApproval && (
                        <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
                          <Select
                            value={reg.approvalStatus || "pending"}
                            onChange={(e) =>
                              handleApprovalChange(reg._id, e.target.value)
                            }
                            sx={{ fontSize: "0.875rem" }}
                          >
                            <MenuItem value="pending">{t.pending}</MenuItem>
                            <MenuItem value="approved">{t.approved}</MenuItem>
                            <MenuItem value="rejected">{t.rejected}</MenuItem>
                          </Select>
                        </FormControl>
                      )}

                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title={t.printBadge}>
                          <IconButton
                            color="secondary"
                            onClick={() => handlePrintBadge(reg)}
                            sx={{
                              "&:hover": { transform: "scale(1.1)" },
                              transition: "0.2s",
                            }}
                          >
                            <ICONS.print />
                          </IconButton>
                        </Tooltip>

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
                      </Box>
                    </Box>
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

      <RegistrationModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        registration={editingReg}
        formFields={eventDetails?.formFields || []}
        onSave={handleSaveEdit}
        mode="edit"
      />

      <RegistrationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        registration={null}
        formFields={eventDetails?.formFields || []}
        onSave={handleCreateRegistration}
        mode="create"
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

      <BulkEmailModal
        open={bulkEmailModalOpen}
        isApprovalBased={eventDetails?.requiresApproval}
        useApprovedRejected={true}
        onClose={() => {
          if (!sendingEmails) {
            setBulkEmailModalOpen(false);
          }
        }}
        onSendEmail={async (data) => {
          if (data.type === "default") {
            setSendingEmails(true);
            setBulkEmailModalOpen(false);
            const result = await sendBulkEmails(eventSlug, {
              statusFilter: data.statusFilter || "all",
              emailSentFilter: data.emailSentFilter || "all",
              whatsappSentFilter: data.whatsappSentFilter || "all",
            });
            if (result?.error) {
              setSendingEmails(false);
              showMessage(result.message || "Failed to send notifications", "error");
            }
          } else {
            if (!data.subject || !data.body) {
              showMessage("Subject and body are required for custom notifications", "error");
              return;
            }
            setSendingEmails(true);
            setBulkEmailModalOpen(false);
            const result = await sendBulkEmails(eventSlug, {
              subject: data.subject,
              body: data.body,
              statusFilter: data.statusFilter || "all",
              emailSentFilter: data.emailSentFilter || "all",
              whatsappSentFilter: data.whatsappSentFilter || "all",
            }, data.file);
            if (result?.error) {
              setSendingEmails(false);
              showMessage(result.message || "Failed to send notifications", "error");
            }
          }
        }}
        onSendWhatsApp={async (data) => {
          if (data.type === "custom") {
            if (!data.subject || !data.body) {
              showMessage("Subject and body are required for custom notifications", "error");
              return;
            }
          }
          setSendingEmails(true);
          setBulkEmailModalOpen(false);
          const result = await sendBulkWhatsApp(eventSlug, {
            type: data.type || "default",
            subject: data.subject,
            body: data.body,
            statusFilter: data.statusFilter || "all",
            emailSentFilter: data.emailSentFilter || "all",
            whatsappSentFilter: data.whatsappSentFilter || "all",
          }, data.file);
          if (result?.error) {
            setSendingEmails(false);
            showMessage(result.message || "Failed to send notifications", "error");
          }
        }}
        sendingEmails={sendingEmails}
      />

      <WalkInModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        registration={selectedRegistration}
        onCheckInSuccess={async () => {
          if (selectedRegistration?._id) {
            const regsRes = await getInitialRegistrations(eventSlug);
            if (!regsRes?.error) {
              const initialData = regsRes.data || [];
              const prepped = initialData.map((r) => {
                return {
                  ...r,
                  _createdAtMs: Date.parse(r.createdAt),
                  _scannedAtMs: (r.walkIns || []).map((w) => Date.parse(w.scannedAt)),
                  _haystack: buildHaystack(r, dynamicFieldsRef.current),
                };
              });
              setAllRegistrations(prepped);
              const updatedReg = prepped.find((r) => r._id === selectedRegistration._id);
              if (updatedReg) {
                setSelectedRegistration(updatedReg);
              }
            }
          }
        }}
      />

      <FilterDialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={t.filterRegistrations || "Filter Registrations"}
      >
        <Stack spacing={2}>
          {eventDetails?.requiresApproval && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t.status}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>{`${t.filterBy} ${t.status}`}</InputLabel>
                <Select
                  label={`${t.filterBy} ${t.status}`}
                  value={filters.status ?? "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="all">
                    <em>{t.all}</em>
                  </MenuItem>
                  <MenuItem value="pending">{t.pending}</MenuItem>
                  <MenuItem value="approved">{t.approved}</MenuItem>
                  <MenuItem value="rejected">{t.rejected}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t.emailStatus}
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>{`${t.filterBy} ${t.emailStatus}`}</InputLabel>
              <Select
                label={`${t.filterBy} ${t.emailStatus}`}
                value={filters.emailSent ?? "all"}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    emailSent: e.target.value,
                  }))
                }
              >
                <MenuItem value="all">
                  <em>{t.all}</em>
                </MenuItem>
                <MenuItem value="sent">{t.sent}</MenuItem>
                <MenuItem value="not_sent">{t.notSent}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t.whatsappStatus}
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>{`${t.filterBy} ${t.whatsappStatus}`}</InputLabel>
              <Select
                label={`${t.filterBy} ${t.whatsappStatus}`}
                value={filters.whatsappSent ?? "all"}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    whatsappSent: e.target.value,
                  }))
                }
              >
                <MenuItem value="all">
                  <em>{t.all}</em>
                </MenuItem>
                <MenuItem value="sent">{t.sent}</MenuItem>
                <MenuItem value="not_sent">{t.notSent}</MenuItem>
              </Select>
            </FormControl>
          </Box>

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
                      ? dayjs(val).utc().valueOf()
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
                      ? dayjs(val).utc().valueOf()
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
                          ? dayjs(val).utc().valueOf()
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
                          ? dayjs(val).utc().valueOf()
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
                          ? dayjs(val).utc().valueOf()
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
                          ? dayjs(val).utc().valueOf()
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
                  status: "",
                  emailSent: "",
                  whatsappSent: "",
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
