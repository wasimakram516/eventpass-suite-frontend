"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    TextField,
    Paper,
    Typography,
    Chip,
    Stack,
    Divider,
} from "@mui/material";
import {
    getAvailableFields,
    getFieldDistribution,
    getTimeDistribution,
    getScannedByTypeDistribution,
    getScannedByUserDistribution,
    getInsightsSummary,
    getActivitiesPerParticipantDistribution,
} from "@/services/digipass/insightsService";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import ChartVisualization from "@/components/insights/ChartVisualization";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import AppCard from "@/components/cards/AppCard";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import useI18nLayout from "@/hooks/useI18nLayout";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { exportChartsToPDF } from "@/components/badges/pdfExportCharts";
import { Button, CircularProgress } from "@mui/material";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import * as XLSX from "xlsx";

const translations = {
    en: {
        pageTitle: "Intelligent Insights",
        pageDescription:
            "Analyze event data and visualize key metrics through interactive charts and distributions.",
        availableFields: "Available Fields",
        selectChipsPrompt: "Select the chips to see the charts",
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
        venue: "Venue",
        registrations: "Registrations",
        type: "Type",
        page: "Page",
        of: "of",
        rating: "Rating",
        logoUrl: "Logo URL",
        eventName: "Event Name",
        category: "Category",
        count: "Count",
        percentage: "Percentage",
        intervalMinutesFull: "Interval (minutes)",
        timestamp: "Timestamp",
        totalRegistrations: "Total Registrations",
        totalParticipants: "Total Participants",
        totalActivityCompletions: "Total Activity Completions",
        avgActivities: "Avg Activities per Participant",
        scanRate: "Scan Rate",
        exportedAt: "Exported At",
    },
    ar: {
        pageTitle: "تحليلات ذكية",
        pageDescription:
            "تحليل بيانات الحدث وتصور المقاييس الرئيسية من خلال الرسوم البيانية والتوزيعات التفاعلية.",
        availableFields: "الحقول المتاحة",
        selectChipsPrompt: "اختر الشرائح لعرض الرسوم البيانية",
        selectFieldPrompt: "اختر حقلاً لعرض التحليلات",
        distributionOverview: "نظرة عامة على التوزيع",
        historicalTrend: "الاتجاه التاريخي",
        topN: "أعلى N",
        from: "من",
        to: "إلى",
        intervalMinutes: "الفاصل الزمني (دقيقة)",
        generate: "إنشاء",
        generating: "جاري الإنشاء...",
        exportInsights: "تصدير التحليلات",
        exportRawData: "تصدير البيانات الأولية",
        exporting: "جاري التصدير...",
        venue: "الموقع",
        registrations: "التسجيلات",
        type: "النوع",
        page: "صفحة",
        of: "من",
        rating: "التقييم",
        logoUrl: "رابط الشعار",
        eventName: "اسم الحدث",
        category: "الفئة",
        count: "العدد",
        percentage: "النسبة المئوية",
        intervalMinutesFull: "الفاصل الزمني (بالدقائق)",
        timestamp: "الطابع الزمني",
        totalRegistrations: "إجمالي التسجيلات",
        totalParticipants: "إجمالي المشاركين",
        totalActivityCompletions: "إجمالي إنجازات الأنشطة",
        avgActivities: "متوسط الأنشطة لكل مشارك",
        scanRate: "معدل المسح",
        exportedAt: "تاريخ التصدير",
    },
};

const FIELD_COLOR = "#0077b6";

const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x) =>
        Math.round(255 * x)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

const getPieSegmentColor = (index) => {
    const goldenRatioConjugate = 0.618033988749895;
    const hue = ((index * goldenRatioConjugate) % 1) * 360;

    const satBase = 65 + ((index * 17) % 25);
    const lightBase = 45 + ((index * 23) % 25);

    return hslToHex(Math.round(hue), satBase, lightBase);
};

const determineChartType = (field) => {
    if (field.type === "time") return "line";
    return "pie";
};
dayjs.extend(utc);
const FieldChip = ({ field, isSelected, onClick }) => {
    return (
        <Chip
            label={field.label}
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
};

export default function AnalyticsDashboard() {
    const { eventSlug } = useParams();
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
    const [eventInfo, setEventInfo] = useState(null);
    const [summary, setSummary] = useState(null);
    const [chartVisualTypes, setChartVisualTypes] = useState({});
    const [fieldSegments, setFieldSegments] = useState({});

    const getFieldParam = (fieldName, paramName, defaultValue) => {
        return fieldParams[fieldName]?.[paramName] ?? defaultValue;
    };

    const updateFieldParam = (fieldName, paramName, value) => {
        setFieldParams((prev) => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                [paramName]: value,
            },
        }));
    };

    useEffect(() => {
        const fetchFields = async () => {
            if (!eventSlug) return;

            try {
                setLoading(true);
                const [fieldsResponse, eventResponse, summaryResponse] = await Promise.all([
                    getAvailableFields(eventSlug),
                    getDigipassEventBySlug(eventSlug),
                    getInsightsSummary(eventSlug),
                ]);

                let eventData =
                    eventResponse?.data?.event || eventResponse?.data || eventResponse;
                if (eventData?.linkedEventRegId) {
                    eventData = {
                        ...eventData,
                        startDate: eventData.linkedEventRegId.startDate,
                        endDate: eventData.linkedEventRegId.endDate,
                        venue: eventData.linkedEventRegId.venue
                    };
                }
                console.log("Event data structure:", eventData);
                setEventInfo(eventData);

                if (summaryResponse?.data) {
                    setSummary(summaryResponse.data);
                }

                const response = fieldsResponse;

                const defaultParams = {};
                response.data.categoricalFields.forEach((f) => {
                    defaultParams[f.name] = { topN: 10 };
                });
                response.data.timeFields.forEach((f) => {
                    defaultParams[f.name] = {
                        intervalMinutes: 60,
                        startDateTime: dayjs().subtract(30, "day").startOf("day"),
                        endDateTime: dayjs().endOf("day"),
                    };
                });
                defaultParams["scannedByType"] = { topN: 10 };
                defaultParams["scannedByUser"] = { topN: 10 };
                defaultParams["activitiesPerParticipant"] = { topN: 10 };

                setFieldParams(defaultParams);
                setAppliedParams(defaultParams);

                const allFields = [
                    ...response.data.categoricalFields
                        .filter((f) => f.name !== "token")
                        .map((f) => ({
                            ...f,
                            chartType: determineChartType(f),
                            allowedChartTypes: f.type === "time" ? ["line", "bar", "horizontalBar", "heatmap"] : ["pie", "bar", "horizontalBar"],
                            color: FIELD_COLOR,
                        })),
                    ...response.data.timeFields
                        .filter((f) => f.name !== "token")
                        .map((f) => ({
                            ...f,
                            chartType: "line",
                            allowedChartTypes: ["line", "bar", "horizontalBar", "heatmap"],
                            color: FIELD_COLOR,
                        })),
                ];

                allFields.push(
                    {
                        name: "activitiesPerParticipant",
                        label: "Activities Completed per Participant",
                        type: "special",
                        chartType: "bar",
                        allowedChartTypes: ["pie", "bar", "horizontalBar", "line"],
                        color: FIELD_COLOR,
                    },
                    {
                        name: "scannedByType",
                        label: "Scanned By Staff Type",
                        type: "special",
                        chartType: "pie",
                        allowedChartTypes: ["pie", "bar", "horizontalBar"],
                        color: FIELD_COLOR,
                    },
                    {
                        name: "scannedByUser",
                        label: "Staff Scan Breakdown",
                        type: "special",
                        chartType: "bar",
                        allowedChartTypes: ["bar", "pie", "horizontalBar"],
                        color: FIELD_COLOR,
                    }
                );

                setAvailableFields(allFields);
            } catch (error) {
                console.error("Error loading fields:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFields();
    }, [eventSlug]);

    useEffect(() => {
        const fetchChartData = async () => {
            if (
                selectedFields.length === 0 ||
                !eventSlug ||
                availableFields.length === 0
            )
                return;

            for (const fieldName of selectedFields) {
                const field = availableFields.find((f) => f.name === fieldName);
                if (!field) continue;

                const appliedFieldParams = appliedParams[fieldName];
                if (!appliedFieldParams) continue;

                const topN = appliedFieldParams.topN ?? 10;
                const intervalMinutes = appliedFieldParams.intervalMinutes ?? 60;
                const startDateTime =
                    appliedFieldParams.startDateTime ??
                    dayjs().subtract(30, "day").startOf("day");
                const endDateTime =
                    appliedFieldParams.endDateTime ?? dayjs().endOf("day");

                try {
                    let response;
                    if (field.type === "time") {
                        const start = startDateTime.toDate();
                        const end = endDateTime.toDate();

                        response = await getTimeDistribution(
                            eventSlug,
                            fieldName,
                            start,
                            end,
                            intervalMinutes
                        );

                        const startTimeLocal = startDateTime.valueOf();
                        const endTimeLocal = endDateTime.valueOf();

                        const filteredData = response.data.data.filter((d) => {
                            const pointTime = new Date(d.timestamp).getTime();
                            return (
                                d.count > 0 &&
                                pointTime >= startTimeLocal &&
                                pointTime <= endTimeLocal
                            );
                        });

                        const xData = filteredData.map((d) =>
                            formatDateTimeWithLocale(d.timestamp)
                        );
                        const yData = filteredData.map((d) => d.count);

                        setChartData((prev) => ({
                            ...prev,
                            [fieldName]: { ...field, xData, yData },
                        }));
                    } else if (fieldName === "activitiesPerParticipant") {
                        const segment = fieldSegments[fieldName];
                        const useTopN = appliedFieldParams.topN ?? 10;

                        if (segment) {
                            response = await getFieldDistribution(
                                eventSlug,
                                segment,
                                useTopN,
                                "completions"
                            );

                            const data = response.data.data.map((item, idx) => ({
                                id: idx,
                                value: item.value,
                                label: item.label,
                                color: getPieSegmentColor(idx),
                            }));

                            setChartData((prev) => ({
                                ...prev,
                                [fieldName]: {
                                    ...field,
                                    data,
                                    xData: response.data.data.map((item) => item.label),
                                    yData: response.data.data.map((item) => item.value),
                                    segmentLabel: segment,
                                },
                            }));
                        } else {
                            response = await getActivitiesPerParticipantDistribution(eventSlug);

                            const data = response.data.data.map((item, idx) => ({
                                id: idx,
                                value: item.value,
                                label: item.label,
                                color: getPieSegmentColor(idx),
                            }));

                            setChartData((prev) => ({
                                ...prev,
                                [fieldName]: {
                                    ...field,
                                    data,
                                    xData: response.data.data.map((item) => item.label),
                                    yData: response.data.data.map((item) => item.value),
                                },
                            }));
                        }
                    } else if (fieldName === "scannedByType") {
                        response = await getScannedByTypeDistribution(eventSlug);
                        const data = response.data.data.map((item, idx) => ({
                            id: idx,
                            value: item.value,
                            label: item.label,
                            color: getPieSegmentColor(idx),
                        }));
                        setChartData((prev) => ({
                            ...prev,
                            [fieldName]: {
                                ...field,
                                data,
                                xData: response.data.data.map((item) => item.label),
                                yData: response.data.data.map((item) => item.value),
                            },
                        }));
                    } else if (fieldName === "scannedByUser") {
                        const useTopN = appliedFieldParams.topN ?? 10;
                        response = await getScannedByUserDistribution(eventSlug);

                        let rawData = response.data.data;
                        if (useTopN && useTopN > 0) {
                            rawData = rawData.slice(0, useTopN);
                        }

                        const data = rawData.map((item, idx) => ({
                            id: idx,
                            value: item.value,
                            label: item.label,
                            color: getPieSegmentColor(idx),
                        }));
                        setChartData((prev) => ({
                            ...prev,
                            [fieldName]: {
                                ...field,
                                data,
                                xData: rawData.map((item) => item.label),
                                yData: rawData.map((item) => item.value),
                            },
                        }));
                    } else {
                        const useTopN =
                            field.type === "text" || field.type === "number" ? topN : null;

                        if (useTopN === 0) {
                            setChartData((prev) => ({
                                ...prev,
                                [fieldName]: { ...field, data: [] },
                            }));
                            continue;
                        }

                        response = await getFieldDistribution(
                            eventSlug,
                            fieldName,
                            useTopN
                        );

                        const data = response.data.data.map((item, idx) => ({
                            id: idx,
                            value: item.value,
                            label: item.label,
                            color: getPieSegmentColor(idx),
                        }));

                        setChartData((prev) => ({
                            ...prev,
                            [fieldName]: { ...field, data },
                        }));
                    }
                } catch (error) {
                    console.error(`Error loading chart data for ${fieldName}:`, error);
                }
            }
        };

        fetchChartData();
    }, [selectedFields, eventSlug, availableFields, appliedParams]);

    const handleExportPDF = async () => {
        if (selectedFields.length === 0) return;

        setExportLoading(true);
        try {
            const refs = selectedFields
                .map((fieldName) => chartRefs[fieldName])
                .filter(Boolean);

            const labels = selectedFields.map((fieldName) => {
                const field = availableFields.find((f) => f.name === fieldName);
                return field?.label || fieldName;
            });

            const chartDataArray = selectedFields.map((fieldName) => {
                const data = chartData[fieldName];
                const activeType = chartVisualTypes[fieldName] || data.chartType;
                return {
                    ...data,
                    chartType: activeType,
                    topN: getFieldParam(fieldName, "topN", 10),
                    intervalMinutes: getFieldParam(fieldName, "intervalMinutes", 60),
                    startDateTime: getFieldParam(
                        fieldName,
                        "startDateTime",
                        dayjs().subtract(30, "day").startOf("day")
                    ).toDate(),
                    endDateTime: getFieldParam(
                        fieldName,
                        "endDateTime",
                        dayjs().endOf("day")
                    ).toDate(),
                    legend: false,
                };
            });

            const summaryCards = summary ? [
                { label: t.totalParticipants, value: summary.totalParticipants, color: "#0077b6" },
                { label: t.totalActivityCompletions, value: summary.totalActivityCompletions, color: "#f59e0b" },
                { label: t.avgActivities, value: summary.avgActivitiesPerParticipant, color: "#8b5cf6" },
                eventInfo?.linkedEventRegId ? { label: t.scanRate, value: `${summary.scanRate}%`, color: "#10b981" } : null,
            ].filter(Boolean) : [];

            await exportChartsToPDF(
                refs,
                labels,
                chartDataArray,
                { ...eventInfo, summaryCards },
                null,
                language,
                dir,
                t,
                Intl.DateTimeFormat().resolvedOptions().timeZone
            );
        } catch (error) {
            console.warn("PDF export failed:", error.message || error);
        }
        setExportLoading(false);
    };

    const handleExportRawData = () => {
        if (selectedFields.length === 0 || !eventInfo) return;

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
            const formatDateTimeForExcel = (dateString) => {
                if (!dateString) return "";
                try {
                    return new Intl.DateTimeFormat("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                        timeZone: timezone,
                    }).format(new Date(dateString));
                } catch { return String(dateString); }
            };

            const wb = XLSX.utils.book_new();
            const wsData = [];
            const toNumericIfPossible = (val) => {
                if (language !== "ar") return val;
                if (typeof val === "number") return val;
                if (typeof val === "string") {
                    const trimmed = val.trim();
                    if (trimmed !== "" && Number.isFinite(Number(trimmed))) {
                        return Number(trimmed);
                    }
                }
                return val;
            };
            const formatCountValue = (val) => {
                return language === "ar" ? val : String(val);
            };
            const leftAlignNumber = (value, fallback = 0) => {
                const resolved = value !== undefined && value !== null ? value : fallback;
                return `${resolved}`;
            };
            const pushRow = (...cols) => {
                const normalized = cols.map((col) =>
                    col === undefined || col === null ? "" : col
                );
                if (language === "ar") {
                    if (normalized.length === 1) {
                        wsData.push(["", "", normalized[0]]);
                        return;
                    }
                    if (normalized.length === 2) {
                        wsData.push(["", normalized[1], normalized[0]]);
                        return;
                    }
                    if (normalized.length === 3) {
                        wsData.push([normalized[2], normalized[1], normalized[0]]);
                        return;
                    }
                }
                wsData.push(normalized);
            };

            // Event Details section
            pushRow(t.logoUrl, eventInfo.logoUrl || "N/A");
            pushRow(t.eventName, eventInfo.name || "N/A");
            pushRow(t.exportedAt, formatDateTimeWithLocale(new Date()));
            if (eventInfo.startDate) pushRow(t.from, formatDateTimeForExcel(eventInfo.startDate));
            if (eventInfo.endDate) pushRow(t.to, formatDateTimeForExcel(eventInfo.endDate));
            if (eventInfo.venue) pushRow(t.venue, eventInfo.venue);
            pushRow(t.totalRegistrations, leftAlignNumber(eventInfo.registrations, 0));
            pushRow("Timezone", getTimezoneLabel(timezone));
            wsData.push([]);

            // Data sections for each selected field
            selectedFields.forEach((fieldName) => {
                const field = availableFields.find((f) => f.name === fieldName);
                const data = chartData[fieldName];

                if (!field || !data) return;

                pushRow(`=== ${field.label} ===`);

                if (data.chartType === "pie") {
                    const topN = getFieldParam(fieldName, "topN", 10);
                    pushRow(t.topN, formatCountValue(topN));
                    pushRow(t.category, t.count, t.percentage);

                    const total = data.data.reduce((sum, d) => sum + d.value, 0);
                    data.data.forEach((item) => {
                        const percentage = ((item.value / total) * 100).toFixed(2);
                        pushRow(toNumericIfPossible(item.label), formatCountValue(item.value), `${percentage}%`);
                    });
                } else if (data.chartType === "line") {
                    const startDateTime = getFieldParam(
                        fieldName,
                        "startDateTime",
                        dayjs().subtract(30, "day").startOf("day")
                    );
                    const endDateTime = getFieldParam(
                        fieldName,
                        "endDateTime",
                        dayjs().endOf("day")
                    );
                    const intervalMinutes = getFieldParam(fieldName, "intervalMinutes", 60);

                    pushRow(t.from, formatDateTimeForExcel(startDateTime));
                    pushRow(t.to, formatDateTimeForExcel(endDateTime));
                    pushRow(t.intervalMinutesFull, formatCountValue(intervalMinutes));
                    pushRow(t.timestamp, t.count);

                    data.xData.forEach((label, idx) => {
                        const formattedLabel = formatDateTimeForExcel(label);
                        pushRow(formattedLabel, formatCountValue(data.yData[idx]));
                    });
                }

                wsData.push([]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            if (language === "ar") {
                ws["!views"] = [{ rightToLeft: true }];
            }

            XLSX.utils.book_append_sheet(wb, ws, "Insights Data");
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${eventInfo.slug || "event"}_insights_raw_data.xlsx`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Raw data export failed:", error);
        }
        setExportRawLoading(false);
    };

    const handleGenerate = async (fieldName) => {
        setGeneratingFields((prev) => ({ ...prev, [fieldName]: true }));
        setAppliedParams((prev) => ({
            ...prev,
            [fieldName]: { ...fieldParams[fieldName] },
        }));

        setTimeout(() => {
            setGeneratingFields((prev) => ({ ...prev, [fieldName]: false }));
        }, 100);
    };

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
            <>
                <BreadcrumbsNav />

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    spacing={2}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                            {t.pageTitle}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            {t.pageDescription}
                        </Typography>
                    </Box>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        sx={{ width: { xs: "100%", sm: "auto" }, gap: { xs: 1, sm: 2 } }}
                    >
                        {selectedFields.length > 0 && (
                            <>
                                <Button
                                    variant="outlined"
                                    onClick={handleExportRawData}
                                    disabled={exportRawLoading}
                                    startIcon={
                                        exportRawLoading ? (
                                            <CircularProgress size={20} color="inherit" />
                                        ) : (
                                            <ICONS.download />
                                        )
                                    }
                                    sx={{
                                        whiteSpace: "nowrap",
                                        width: { xs: "100%", sm: "auto" },
                                        minWidth: { xs: "100%", sm: "fit-content" },
                                        py: 1,
                                        ...getStartIconSpacing(dir),
                                    }}
                                >
                                    {exportRawLoading ? t.exporting : t.exportRawData}
                                </Button>

                                <Button
                                    variant="contained"
                                    onClick={handleExportPDF}
                                    disabled={exportLoading}
                                    startIcon={
                                        exportLoading ? (
                                            <CircularProgress size={20} color="inherit" />
                                        ) : (
                                            <ICONS.download />
                                        )
                                    }
                                    sx={{
                                        whiteSpace: "nowrap",
                                        width: { xs: "100%", sm: "auto" },
                                        minWidth: { xs: "100%", sm: "fit-content" },
                                        py: 1,
                                        ...getStartIconSpacing(dir),
                                    }}
                                >
                                    {exportLoading ? t.exporting : t.exportInsights}
                                </Button>
                            </>
                        )}
                    </Stack>
                </Stack>

                <Divider sx={{ mb: 3 }} />
            </>

            {summary && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, flex: "1 1 500px" }}>
                        {[
                            { label: t.totalParticipants, value: summary.totalParticipants, color: "#0077b6" },
                            { label: t.totalActivityCompletions, value: summary.totalActivityCompletions, color: "#f59e0b" },
                            { label: t.avgActivities, value: summary.avgActivitiesPerParticipant, color: "#8b5cf6" },
                            eventInfo?.linkedEventRegId ? { label: t.scanRate, value: `${summary.scanRate}%`, color: "#10b981" } : null,
                        ].filter(Boolean).map(({ label, value, color }) => (
                            <AppCard
                                key={label}
                                sx={{
                                    p: 2,
                                    flex: "1 1 180px",
                                    minWidth: 160,
                                    textAlign: "center",
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    border: "1px solid #f1f5f9"
                                }}
                            >
                                <Typography variant="h4" fontWeight="bold" sx={{ color }}>
                                    {value}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                                    {label}
                                </Typography>
                            </AppCard>
                        ))}
                    </Box>
                </Box>
            )}

            <AppCard
                sx={{
                    flex: "0 0 auto",
                    p: { xs: 1, sm: 1.5, md: 2 },
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        fontWeight: 600,
                        color: "#374151",
                        mb: 1,
                    }}
                >
                    {t.availableFields}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        color: "text.secondary",
                        mb: 1.5,
                    }}
                >
                    {t.selectChipsPrompt}
                </Typography>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        flexWrap: "wrap",
                        gap: 1,
                        maxWidth: "100%",
                    }}
                >
                    {availableFields.map((field) => (
                        <FieldChip
                            key={field.name}
                            fieldKey={field.name}
                            field={field}
                            isSelected={selectedFields.includes(field.name)}
                            onClick={() => {
                                setSelectedFields((prev) =>
                                    prev.includes(field.name)
                                        ? prev.filter((f) => f !== field.name)
                                        : [...prev, field.name]
                                );
                            }}
                        />
                    ))}
                </Stack>
            </AppCard>

            <Stack
                spacing={2}
                sx={{ flex: "1 1 0%", overflow: "auto", minHeight: 0, pb: 2, px: 0.3 }}
            >
                {selectedFields.length === 0 ? (
                    <AppCard
                        sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 300
                        }}
                    >
                        <Box textAlign="center">
                            <BarChartIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
                            <Typography color="textSecondary">
                                {t.selectFieldPrompt}
                            </Typography>
                        </Box>
                    </AppCard>
                ) : (
                    selectedFields.map((fieldName) => (
                        <AppCard
                            key={fieldName}
                            sx={{ minHeight: "450px" }}
                        >
                            <ChartVisualization
                                selectedField={fieldName}
                                chartData={chartData}
                                chartType={chartVisualTypes[fieldName] || availableFields.find(af => af.name === fieldName)?.chartType}
                                onChartTypeChange={(type) => setChartVisualTypes(prev => ({ ...prev, [fieldName]: type }))}
                                segmentFields={fieldName === "activitiesPerParticipant" && eventInfo?.linkedEventRegId ? availableFields.filter(f => f.type !== "special" && f.type !== "time") : null}
                                selectedSegment={fieldSegments[fieldName]}
                                onSegmentChange={(segment) => {
                                    setFieldSegments(prev => ({ ...prev, [fieldName]: segment }));
                                    handleGenerate(fieldName);
                                }}
                                topN={getFieldParam(fieldName, "topN", 10)}
                                intervalMinutes={getFieldParam(
                                    fieldName,
                                    "intervalMinutes",
                                    60
                                )}
                                startDateTime={getFieldParam(
                                    fieldName,
                                    "startDateTime",
                                    dayjs().subtract(30, "day").startOf("day")
                                )}
                                endDateTime={getFieldParam(
                                    fieldName,
                                    "endDateTime",
                                    dayjs().endOf("day")
                                )}
                                onTopNChange={(val) => updateFieldParam(fieldName, "topN", val)}
                                onIntervalChange={(val) =>
                                    updateFieldParam(fieldName, "intervalMinutes", val)
                                }
                                onStartDateTimeChange={(val) =>
                                    updateFieldParam(
                                        fieldName,
                                        "startDateTime",
                                        val
                                            ? dayjs(val)
                                            : dayjs().subtract(30, "day").startOf("day")
                                    )
                                }
                                onEndDateTimeChange={(val) =>
                                    updateFieldParam(
                                        fieldName,
                                        "endDateTime",
                                        val ? dayjs(val) : dayjs().endOf("day")
                                    )
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
                        </AppCard>
                    ))
                )}
            </Stack>
        </Box>
    );
}
