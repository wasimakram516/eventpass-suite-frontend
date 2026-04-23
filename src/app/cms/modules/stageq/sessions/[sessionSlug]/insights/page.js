"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    TextField,
    Paper,
    Typography,
    Chip,
    Stack,
    Divider,
    Button,
    CircularProgress,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import {
    getSessionInsightsSummary,
    getSessionInsightsFields,
    getSessionInsightsDistribution,
    getSessionInsightsTimeDistribution,
} from "@/services/stageq/stageqInsightsService";
import { getPublicSessionBySlug } from "@/services/stageq/stageqSessionService";
import ICONS from "@/utils/iconUtil";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import useI18nLayout from "@/hooks/useI18nLayout";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { exportChartsToPDF } from "@/components/badges/pdfExportCharts";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import * as XLSX from "xlsx";

dayjs.extend(utc);

const translations = {
    en: {
        pageTitle: "Session Insights",
        pageDescription: "Analyze participation, question trends, and breakdowns for this session.",
        availableFields: "Available Fields",
        selectFieldPrompt: "Select a field to view insights",
        distributionOverview: "Distribution Overview",
        historicalTrend: "Historical Trend",
        topN: "Top N",
        from: "From",
        to: "To",
        intervalMinutes: "Interval (min)",
        generate: "Generate",
        generating: "Generating...",
        exportInsights: "Export Insights",
        exporting: "Exporting...",
        exportRawData: "Export Raw Data",
        count: "Count",
        percentage: "Percentage",
        intervalMinutesFull: "Interval (minutes)",
        timestamp: "Timestamp",
        totalRegistrations: "Total Registrations",
        uniqueSubmitters: "Unique Submitters",
        participationRate: "Participation Rate",
        totalQuestions: "Total Questions",
        sessionTitle: "Session Title",
        category: "Category",
        noData: "No data to display",
    },
    ar: {
        pageTitle: "تحليلات الجلسة",
        pageDescription: "تحليل المشاركة واتجاهات الأسئلة والتوزيعات لهذه الجلسة.",
        availableFields: "الحقول المتاحة",
        selectFieldPrompt: "اختر حقلاً لعرض التحليلات",
        distributionOverview: "نظرة عامة على التوزيع",
        historicalTrend: "الاتجاه التاريخي",
        topN: "أفضل N",
        from: "من",
        to: "إلى",
        intervalMinutes: "الفترة (دقيقة)",
        generate: "إنشاء",
        generating: "جارٍ الإنشاء...",
        exportInsights: "تصدير التحليلات",
        exporting: "جارٍ التصدير...",
        exportRawData: "تصدير البيانات الأولية",
        count: "العدد",
        percentage: "النسبة المئوية",
        intervalMinutesFull: "الفترة (دقائق)",
        timestamp: "الوقت",
        totalRegistrations: "إجمالي التسجيلات",
        uniqueSubmitters: "المرسلون الفريدون",
        participationRate: "معدل المشاركة",
        totalQuestions: "إجمالي الأسئلة",
        sessionTitle: "عنوان الجلسة",
        category: "الفئة",
        noData: "لا توجد بيانات للعرض",
    },
};

const FIELD_COLOR = "#0077b6";

const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

const getPieSegmentColor = (index) => {
    const goldenRatioConjugate = 0.618033988749895;
    const hue = ((index * goldenRatioConjugate) % 1) * 360;
    const satBase = 65 + ((index * 17) % 25);
    const lightBase = 45 + ((index * 23) % 25);
    return hslToHex(Math.round(hue), satBase, lightBase);
};

const FieldChip = ({ field, isSelected, onClick }) => (
    <Chip
        label={field.label.length > 30 ? `${field.label.slice(0, 30)}…` : field.label}
        onClick={onClick}
        sx={{
            backgroundColor: isSelected ? field.color : "#ffffff",
            color: isSelected ? "#ffffff" : "#374151",
            fontWeight: isSelected ? 600 : 500,
            border: isSelected ? "none" : "2px solid #e5e7eb",
            cursor: "pointer",
            transition: "all 0.3s ease-out",
            "&:hover": {
                transform: "scale(1.05)",
                backgroundColor: isSelected ? field.color : `${field.color}15`,
                color: isSelected ? "#ffffff" : field.color,
                borderColor: field.color,
            },
        }}
    />
);

const ChartVisualization = ({
    selectedField,
    chartData,
    onTopNChange,
    onIntervalChange,
    onStartDateTimeChange,
    onEndDateTimeChange,
    onGenerate,
    startDateTime,
    endDateTime,
    topN,
    intervalMinutes,
    isGenerating,
    t,
    onRefReady,
}) => {
    const { dir } = useI18nLayout();
    if (!selectedField || !chartData[selectedField]) return null;
    const field = chartData[selectedField];
    if (!field) return null;

    const getChartDescription = () =>
        field.chartType === "pie" ? t.distributionOverview : t.historicalTrend;

    const showTopNControl = field.type === "text" || field.type === "number" || field.type === "categorical";
    const showIntervalControl = field.type === "time";
    const showGenerateButton = showTopNControl || showIntervalControl;
    const hasNoData = field.chartType === "pie" && (!field.data || field.data.length === 0);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2, width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${field.color}15`, borderRadius: 1, p: 1, width: 48, height: 48, flexShrink: 0 }}>
                        <ICONS.insights />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1f2937" }}>{field.label}</Typography>
                        <Typography variant="caption" color="textSecondary">{getChartDescription()}</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-end" }}>
                    {showTopNControl && (
                        <TextField
                            label={t.topN}
                            type="number"
                            size="small"
                            value={topN}
                            onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                onTopNChange(isNaN(val) ? 0 : val);
                            }}
                            InputProps={{ inputProps: { min: 0, max: 50 } }}
                            sx={{ width: "120px" }}
                            disabled={isGenerating}
                        />
                    )}
                    {showIntervalControl && (
                        <>
                            <DateTimePicker
                                label={t.from}
                                value={startDateTime}
                                onChange={(val) => onStartDateTimeChange(val)}
                                ampm
                                format="DD/MM/YYYY hh:mm A"
                                slotProps={{ textField: { size: "small", sx: { width: "200px" } } }}
                                disabled={isGenerating}
                            />
                            <DateTimePicker
                                label={t.to}
                                value={endDateTime}
                                onChange={(val) => onEndDateTimeChange(val)}
                                ampm
                                format="DD/MM/YYYY hh:mm A"
                                slotProps={{ textField: { size: "small", sx: { width: "200px" } } }}
                                disabled={isGenerating}
                            />
                            <TextField
                                label={t.intervalMinutes}
                                type="number"
                                size="small"
                                value={intervalMinutes}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    onIntervalChange(val === "" ? "" : parseInt(val));
                                }}
                                InputProps={{ inputProps: { min: 1, max: 1440 } }}
                                sx={{ width: "140px" }}
                                disabled={isGenerating}
                            />
                        </>
                    )}
                    {showGenerateButton && (
                        <Button
                            variant="text"
                            onClick={onGenerate}
                            disabled={isGenerating}
                            sx={{ whiteSpace: "nowrap", minWidth: "120px", position: "relative", ...getStartIconSpacing(dir) }}
                        >
                            {isGenerating ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <CircularProgress size={18} color="inherit" thickness={5} sx={{ mr: 0.5 }} />
                                    {t.generating}
                                </Box>
                            ) : (
                                <>
                                    <ICONS.insights style={{ marginRight: 8 }} />
                                    {t.generate}
                                </>
                            )}
                        </Button>
                    )}
                </Box>
            </Box>

            <Box ref={(el) => onRefReady && onRefReady(el)} sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column" }}>
                {hasNoData ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <Typography variant="body1" color="textSecondary">{t.noData}</Typography>
                    </Box>
                ) : field.chartType === "pie" ? (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 }, height: "100%", alignItems: { xs: "center", md: "stretch" } }}>
                        <Box sx={{ flex: { xs: "0 0 auto", md: 1 }, display: "flex", justifyContent: "center", alignItems: "center", width: { xs: "100%", md: "auto" }, maxWidth: { xs: "400px", md: "none" } }}>
                            <PieChart
                                series={[{
                                    data: field.data,
                                    highlightScope: { faded: "global", highlighted: "item" },
                                    faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
                                    arcLabel: () => "",
                                    valueFormatter: (item) => {
                                        const total = field.data.reduce((sum, d) => sum + d.value, 0);
                                        return `${total > 0 ? String(parseFloat(((item.value / total) * 100).toFixed(1))) : "0"}%`;
                                    },
                                }]}
                                height={400}
                                slotProps={{
                                    legend: { hidden: true, sx: { display: "none !important" } },
                                    pieArcLabel: { style: { fill: "white", fontWeight: 600, fontSize: "clamp(10px, 2vw, 14px)" } },
                                }}
                            />
                        </Box>
                        <Box sx={{ minWidth: { xs: "100%", md: "220px" }, overflow: "auto", px: { xs: 0, md: 2.5 }, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: { xs: "center", md: "flex-start" }, direction: "ltr" }}>
                            {field.data.map((item, idx) => {
                                const total = field.data.reduce((sum, d) => sum + d.value, 0);
                                const percentage = total > 0 ? String(parseFloat(((item.value / total) * 100).toFixed(1))) : "0";
                                return (
                                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr", ml: { xs: 0, md: 1 } }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: "0.875rem", direction: "ltr", textAlign: "left" }}>
                                            {item.label} {percentage}% ({item.value})
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 }, height: "100%", alignItems: { xs: "center", md: "stretch" } }}>
                        <Box sx={{ flex: { xs: "0 0 auto", md: 1 }, display: "flex", justifyContent: "center", alignItems: "center", width: { xs: "100%", md: "auto" } }}>
                            <LineChart
                                xAxis={[{ scaleType: "point", data: field.xData, tickLabelStyle: { direction: "ltr", textAlign: "left" } }]}
                                yAxis={[{ min: 0, max: Math.max(...field.yData) + Math.ceil(Math.max(...field.yData) * 0.05), tickLabelStyle: { direction: "ltr", textAlign: "left" } }]}
                                series={[{ data: field.yData, color: field.color, curve: "linear" }]}
                                height={400}
                                margin={{ top: 30, bottom: 50, left: 50, right: 80 }}
                                slotProps={{ legend: { hidden: true } }}
                                sx={{ "& .MuiMarkElement-root": { display: (d) => d.value === 0 ? "none" : "auto" } }}
                            />
                        </Box>
                        <Box sx={{ minWidth: { xs: "100%", md: "220px" }, overflow: "auto", pr: { xs: 0, md: 1 }, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: { xs: "center", md: "flex-start" } }}>
                            {field.xData.map((label, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr" }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: field.color, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: "0.875rem", direction: "ltr", textAlign: "left" }}>
                                        {label} ({field.yData[idx]})
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default function SessionInsightsDashboard() {
    const { sessionSlug } = useParams();
    const { t, dir, language } = useI18nLayout(translations);

    const [selectedFields, setSelectedFields] = useState([]);
    const [chartData, setChartData] = useState({});
    const [fieldParams, setFieldParams] = useState({});
    const [appliedParams, setAppliedParams] = useState({});
    const [generatingFields, setGeneratingFields] = useState({});
    const [availableFields, setAvailableFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartRefs, setChartRefs] = useState({});
    const [exportLoading, setExportLoading] = useState(false);
    const [exportRawLoading, setExportRawLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [linkedEvent, setLinkedEvent] = useState(null);

    const getFieldParam = (fieldName, paramName, defaultValue) =>
        fieldParams[fieldName]?.[paramName] ?? defaultValue;

    const updateFieldParam = (fieldName, paramName, value) => {
        setFieldParams((prev) => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], [paramName]: value },
        }));
    };

    useEffect(() => {
        const load = async () => {
            if (!sessionSlug) return;
            setLoading(true);
            try {
                const [fieldsRes, summaryRes, sessionRes] = await Promise.all([
                    getSessionInsightsFields(sessionSlug),
                    getSessionInsightsSummary(sessionSlug),
                    getPublicSessionBySlug(sessionSlug),
                ]);

                if (sessionRes && !sessionRes.error) {
                    setSessionInfo(sessionRes);
                    const eventId = sessionRes.linkedEventRegId?._id || sessionRes.linkedEventRegId;
                    if (eventId) {
                        try {
                            const { getPublicEventById } = await import("@/services/eventreg/eventService");
                            const eventData = await getPublicEventById(eventId);
                            if (eventData && !eventData.error) setLinkedEvent(eventData);
                        } catch { /* ignore */ }
                    }
                }

                if (summaryRes?.data) setSummary(summaryRes.data);

                const defaultParams = {};
                const allFields = [];

                (fieldsRes?.data?.topQuestionFields || []).forEach((f) => {
                    defaultParams[f.name] = { topN: 10 };
                    allFields.push({ ...f, chartType: "pie", color: FIELD_COLOR });
                });

                (fieldsRes?.data?.timeFields || []).forEach((f) => {
                    defaultParams[f.name] = {
                        intervalMinutes: 60,
                        startDateTime: dayjs().subtract(30, "day").startOf("day"),
                        endDateTime: dayjs().endOf("day"),
                    };
                    allFields.push({ ...f, chartType: "line", color: FIELD_COLOR });
                });

                (fieldsRes?.data?.registrationFields || []).forEach((f) => {
                    defaultParams[f.name] = { topN: 10 };
                    allFields.push({ ...f, chartType: "pie", color: FIELD_COLOR });
                });

                setFieldParams(defaultParams);
                setAppliedParams(defaultParams);
                setAvailableFields(allFields);
            } catch (err) {
                console.error("Error loading session insights:", err);
            }
            setLoading(false);
        };
        load();
    }, [sessionSlug]);

    useEffect(() => {
        const fetchChartData = async () => {
            if (!selectedFields.length || !sessionSlug || !availableFields.length) return;

            for (const fieldName of selectedFields) {
                const field = availableFields.find((f) => f.name === fieldName);
                if (!field) continue;
                const params = appliedParams[fieldName];
                if (!params) continue;

                try {
                    if (field.type === "time") {
                        const startDateTime = params.startDateTime ?? dayjs().subtract(30, "day").startOf("day");
                        const endDateTime = params.endDateTime ?? dayjs().endOf("day");
                        const intervalMinutes = params.intervalMinutes ?? 60;

                        const res = await getSessionInsightsTimeDistribution(
                            sessionSlug,
                            startDateTime.toDate(),
                            endDateTime.toDate(),
                            intervalMinutes
                        );

                        const filtered = (res?.data?.data || []).filter((d) => {
                            const pt = new Date(d.timestamp).getTime();
                            return d.count > 0 && pt >= startDateTime.valueOf() && pt <= endDateTime.valueOf();
                        });

                        setChartData((prev) => ({
                            ...prev,
                            [fieldName]: {
                                ...field,
                                xData: filtered.map((d) => formatDateTimeWithLocale(d.timestamp)),
                                yData: filtered.map((d) => d.count),
                            },
                        }));
                    } else {
                        const topN = params.topN ?? 10;
                        const useTopN = field.type === "text" || field.type === "number" || field.type === "categorical" ? topN : null;

                        if (useTopN === 0) {
                            setChartData((prev) => ({ ...prev, [fieldName]: { ...field, data: [] } }));
                            continue;
                        }

                        const res = await getSessionInsightsDistribution(sessionSlug, fieldName, useTopN);
                        const data = (res?.data?.data || []).map((item, idx) => ({
                            id: idx,
                            value: item.value,
                            label: item.label,
                            color: getPieSegmentColor(idx),
                        }));

                        setChartData((prev) => ({ ...prev, [fieldName]: { ...field, data } }));
                    }
                } catch (err) {
                    console.error(`Error loading chart data for ${fieldName}:`, err);
                }
            }
        };

        fetchChartData();
    }, [selectedFields, sessionSlug, availableFields, appliedParams]);

    const handleGenerate = async (fieldName) => {
        setGeneratingFields((prev) => ({ ...prev, [fieldName]: true }));
        setAppliedParams((prev) => ({ ...prev, [fieldName]: { ...fieldParams[fieldName] } }));
        setTimeout(() => {
            setGeneratingFields((prev) => ({ ...prev, [fieldName]: false }));
        }, 100);
    };

    const handleExportPDF = async () => {
        if (!selectedFields.length) return;
        setExportLoading(true);
        try {
            const refs = selectedFields.map((f) => chartRefs[f]).filter(Boolean);
            const labels = selectedFields.map((f) => availableFields.find((af) => af.name === f)?.label || f);
            const chartDataArray = selectedFields.map((f) => ({
                ...chartData[f],
                topN: getFieldParam(f, "topN", 10),
                intervalMinutes: getFieldParam(f, "intervalMinutes", 60),
                startDateTime: getFieldParam(f, "startDateTime", dayjs().subtract(30, "day").startOf("day")).toDate(),
                endDateTime: getFieldParam(f, "endDateTime", dayjs().endOf("day")).toDate(),
                legend: false,
            }));
            const formatPdfDate = (d) => d ? dayjs(d).format("DD-MMM-YY, hh:mm a") : "N/A";
            const pdfEventInfo = {
                name: sessionInfo?.slug || "",
                subtitle: linkedEvent?.name || undefined,
                subtitleLabel: "Event Name",
                startDateFormatted: formatPdfDate(linkedEvent?.startDate),
                endDateFormatted: formatPdfDate(linkedEvent?.endDate),
                venue: linkedEvent?.venue || "N/A",
            };
            await exportChartsToPDF(refs, labels, chartDataArray, pdfEventInfo, null, language, dir, t, Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch (err) {
            console.error("PDF export failed:", err);
        }
        setExportLoading(false);
    };

    const handleExportRawData = () => {
        if (!selectedFields.length || !sessionInfo) return;
        setExportRawLoading(true);
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const getTimezoneLabel = (tz) => {
                try {
                    const now = new Date();
                    const longName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "long" })
                        .formatToParts(now).find((p) => p.type === "timeZoneName")?.value || tz;
                    const shortOffset = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
                        .formatToParts(now).find((p) => p.type === "timeZoneName")?.value || "";
                    return shortOffset ? `${longName} (${shortOffset})` : longName;
                } catch { return tz || "UTC"; }
            };
            const formatDT = (val) => {
                if (!val) return "";
                try {
                    return new Intl.DateTimeFormat("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                        timeZone: timezone,
                    }).format(new Date(val));
                } catch { return String(val); }
            };
            const wb = XLSX.utils.book_new();
            const wsData = [];

            const toNumericIfPossible = (val) => {
                if (language !== "ar") return val;
                if (typeof val === "number") return val;
                if (typeof val === "string") {
                    const trimmed = val.trim();
                    if (trimmed !== "" && Number.isFinite(Number(trimmed))) return Number(trimmed);
                }
                return val;
            };
            const formatCount = (val) => (language === "ar" ? val : String(val));
            const leftAlign = (value, fallback = 0) => `${value !== undefined && value !== null ? value : fallback}`;
            const pushRow = (...cols) => {
                const normalized = cols.map((c) => (c === undefined || c === null ? "" : c));
                if (language === "ar") {
                    if (normalized.length === 1) { wsData.push(["", "", normalized[0]]); return; }
                    if (normalized.length === 2) { wsData.push(["", normalized[1], normalized[0]]); return; }
                    if (normalized.length === 3) { wsData.push([normalized[2], normalized[1], normalized[0]]); return; }
                }
                wsData.push(normalized);
            };

            const formatDateTimeForExcel = (dateString) => formatDT(dateString);

            // Linked event section
            if (linkedEvent) {
                pushRow("Logo URL", linkedEvent.logoUrl || "N/A");
                pushRow("Event Name", linkedEvent.name || "N/A");
                pushRow("From", linkedEvent.startDate ? formatDateTimeForExcel(linkedEvent.startDate) : "N/A");
                pushRow("To", linkedEvent.endDate ? formatDateTimeForExcel(linkedEvent.endDate) : "N/A");
                pushRow("Venue", linkedEvent.venue || "N/A");
                wsData.push([]);
            }

            // Session info section
            pushRow(t.sessionTitle, sessionInfo.title || "N/A");
            pushRow(t.totalQuestions, leftAlign(summary?.totalQuestions));
            pushRow(t.uniqueSubmitters, leftAlign(summary?.uniqueSubmitters));
            pushRow(t.participationRate, summary?.participationRate != null ? `${summary.participationRate}%` : "N/A");
            pushRow("Timezone", getTimezoneLabel(timezone));
            wsData.push([]);

            // Chart data sections
            selectedFields.forEach((fieldName) => {
                const field = availableFields.find((f) => f.name === fieldName);
                const data = chartData[fieldName];
                if (!field || !data) return;

                pushRow(`=== ${field.label} ===`);

                if (data.chartType === "pie") {
                    const topN = getFieldParam(fieldName, "topN", 10);
                    if (field.type === "text" || field.type === "number" || field.type === "categorical") pushRow(t.topN, formatCount(topN));
                    pushRow(t.category, t.count, t.percentage);
                    const total = data.data.reduce((sum, d) => sum + d.value, 0);
                    data.data.forEach((item) => {
                        const pct = ((item.value / total) * 100).toFixed(2);
                        pushRow(toNumericIfPossible(item.label), formatCount(item.value), `${pct}%`);
                    });
                } else if (data.chartType === "line") {
                    const startDateTime = getFieldParam(fieldName, "startDateTime", dayjs().subtract(30, "day").startOf("day"));
                    const endDateTime = getFieldParam(fieldName, "endDateTime", dayjs().endOf("day"));
                    const intervalMinutes = getFieldParam(fieldName, "intervalMinutes", 60);
                    pushRow(t.from, formatDT(startDateTime));
                    pushRow(t.to, formatDT(endDateTime));
                    pushRow(t.intervalMinutesFull, formatCount(intervalMinutes));
                    pushRow(t.timestamp, t.count);
                    data.xData.forEach((label, idx) => {
                        pushRow(formatDT(label), formatCount(data.yData[idx]));
                    });
                }
                wsData.push([]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            if (language === "ar") ws["!views"] = [{ rightToLeft: true }];
            XLSX.utils.book_append_sheet(wb, ws, "Insights Data");
            const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${sessionInfo.slug || "session"}_insights_raw_data.xlsx`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error("Raw data export failed:", err);
        }
        setExportRawLoading(false);
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            dir={dir}
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
                overflow: "hidden",
                p: { xs: 1, sm: 1.5, md: 2 },
                gap: 1,
                boxSizing: "border-box",
            }}
        >
            <BreadcrumbsNav />

            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
            >
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>{t.pageTitle}</Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>{t.pageDescription}</Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} sx={{ width: { xs: "100%", sm: "auto" }, gap: { xs: 1, sm: 2 } }}>
                    {selectedFields.length > 0 && (
                        <>
                            <Button
                                variant="outlined"
                                onClick={handleExportRawData}
                                disabled={exportRawLoading}
                                startIcon={exportRawLoading ? <CircularProgress size={20} color="inherit" /> : <ICONS.download />}
                                sx={{ whiteSpace: "nowrap", width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: "fit-content" }, py: 1, ...getStartIconSpacing(dir) }}
                            >
                                {exportRawLoading ? t.exporting : t.exportRawData}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleExportPDF}
                                disabled={exportLoading}
                                startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <ICONS.download />}
                                sx={{ whiteSpace: "nowrap", width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: "fit-content" }, py: 1, ...getStartIconSpacing(dir) }}
                            >
                                {exportLoading ? t.exporting : t.exportInsights}
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>

            <Divider sx={{ mb: 1 }} />

            {/* Field Chip Selector */}
            <Paper sx={{ flex: "0 0 auto", p: { xs: 1, sm: 1.5, md: 2 }, borderRadius: 2, boxShadow: 2, width: "100%", boxSizing: "border-box" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>
                    {t.availableFields}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, maxWidth: "100%" }}>
                    {availableFields.map((field) => (
                        <FieldChip
                            key={field.name}
                            field={field}
                            isSelected={selectedFields.includes(field.name)}
                            onClick={() =>
                                setSelectedFields((prev) =>
                                    prev.includes(field.name)
                                        ? prev.filter((f) => f !== field.name)
                                        : [...prev, field.name]
                                )
                            }
                        />
                    ))}
                </Stack>
            </Paper>

            {/* Chart Panels */}
            <Stack spacing={2} sx={{ flex: "1 1 0%", overflow: "auto", minHeight: 0, pb: 2, px: 0.3 }}>
                {selectedFields.length === 0 ? (
                    <Paper sx={{ flex: 1, borderRadius: 2, boxShadow: 2, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                        <Box textAlign="center">
                            <BarChartIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
                            <Typography color="textSecondary">{t.selectFieldPrompt}</Typography>
                        </Box>
                    </Paper>
                ) : (
                    selectedFields.map((fieldName) => (
                        <Paper key={fieldName} sx={{ borderRadius: 2, boxShadow: 2, minHeight: "450px" }}>
                            <ChartVisualization
                                selectedField={fieldName}
                                chartData={chartData}
                                topN={getFieldParam(fieldName, "topN", 10)}
                                intervalMinutes={getFieldParam(fieldName, "intervalMinutes", 60)}
                                startDateTime={getFieldParam(fieldName, "startDateTime", dayjs().subtract(30, "day").startOf("day"))}
                                endDateTime={getFieldParam(fieldName, "endDateTime", dayjs().endOf("day"))}
                                onTopNChange={(val) => updateFieldParam(fieldName, "topN", val)}
                                onIntervalChange={(val) => updateFieldParam(fieldName, "intervalMinutes", val)}
                                onStartDateTimeChange={(val) =>
                                    updateFieldParam(fieldName, "startDateTime", val ? dayjs(val) : dayjs().subtract(30, "day").startOf("day"))
                                }
                                onEndDateTimeChange={(val) =>
                                    updateFieldParam(fieldName, "endDateTime", val ? dayjs(val) : dayjs().endOf("day"))
                                }
                                onGenerate={() => handleGenerate(fieldName)}
                                isGenerating={generatingFields[fieldName] || false}
                                onRefReady={(el) => {
                                    if (el && chartRefs[fieldName] !== el) {
                                        setChartRefs((prev) => ({ ...prev, [fieldName]: el }));
                                    }
                                }}
                                t={t}
                            />
                        </Paper>
                    ))
                )}
            </Stack>
        </Box>
    );
}
