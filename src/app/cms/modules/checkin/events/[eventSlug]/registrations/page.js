"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Pagination,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  Container,
  Stack,
  TextField,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import FilterDialog from "@/components/modals/FilterModal";
import {
  getCheckInRegistrationsByEvent,
  deleteCheckInRegistration,
  getAllCheckInRegistrationsByEvent,
  downloadCheckInSampleExcel,
  downloadCheckInCountryReference,
  uploadCheckInRegistrations,
  exportCheckInRegistrations,
  getCheckInInitialRegistrations,
  updateCheckInRegistration,
  updateCheckInRegistrationApproval,
  createCheckInRegistration,
} from "@/services/checkin/checkinRegistrationService";
import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";

import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import { useParams } from "next/navigation";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import NoDataAvailable from "@/components/NoDataAvailable";
import useCheckInSocket from "@/hooks/modules/checkin/useCheckInSocket";
import RegistrationModal from "@/components/modals/RegistrationModal";
import WalkInModal from "@/components/modals/WalkInModal";
import BulkEmailModal from "@/components/modals/BulkEmailModal";
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import { useMessage } from "@/contexts/MessageContext";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import {
  createCheckInWalkIn,
  sendCheckInBulkEmails,
  sendCheckInBulkWhatsApp,
} from "@/services/checkin/checkinRegistrationService";

const translations = {
  en: {
    title: "Manage Registrations",
    description:
      "View event details and manage registrations for this event. Export registration data or delete entries as needed.",
    exportAll: "Export All",
    exportFiltered: "Export filtered",
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
    deleteRecord: "Delete Registration",
    filters: "Filters",
    searchPlaceholder: "Search...",
    sendBulkEmails: "Notifications",
    sendingEmails: "Sending notifications...",
    inviteSent: "Invitation sent",
    inviteNotSent: "Invitation not sent",
    emailInvitationSent: "Email Invitation sent",
    emailInvitationNotSent: "Email Invitation not sent",
    whatsappInvitationSent: "WhatsApp Invitation sent",
    whatsappInvitationNotSent: "WhatsApp Invitation not sent",
    emailSent: "Email Sent",
    emailNotSent: "Email Not Sent",
    copyToken: "Copy Token",
    editRegistration: "Edit Registration",
    createRegistration: "New",
    confirmed: "Confirmed",
    pending: "Pending",
    notConfirmed: "Not attending",
    shareLink: "Share Link",
    recordsPerPage: "Records per page",
    showing: "Showing",
    of: "of",
    uploadStarted: "Upload started",
    matchingRecords: "{count} matching record",
    matchingRecordsPlural: "{count} matching records",
    found: "found",
    activeFilters: "Active Filters",
    clearAll: "Clear All",
    registeredAt: "Registered At",
    apply: "Apply",
    viewWalkIns: "View Walk-in Records",
    scannedBy: "Scanned By (Name or Email)",
    scannedAt: "Scanned At",
    filterBy: "Filter by",
    from: "From",
    to: "To",
    status: "Status",
    emailStatus: "Email Status",
    whatsappStatus: "WhatsApp Status",

    all: "All",
    pending: "Pending",
    confirmed: "Confirmed",
    notConfirmed: "Not Attending",

    sent: "Sent",
    notSent: "Not Sent",
  },
  ar: {
    title: "إدارة التسجيلات",
    description:
      "اعرض تفاصيل الحدث وقم بإدارة التسجيلات. يمكنك تصدير البيانات أو حذف السجلات.",
    exportAll: "تصدير الكل",
    exportFiltered: "تصدير المصفى",
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
    deleteRecord: "حذف التسجيل",
    filters: "تصفية",
    searchPlaceholder: "بحث...",
    sendBulkEmails: "الإشعارات",
    sendingEmails: "جاري إرسال الإشعارات...",
    inviteSent: "تم إرسال الدعوة",
    inviteNotSent: "لم تُرسل الدعوة",
    emailInvitationSent: "تم إرسال دعوة البريد الإلكتروني",
    emailInvitationNotSent: "لم يتم إرسال دعوة البريد الإلكتروني",
    whatsappInvitationSent: "تم إرسال دعوة واتساب",
    whatsappInvitationNotSent: "لم يتم إرسال دعوة واتساب",
    emailSent: "تم إرسال البريد",
    emailNotSent: "لم يتم الإرسال",
    copyToken: "نسخ الرمز",
    editRegistration: "تعديل التسجيل",
    createRegistration: "جديد",
    confirmed: "مؤكد",
    pending: "قيد الانتظار",
    notConfirmed: "غير مؤكد",
    shareLink: "مشاركة الرابط",
    recordsPerPage: "عدد السجلات لكل صفحة",
    showing: "عرض",
    of: "من",
    uploadStarted: "تم بدء الرفع",
    matchingRecords: "{count} سجل مطابق",
    matchingRecordsPlural: "{count} سجلات مطابقة",
    found: "تم العثور عليها",
    activeFilters: "الفلاتر النشطة",
    clearAll: "مسح الكل",
    registeredAt: "تاريخ التسجيل",
    apply: "تطبيق",
    viewWalkIns: "عرض سجلات الحضور",
    scannedBy: "تم المسح بواسطة (الاسم أو البريد الإلكتروني)",
    scannedAt: "تاريخ المسح",
    filterBy: "تصفية حسب",
    from: "من",
    to: "إلى",
    status: "الحالة",
    emailStatus: "حالة البريد الإلكتروني",
    whatsappStatus: "حالة واتساب",
    all: "الكل",
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    notConfirmed: "غير مؤكد",
    sent: "تم الإرسال",
    notSent: "لم يتم الإرسال",
  },
};

const BASE_FILTERS = {
  createdAtFromMs: null,
  createdAtToMs: null,
  scannedAtFromMs: null,
  scannedAtToMs: null,
  scannedBy: "",
  token: "",
};

const buildFilterState = (fieldsLocal, prev = {}) => {
  const dynamic = Object.fromEntries(
    (fieldsLocal || []).map((f) => [f.name, prev[f.name] ?? ""])
  );
  return { ...BASE_FILTERS, ...dynamic };
};

const buildHaystack = (reg, fieldsLocal) => {
  const dyn = fieldsLocal.map((f) => reg.customFields?.[f.name] ?? reg[f.name]);
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

export default function ViewRegistrations() {
  const { eventSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const dynamicFieldsRef = useRef([]);
  const lastLoadedRef = useRef(null);

  const [eventDetails, setEventDetails] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [fieldMetaMap, setFieldMetaMap] = useState({});
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [rawSearch, setRawSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState(BASE_FILTERS);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [registrationToShare, setRegistrationToShare] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setIsLoadingMore(false);

    const evRes = await getCheckInEventBySlug(eventSlug);

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
      setTotalRegistrations(Number(evRes.registrations) || 0);
    }
    setDynamicFields(fieldsLocal);
    dynamicFieldsRef.current = fieldsLocal;
    setFieldMetaMap(
      Object.fromEntries(
        fieldsLocal.map((f) => [f.name, { type: f.type, values: f.values }])
      )
    );
    setFilters((prev) => buildFilterState(fieldsLocal, prev));

    const regsRes = await getCheckInInitialRegistrations(eventSlug);
    if (!regsRes?.error) {
      const initialData = regsRes.data || [];
      const prepped = initialData.map((r) => ({
        ...r,
        approvalStatus: r.approvalStatus || "pending",
        _createdAtMs: Date.parse(r.createdAt),
        _scannedAtMs: (r.walkIns || []).map((w) => Date.parse(w.scannedAt)),
        _haystack: buildHaystack(r, fieldsLocal),
      }));

      setAllRegistrations(prepped);
      if (regsRes.total > regsRes.loaded) {
        setIsLoadingMore(true);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (eventSlug) fetchData();
  }, [eventSlug]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(rawSearch.trim().toLowerCase());
      setPage(1);
    }, 30);
    return () => clearTimeout(id);
  }, [rawSearch]);

  const handleLoadingProgress = useCallback((payload) => {
    if (!payload) return;
    const { loaded, total, data } = payload;
    if (lastLoadedRef.current === loaded) return;
    lastLoadedRef.current = loaded;

    if (data?.length) {
      const processed = data.map((r) => ({
        ...r,
        approvalStatus: r.approvalStatus || "pending",
        _createdAtMs: Date.parse(r.createdAt),
        _scannedAtMs: (r.walkIns || []).map((w) => Date.parse(w.scannedAt)),
        _haystack: buildHaystack(r, dynamicFieldsRef.current),
      }));

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

  const handleUploadProgress = useCallback((data) => {
    const { uploaded, total } = data;
    if (uploaded === total && total > 0) {
      setUploading(false);
      fetchData();
    }
  }, []);

  const handleUploadComplete = useCallback(
    (data) => {
      if (data.duplicateMessage) {
        showMessage(data.duplicateMessage, "error");
      }
    },
    [showMessage]
  );

  const handleNewRegistration = useCallback((data) => {
    const reg = data?.registration;
    if (!reg) return;
    setAllRegistrations((prev) => {
      const exists = prev.find((r) => r._id === reg._id);
      if (exists) return prev;
      return [
        {
          ...reg,
          approvalStatus: reg.approvalStatus || "pending",
          _createdAtMs: Date.parse(reg.createdAt),
          _scannedAtMs: (reg.walkIns || []).map((w) => Date.parse(w.scannedAt)),
          _haystack: buildHaystack(reg, dynamicFieldsRef.current),
        },
        ...prev,
      ];
    });
    setTotalRegistrations((prev) => prev + 1);
  }, []);

  const handlePresenceConfirmed = useCallback((data) => {
    const reg = data?.registration;
    if (!reg) return;
    setAllRegistrations((prev) =>
      prev.map((r) => {
        if (r._id === reg._id) {
          return {
            ...r,
            approvalStatus: reg.approvalStatus || "pending",
          };
        }
        return r;
      })
    );
  }, []);

  const handleEmailProgress = useCallback(
    (data) => {
      const { processed, total, sent, failed } = data;

      // (handle case when total is 0)
      if (processed === total) {
        setSendingEmails(false);
        fetchData();

        if (total === 0) {
          showMessage(
            "No notifications to send. No registrations match the selected filter.",
            "info"
          );
        } else {
          showMessage(
            `Bulk notifications completed — ${sent} sent, ${failed} failed, out of ${total} total.`,
            "success"
          );
        }
      }
    },
    [showMessage]
  );

  const { emailProgress } = useCheckInSocket({
    eventId: eventDetails?._id,
    onLoadingProgress: handleLoadingProgress,
    onUploadProgress: handleUploadProgress,
    onEmailProgress: handleEmailProgress,
    onNewRegistration: handleNewRegistration,
    onPresenceConfirmed: handlePresenceConfirmed,
    onUploadComplete: handleUploadComplete,
  });

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
      if (searchTerm && !reg._haystack?.includes(searchTerm)) return false;

      /* ---------- STATUS FILTER ---------- */
      if (status && status !== "all") {
        if ((reg.approvalStatus || "pending") !== status) return false;
      }

      /* ---------- EMAIL SENT FILTER ---------- */
      if (emailSent && emailSent !== "all") {
        const isSent = !!reg.emailSent;
        if (emailSent === "sent" && !isSent) return false;
        if (emailSent === "not_sent" && isSent) return false;
      }

      /* ---------- WHATSAPP SENT FILTER ---------- */
      if (whatsappSent && whatsappSent !== "all") {
        const isSent = !!reg.whatsappSent;
        if (whatsappSent === "sent" && !isSent) return false;
        if (whatsappSent === "not_sent" && isSent) return false;
      }

      /* ---------- DATE: createdAt ---------- */
      if (createdAtFromMs != null && reg._createdAtMs < createdAtFromMs)
        return false;
      if (createdAtToMs != null && reg._createdAtMs > createdAtToMs)
        return false;

      /* ---------- DATE: scannedAt ---------- */
      if (scannedAtFromMs != null || scannedAtToMs != null) {
        const ok = (reg._scannedAtMs || []).some((d) => {
          if (scannedAtFromMs != null && d < scannedAtFromMs) return false;
          if (scannedAtToMs != null && d > scannedAtToMs) return false;
          return true;
        });
        if (!ok) return false;
      }

      /* ---------- GENERIC DYNAMIC FILTERS ---------- */
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

        if (key === "token") {
          const tokenMatch =
            !rawValue ||
            (reg.token || "")
              .toLowerCase()
              .includes(String(rawValue).toLowerCase());
          if (!tokenMatch) return false;
          continue;
        }

        const meta = fieldMetaMap[key];
        const regValue = reg.customFields?.[key] ?? reg[key] ?? "";

        const v = String(regValue ?? "").toLowerCase();
        const f = String(rawValue).toLowerCase();

        const isExact =
          meta && ["radio", "list", "select", "dropdown"].includes(meta.type);

        if (isExact ? v !== f : !v.includes(f)) return false;
      }

      return true;
    });
  }, [allRegistrations, filters, searchTerm, fieldMetaMap]);

  const paginated = filteredRegistrations.slice(
    (page - 1) * limit,
    page * limit
  );

  const handleDelete = async () => {
    const result = await deleteCheckInRegistration(registrationToDelete);
    if (!result?.error) {
      setAllRegistrations((prev) =>
        prev.filter((reg) => reg._id !== registrationToDelete)
      );
      setTotalRegistrations((prev) => prev - 1);
      setRegistrationToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSaveEdit = async (values) => {
    if (!editingReg) return;
    try {
      const res = await updateCheckInRegistration(editingReg._id, values);
      if (res?.error) {
        showMessage(res.message || "Failed to update registration", "error");
        return;
      }
      setAllRegistrations((prev) =>
        prev.map((r) =>
          r._id === editingReg._id
            ? {
              ...r,
              customFields: { ...(r.customFields || {}), ...values },
              fullName: values["Full Name"] || r.fullName,
              email: values.Email || r.email,
              phone: values.Phone || r.phone,
              company: values.Company || r.company,
            }
            : r
        )
      );
      setEditModalOpen(false);
      setEditingReg(null);
      fetchData();
    } catch (err) {
      showMessage(err?.message || "Failed to update registration", "error");
    }
  };

  const handleCreate = async (values) => {
    const hasCustomFields = eventDetails?.formFields?.length > 0;
    let payload = { slug: eventSlug };

    if (hasCustomFields) {
      payload = { ...values, slug: eventSlug };
    } else {
      const fieldMap = {
        "Full Name": "fullName",
        Email: "email",
        Phone: "phone",
        Company: "company",
      };
      Object.keys(values).forEach((key) => {
        const mappedKey = fieldMap[key] || key;
        payload[mappedKey] = values[key];
      });
    }

    try {
      const res = await createCheckInRegistration(payload);
      if (!res?.error) {
        setCreateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showMessage(err?.message || "Failed to create registration", "error");
    }
  };

  const getFieldLabel = (fieldName) => {
    const labelMap = {
      fullName: t.fullName || "Full Name",
      email: t.emailLabel || "Email",
      phone: t.phoneLabel || "Phone",
      company: t.companyLabel || "Company",
    };
    return labelMap[fieldName] || fieldName;
  };

  const handleApprovalChange = async (registrationId, status) => {
    const res = await updateCheckInRegistrationApproval(registrationId, status);
    if (!res?.error) {
      const newStatus = res?.approvalStatus || status;
      setAllRegistrations((prev) =>
        prev.map((r) =>
          r._id === registrationId ? { ...r, approvalStatus: newStatus } : r
        )
      );
    }
  };

  const handleDownloadSample = async () => {
    try {
      // Download sample Excel file
      const sampleData = await downloadCheckInSampleExcel(eventSlug);
      const sampleBlob = new Blob([sampleData], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
      const sampleLink = document.createElement("a");
      sampleLink.href = window.URL.createObjectURL(sampleBlob);
      sampleLink.download = `${eventSlug}_registrations_template.xlsx`;
      document.body.appendChild(sampleLink);
      sampleLink.click();
      document.body.removeChild(sampleLink);
      URL.revokeObjectURL(sampleLink.href);

      // Download country reference file
      const countryData = await downloadCheckInCountryReference();
      const countryBlob = new Blob([countryData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const countryLink = document.createElement("a");
      countryLink.href = window.URL.createObjectURL(countryBlob);
      countryLink.download = "country_reference.xlsx";
      document.body.appendChild(countryLink);
      // Small delay to ensure first download starts
      setTimeout(() => {
        countryLink.click();
        document.body.removeChild(countryLink);
        URL.revokeObjectURL(countryLink.href);
      }, 100);
    } catch (err) {
      console.error("Failed to download sample:", err);
    }
  };

  const handleUpload = async (fileInput) => {
    const file =
      fileInput instanceof File ? fileInput : fileInput?.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadCheckInRegistrations(eventSlug, file);
      if (result?.error) {
        showMessage(result.message || "Upload failed", "error");
      } else {
        showMessage(t.uploadStarted, "success");
      }
    } catch (err) {
      showMessage(err?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileInput?.target) fileInput.target.value = "";
    }
  };

  const handleExportRegs = async () => {
    if (!eventDetails) return;
    setExportLoading(true);

    try {
      const query = {};

      if (searchTerm) query.search = searchTerm;
      if (filters.token) query.token = filters.token;

      if (filters.createdAtFromMs) query.createdFrom = filters.createdAtFromMs;
      if (filters.createdAtToMs) query.createdTo = filters.createdAtToMs;

      if (filters.scannedAtFromMs) query.scannedFrom = filters.scannedAtFromMs;
      if (filters.scannedAtToMs) query.scannedTo = filters.scannedAtToMs;

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

      dynamicFields.forEach((f) => {
        const v = filters[f.name];
        if (v) query[`field_${f.name}`] = v;
      });

      // Client timezone for date formatting
      query.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await exportCheckInRegistrations(eventSlug, query);

      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);

      const suffix = Object.keys(query).length > 0 ? "filtered" : "all";
      link.download = `${eventSlug}_${suffix}_registrations.csv`;
      link.click();
    } finally {
      setExportLoading(false);
    }
  };

  const renderInvitationStatus = (reg) => (
    <Stack spacing={0.5} sx={{ width: "100%" }}>
      <Typography
        variant="caption"
        color={reg.emailSent ? "success.main" : "warning.main"}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          fontWeight: 500,
        }}
      >
        <ICONS.email fontSize="small" sx={{ color: "primary.main" }} />
        {reg.emailSent && (
          <ICONS.checkCircle fontSize="small" sx={{ color: "success.main" }} />
        )}
        <Box component="span">
          {reg.emailSent ? t.inviteSent : t.inviteNotSent}
        </Box>
      </Typography>

      {/* WhatsApp Invitation Status */}
      <Typography
        variant="caption"
        color={reg.whatsappSent ? "success.main" : "warning.main"}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          fontWeight: 500,
        }}
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
    const isConfirmed = status === "confirmed";
    const isNotConfirmed = status === "not_attending";

    let statusText = t.pending;
    let statusColor = "warning.main";
    let statusIcon = <ICONS.warning fontSize="small" />;

    if (isConfirmed) {
      statusText = t.confirmed;
      statusColor = "success.main";
      statusIcon = <ICONS.checkCircle fontSize="small" />;
    } else if (isNotConfirmed) {
      statusText = t.notConfirmed;
      statusColor = "error.main";
      statusIcon = <ICONS.close fontSize="small" />;
    }

    return (
      <Typography
        variant="caption"
        color={statusColor}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          fontWeight: 500,
        }}
      >
        {statusIcon}
        {statusText}
      </Typography>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
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
          <Typography variant="h5" fontWeight="bold">
            {t.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.description}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        <Button
          variant="contained"
          onClick={() => setCreateModalOpen(true)}
          startIcon={<ICONS.add />}
          sx={getStartIconSpacing(dir)}
        >
          {t.createRegistration}
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
          disabled={uploading}
          startIcon={
            uploading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ICONS.upload />
            )
          }
          sx={getStartIconSpacing(dir)}
        >
          {uploading ? t.uploading : t.uploadFile}
          <input
            hidden
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleUpload(e)}
          />
        </Button>

        {totalRegistrations > 0 && (
          <Button
            variant="contained"
            color="secondary"
            disabled={sendingEmails}
            onClick={() => setBulkEmailModalOpen(true)}
            startIcon={
              sendingEmails ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.email />
              )
            }
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
            disabled={exportLoading}
            startIcon={
              exportLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ICONS.description />
              )
            }
            onClick={handleExportRegs}
            sx={getStartIconSpacing(dir)}
          >
            {exportLoading
              ? t.exporting
              : searchTerm || Object.keys(filters).some((k) => filters[k])
                ? t.exportFiltered
                : t.exportAll}
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

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
          sx={dir === "rtl" ? { columnGap: 1.5, rowGap: 1.5 } : {}}
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
              sx: dir === "rtl" ? { paddingRight: 2 } : {},
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

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: "100%", sm: 150 },
            }}
          >
            <InputLabel>{t.recordsPerPage}</InputLabel>
            <Select
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value);
                setPage(1);
              }}
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

        Object.entries(filters).forEach(([key, val]) => {
          if (val && !key.endsWith("Ms") && val !== "all") {
            activeFilterEntries.push([key, val]);
          }
        });

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

        if (!activeFilterEntries.length) return null;

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
                      ? t.scannedAt || "Scanned At"
                      : key === "scannedBy"
                        ? t.scannedBy || "Scanned By"
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
                else if (val === "confirmed") displayValue = t.confirmed;
                else if (val === "not_attending") displayValue = t.notConfirmed;
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
                    setPage(1);
                  }}
                  color="primary"
                  variant="outlined"
                  size="small"
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

      {filteredRegistrations.length === 0 ? (
        <NoDataAvailable />
      ) : (
        <>
          <Grid container spacing={4} justifyContent="center">
            {paginated.map((reg) => (
              <Grid item xs={12} sm={6} md={4} key={reg._id}>
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
                  <Box
                    sx={{
                      background: "linear-gradient(to right, #f5f5f5, #fafafa)",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      p: 2,
                    }}
                  >
                    <Stack spacing={0.6}>
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
                              onClick={() =>
                                navigator.clipboard.writeText(reg.token)
                              }
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

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.6}
                        sx={{ mt: 0.3 }}
                      >
                        {renderInvitationStatus(reg)}
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={0.6}>
                        {renderConfirmation(reg)}
                      </Stack>
                    </Stack>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, px: 2, py: 1.5 }}>
                    {dynamicFields.map((f) => {
                      const fieldValue =
                        reg.customFields?.[f.name] ?? reg[f.name] ?? null;
                      let displayValue = "—";

                      if (fieldValue) {
                        const valueStr = String(fieldValue).trim();
                        if (valueStr) {
                          displayValue = valueStr;
                        }
                      }

                      return (
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
                            {(() => {
                              // If this is a phone field, format it with isoCode
                              if (f.type === "phone" || (!eventDetails?.formFields?.length && f.name === "phone")) {
                                const { formatPhoneNumberForDisplay } = require("@/utils/countryCodes");
                                return formatPhoneNumberForDisplay(displayValue, reg.isoCode);
                              }
                              return displayValue;
                            })()}
                          </Typography>
                        </Box>
                      );
                    })}
                  </CardContent>

                  <CardActions
                    sx={{
                      justifyContent: "space-between",
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
                        justifyContent: "space-between",
                        gap: 1.2,
                        width: "100%",
                      }}
                    >
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={reg.approvalStatus || "pending"}
                          onChange={(e) =>
                            handleApprovalChange(reg._id, e.target.value)
                          }
                          sx={{ fontSize: "0.9rem" }}
                        >
                          <MenuItem value="pending">{t.pending}</MenuItem>
                          <MenuItem value="confirmed">{t.confirmed}</MenuItem>
                          <MenuItem value="not_attending">
                            {t.notConfirmed}
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <Box sx={{ display: "flex", gap: 0.5 }}>
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
                            color="warning"
                            onClick={() => {
                              setEditingReg(reg);
                              setEditModalOpen(true);
                            }}
                            sx={{
                              "&:hover": { transform: "scale(1.1)" },
                              transition: "0.2s",
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

                        <Tooltip title={t.shareLink}>
                          <IconButton
                            color="info"
                            onClick={() => {
                              setRegistrationToShare(reg);
                              setShareModalOpen(true);
                            }}
                            sx={{
                              "&:hover": { transform: "scale(1.1)" },
                              transition: "0.2s",
                            }}
                          >
                            <ICONS.share fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="center" mt={3}>
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

      <FilterDialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={t.filters}
      >
        <Stack spacing={2}>
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
                <MenuItem value="confirmed">{t.confirmed}</MenuItem>
                <MenuItem value="not_attending">{t.notConfirmed}</MenuItem>
              </Select>
            </FormControl>
          </Box>
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

          {dynamicFields.map((f) => (
            <Box key={f.name}>
              <Typography variant="subtitle2" gutterBottom>
                {getFieldLabel(f.name)}
              </Typography>

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
                  placeholder={`${t.filters} ${getFieldLabel(f.name)}`}
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
              {dir === "rtl" ? (
                <>
                  <DateTimePicker
                    label={t.to}
                    value={
                      filters.createdAtToMs
                        ? dayjs(filters.createdAtToMs)
                        : null
                    }
                    onChange={(val) =>
                      setFilters((f) => ({
                        ...f,
                        createdAtToMs: val ? dayjs(val).utc().valueOf() : null,
                      }))
                    }
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
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
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                    }}
                  />
                  <DateTimePicker
                    label={t.to}
                    value={
                      filters.createdAtToMs
                        ? dayjs(filters.createdAtToMs)
                        : null
                    }
                    onChange={(val) =>
                      setFilters((f) => ({
                        ...f,
                        createdAtToMs: val ? dayjs(val).utc().valueOf() : null,
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
                        scannedAtToMs: val ? dayjs(val).utc().valueOf() : null,
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
                        scannedAtToMs: val ? dayjs(val).utc().valueOf() : null,
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

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setFilters(buildFilterState(dynamicFields, {}));
                setPage(1);
              }}
            >
              {t.clearAll}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setPage(1);
                setFilterModalOpen(false);
              }}
            >
              {t.apply}
            </Button>
          </Box>
        </Stack>
      </FilterDialog>

      <RegistrationModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        registration={editingReg}
        formFields={eventDetails?.formFields || []}
        onSave={handleSaveEdit}
        mode="edit"
        title={t.editRegistration}
        event={eventDetails}
      />

      <RegistrationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        registration={null}
        formFields={eventDetails?.formFields || []}
        onSave={handleCreate}
        mode="create"
        title={t.createRegistration}
        event={eventDetails}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        title={t.delete}
        message={t.deleteMessage}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
      />

      <WalkInModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        registration={selectedRegistration}
        createWalkInFn={createCheckInWalkIn}
        onCheckInSuccess={async () => {
          if (selectedRegistration?._id) {
            const regsRes = await getCheckInInitialRegistrations(eventSlug);
            if (!regsRes?.error) {
              const initialData = regsRes.data || [];
              const prepped = initialData.map((r) => ({
                ...r,
                approvalStatus: r.approvalStatus || "pending",
                _haystack: buildHaystack(r, dynamicFieldsRef.current),
              }));
              setAllRegistrations(prepped);
              const updatedReg = prepped.find(
                (r) => r._id === selectedRegistration._id
              );
              if (updatedReg) {
                setSelectedRegistration(updatedReg);
              }
            }
          }
        }}
      />

      <BulkEmailModal
        open={bulkEmailModalOpen}
        showReminderOption={true}
        onClose={() => {
          if (!sendingEmails) {
            setBulkEmailModalOpen(false);
          }
        }}
        onSendEmail={async (data) => {
          if (data.type === "default") {
            setSendingEmails(true);
            setBulkEmailModalOpen(false);
            const result = await sendCheckInBulkEmails(eventSlug, {
              statusFilter: data.statusFilter || "all",
              emailSentFilter: data.emailSentFilter || "all",
              whatsappSentFilter: data.whatsappSentFilter || "all",
            });
            if (result?.error) {
              setSendingEmails(false);
              setBulkEmailModalOpen(false);
              showMessage(
                result.message || "Failed to send notifications",
                "error"
              );
            }
            // Progress will be handled by socket callback
          } else {
            // Custom email
            if (!data.subject || !data.body) {
              showMessage(
                "Subject and body are required for custom notifications",
                "error"
              );
              return;
            }
            setSendingEmails(true);
            setBulkEmailModalOpen(false);
            const result = await sendCheckInBulkEmails(
              eventSlug,
              {
                subject: data.subject,
                body: data.body,
                statusFilter: data.statusFilter || "all",
                emailSentFilter: data.emailSentFilter || "all",
                whatsappSentFilter: data.whatsappSentFilter || "all",
              },
              data.file
            );
            if (result?.error) {
              setSendingEmails(false);
              setBulkEmailModalOpen(false);
              showMessage(
                result.message || "Failed to send notifications",
                "error"
              );
            }
            // Progress will be handled by socket callback
          }
        }}
        onSendWhatsApp={async (data) => {
          if (data.type === "custom") {
            if (!data.subject || !data.body) {
              showMessage(
                "Subject and body are required for custom notifications",
                "error"
              );
              return;
            }
          }
          setSendingEmails(true);
          setBulkEmailModalOpen(false);
          const result = await sendCheckInBulkWhatsApp(
            eventSlug,
            {
              type: data.type,
              subject: data.subject,
              body: data.body,
              statusFilter: data?.statusFilter || "all",
              emailSentFilter: data?.emailSentFilter || "all",
              whatsappSentFilter: data?.whatsappSentFilter || "all",
            },
            data.file
          );
          if (result?.error) {
            setSendingEmails(false);
            setBulkEmailModalOpen(false);
            showMessage(
              result.message || "Failed to send notifications",
              "error"
            );
          }
        }}
        sendingEmails={sendingEmails}
        emailProgress={emailProgress}
      />

      <ShareLinkModal
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setRegistrationToShare(null);
        }}
        url={
          registrationToShare && typeof window !== "undefined"
            ? `${window.location.origin}/checkin/event/${eventSlug}?token=${registrationToShare.token}`
            : ""
        }
        name={
          registrationToShare?.fullName ||
          registrationToShare?.token ||
          "registration"
        }
        title={t.shareLink}
      />
    </Container>
  );
}
