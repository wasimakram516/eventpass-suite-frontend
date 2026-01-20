"use client";

import React, { useState, useEffect, useRef } from "react";
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
    TextField,
    Chip,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import FilterDialog from "@/components/modals/FilterModal";
import {
    getDigipassRegistrationsByEvent,
    deleteDigipassRegistration,
    getDigipassInitialRegistrations,
    updateDigipassRegistration,
    createDigipassRegistrationCMS,
    createDigipassWalkIn,
    downloadSampleExcel,
    uploadRegistrations,
    exportRegistrations,
} from "@/services/digipass/digipassRegistrationService";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";

import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import { useParams } from "next/navigation";
import ICONS from "@/utils/iconUtil";
import WalkInModal from "@/components/modals/WalkInModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import NoDataAvailable from "@/components/NoDataAvailable";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import RegistrationModal from "@/components/modals/RegistrationModal";
import { useMessage } from "@/contexts/MessageContext";
import { pickFullName, pickEmail } from "@/utils/customFieldUtils";
import useSocket from "@/utils/useSocket";

const translations = {
    en: {
        title: "Event Details",
        description:
            "View event details and manage registrations for this event. Export registration data or delete entries as needed.",
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
        scannedBy: "Scanned By (Name or Email)",
        scannedAt: "Scanned At",
        searchPlaceholder: "Search...",
        apply: "Apply",
        clear: "Clear",
        filterRegistrations: "Filter Registrations",
        editRegistration: "Edit Registration",
        createRegistration: "New",
        copyToken: "Copy Token",
    },
    ar: {
        title: "تفاصيل الحدث",
        description:
            "اعرض تفاصيل الحدث وقم بإدارة التسجيلات. يمكنك تصدير البيانات أو حذف السجلات.",
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
        scannedBy: "تم المسح بواسطة (الاسم أو البريد الإلكتروني)",
        scannedAt: "تاريخ المسح",
        searchPlaceholder: "بحث...",
        apply: "تطبيق",
        clear: "مسح",
        filterRegistrations: "تصفية التسجيلات",
        editRegistration: "تعديل التسجيل",
        createRegistration: "جديد",
        copyToken: "نسخ الرمز",
    },
};

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

const buildHaystack = (reg, fieldsLocal) => {
    const dyn = fieldsLocal.map((f) => reg.customFields?.[f.name] ?? "");
    const walk = (reg.walkIns || []).flatMap((w) => [
        w.scannedBy?.name,
        w.scannedBy?.email,
    ]);
    const name = pickFullName(reg.customFields) || "";
    const email = pickEmail(reg.customFields) || "";
    return [
        name,
        email,
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
    const { dir, t } = useI18nLayout(translations);
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
    const [uploadProgress, setUploadProgress] = useState(null);

    const [rawSearch, setRawSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState(BASE_DATE_FILTERS);

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

    const fetchData = async () => {
        setLoading(true);
        setIsLoadingMore(false);

        const evRes = await getDigipassEventBySlug(eventSlug);

        const fieldsLocal =
            !evRes?.error && evRes.formFields?.length
                ? evRes.formFields.map((f) => ({
                    name: f.inputName,
                    type: (f.inputType || "text").toLowerCase(),
                    values: Array.isArray(f.values) ? f.values : [],
                }))
                : [];

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

        const regsRes = await getDigipassInitialRegistrations(eventSlug);
        if (!regsRes?.error) {
            const initialData = regsRes.data || [];
            const prepped = initialData.map((r) => ({
                ...r,
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

    const handleSaveEdit = async (updatedFields) => {
        const res = await updateDigipassRegistration(editingReg._id, updatedFields);
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
                    }
                }
                return r;
            })
        );
        setEditModalOpen(false);
        setEditingReg(null);
        fetchData();
    };

    const handleCreateRegistration = async (fields) => {
        const hasCustomFields = eventDetails?.formFields?.length > 0;
        let payload = { slug: eventSlug };

        if (hasCustomFields) {
            payload = { ...fields, slug: eventSlug };
        }

        const res = await createDigipassRegistrationCMS(payload);

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
            ...restFilters
        } = filters;

        return allRegistrations.filter((reg) => {
            if (searchTerm && !reg._haystack.includes(searchTerm)) return false;

            if (createdAtFromMs != null && reg._createdAtMs < createdAtFromMs)
                return false;
            if (createdAtToMs != null && reg._createdAtMs > createdAtToMs)
                return false;

            if (scannedAtFromMs != null || scannedAtToMs != null) {
                const ok = reg._scannedAtMs.some((d) => {
                    if (scannedAtFromMs != null && d < scannedAtFromMs) return false;
                    if (scannedAtToMs != null && d > scannedAtToMs) return false;
                    return true;
                });
                if (!ok) return false;
            }

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
            const sampleBlob = await downloadSampleExcel(eventSlug);
            const sampleUrl = URL.createObjectURL(sampleBlob);
            const sampleLink = document.createElement("a");
            sampleLink.href = sampleUrl;
            sampleLink.download = `${eventDetails?.slug || "event"}_registrations_template.xlsx`;
            document.body.appendChild(sampleLink);
            sampleLink.click();
            document.body.removeChild(sampleLink);
            URL.revokeObjectURL(sampleUrl);
        } catch (err) {
            console.error("Failed to download sample:", err);
            showMessage("Failed to download sample file", "error");
        }
    };

    const handleUpload = async (e) => {
        if (!eventSlug) return;
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress({ uploaded: 0, total: 0 });
        try {
            const result = await uploadRegistrations(eventSlug, file);
            if (result?.error) {
                setUploading(false);
                setUploadProgress(null);
                e.target.value = "";
                return;
            }
            e.target.value = "";
            setUploadProgress({ uploaded: result.total || 0, total: result.total || 0 });
            setTimeout(() => {
                fetchData();
                setUploading(false);
                setUploadProgress(null);
            }, 1000);
        } catch (err) {
            console.error("Upload failed:", err);
            setUploading(false);
            setUploadProgress(null);
            e.target.value = "";
        }
    };

    const eventIdStr = eventDetails?._id?.toString();
    const { socket } = useSocket(
        React.useMemo(
            () => ({
                digipassRegistrationUploadProgress: (data) => {
                    if (data.eventId?.toString() === eventIdStr) {
                        setUploadProgress({ uploaded: data.uploaded, total: data.total });
                        if (data.uploaded >= data.total) {
                            setTimeout(() => {
                                fetchData();
                                setUploading(false);
                                setUploadProgress(null);
                            }, 1000);
                        }
                    }
                },
            }),
            [eventIdStr]
        )
    );

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

            dynamicFields.forEach((f) => {
                const v = filters[f.name];
                if (v) query[`field_${f.name}`] = v;
            });

            query.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const blob = await exportRegistrations(eventSlug, query);

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            const suffix = Object.keys(query).length > 0 ? "filtered" : "all";
            a.download = `${eventDetails.slug}_${suffix}_registrations.csv`;

            a.href = url;
            a.click();

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            showMessage("Failed to export registrations", "error");
        } finally {
            setExportLoading(false);
        }
    };

    const handlePageChange = (_, value) => setPage(value);
    const handleLimitChange = (e) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handleDelete = async () => {
        const res = await deleteDigipassRegistration(registrationToDelete);
        if (!res?.error) {
            setAllRegistrations((prev) =>
                prev.filter((r) => r._id !== registrationToDelete)
            );

            setTotalRegistrations((t) => t - 1);
        }
        setDeleteDialogOpen(false);
    };

    const refreshRegistrationWalkIns = async (registrationId) => {
        if (!registrationId) return;
        try {
            const regsRes = await getDigipassInitialRegistrations(eventSlug);
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
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                        {t.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t.description}
                    </Typography>
                </Box>
            </Stack>
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
            </Stack>

            <Divider sx={{ my: 3 }} />

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
                        {Math.min(page * limit, filteredRegistrations.length)} {t.of}{" "}
                        {filteredRegistrations.length} {t.records}
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
                        {paginatedRegistrations.map((reg) => {
                            const name = pickFullName(reg.customFields) || "—";
                            const email = pickEmail(reg.customFields) || "—";

                            return (
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
                                        </Box>

                                        <CardContent sx={{ flexGrow: 1, px: 2, py: 1.5 }}>
                                            {dynamicFields.length > 0 ? (
                                                dynamicFields.map((f) => (
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
                                                                const fieldValue = reg.customFields?.[f.name] ?? "";
                                                                if (!fieldValue) return "—";

                                                                if (f.type === "phone" || (!eventDetails?.formFields?.length && f.name === "phone")) {
                                                                    const { formatPhoneNumberForDisplay } = require("@/utils/countryCodes");
                                                                    return formatPhoneNumberForDisplay(fieldValue, reg.isoCode);
                                                                }

                                                                return fieldValue;
                                                            })()}
                                                        </Typography>
                                                    </Box>
                                                ))
                                            ) : (
                                                <>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "flex-start",
                                                            py: 0.8,
                                                            borderBottom: "1px solid",
                                                            borderColor: "divider",
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
                                                            {t.fullName}
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
                                                            {name}
                                                        </Typography>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "flex-start",
                                                            py: 0.8,
                                                            borderBottom: "1px solid",
                                                            borderColor: "divider",
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
                                                            <ICONS.email
                                                                fontSize="small"
                                                                sx={{ opacity: 0.6 }}
                                                            />
                                                            {t.emailLabel}
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
                                                            {email}
                                                        </Typography>
                                                    </Box>
                                                </>
                                            )}
                                        </CardContent>

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
                                                    justifyContent: "center",
                                                    gap: 1.2,
                                                    width: "100%",
                                                }}
                                            >
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
                            );
                        })}
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
                event={eventDetails}
            />

            <RegistrationModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                registration={null}
                formFields={eventDetails?.formFields || []}
                onSave={handleCreateRegistration}
                mode="create"
                event={eventDetails}
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

            <WalkInModal
                open={walkInModalOpen}
                onClose={() => setWalkInModalOpen(false)}
                registration={selectedRegistration}
                isDigiPass={true}
                onCheckInSuccess={async () => {
                    if (selectedRegistration?._id) {
                        await refreshRegistrationWalkIns(selectedRegistration._id);
                    }
                }}
            />

            <FilterDialog
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                title={t.filterRegistrations || "Filter Registrations"}
            >
                <Stack spacing={2}>
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

