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
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import {
    getAvailableQuestions,
    getQuestionDistribution,
    getTimeDistribution,
    getInsightsSummary,
} from "@/services/surveyguru/insightsService";
import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import { getPublicEventById } from "@/services/eventreg/eventService";
import ICONS from "@/utils/iconUtil";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import useI18nLayout from "@/hooks/useI18nLayout";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { exportChartsToPDF } from "@/components/badges/pdfExportCharts";
import { Button, CircularProgress } from "@mui/material";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

const translations = {
    en: {
        pageTitle: "Intelligent Insights",
        pageDescription:
            "Analyze survey responses and visualize key metrics through interactive charts and distributions.",
        availableQuestions: "Available Questions",
        selectQuestionPrompt: "Select a question to view insights",
        distributionOverview: "Distribution Overview",
        historicalTrend: "Historical Trend",
        from: "From",
        to: "To",
        intervalMinutes: "Interval (min)",
        generate: "Generate",
        generating: "Generating...",
        exportInsights: "Export Insights",
        exporting: "Exporting...",
        exportRawData: "Export Raw Data",
    },
    ar: {
        pageTitle: "تحليلات ذكية",
        pageDescription:
            "تحليل استجابات الاستطلاع وتصور المقاييس الرئيسية من خلال الرسوم البيانية والتوزيعات التفاعلية.",
        availableQuestions: "الأسئلة المتاحة",
        selectQuestionPrompt: "اختر سؤالاً لعرض التحليلات",
        distributionOverview: "نظرة عامة على التوزيع",
        historicalTrend: "الاتجاه التاريخي",
        from: "من",
        to: "إلى",
        intervalMinutes: "الفاصل الزمني (دقيقة)",
        generate: "إنشاء",
        generating: "جاري الإنشاء...",
        exportInsights: "تصدير التحليلات",
        exportRawData: "تصدير البيانات الأولية",
        exporting: "جاري التصدير...",
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

const getFieldTypeLabel = (field) => {
    if (!field) return "";
    const type = field.questionType || field.type;
    if (type === "time") return "";
    switch (type) {
        case "multi":
            return "MCQ";
        case "rating":
            return "Rating";
        case "nps":
            return "NPS";
        default:
            return "";
    }
};

dayjs.extend(utc);

const QuestionChip = ({ field, isSelected, onClick }) => {
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

const ChartVisualization = ({
    selectedField,
    chartData,
    onIntervalChange,
    onStartDateTimeChange,
    onEndDateTimeChange,
    onGenerate,
    startDateTime,
    endDateTime,
    intervalMinutes,
    isGenerating,
    t,
    onRefReady,
}) => {
    if (!selectedField || !chartData[selectedField]) {
        return null;
    }
    const { dir } = useI18nLayout();
    const field = chartData[selectedField];

    if (!field) return null;

    const getChartDescription = () => {
        if (field.chartType === "pie") return t.distributionOverview;
        return t.historicalTrend;
    };

    const showIntervalControl = field.type === "time";
    const showGenerateButton = showIntervalControl;
    const hasNoData =
        field.chartType === "pie" && (!field.data || field.data.length === 0);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                p: 2,
                width: "100%",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: `${field.color}15`,
                            borderRadius: 1,
                            p: 1,
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                        }}
                    >
                        <ICONS.insights />
                    </Box>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#1f2937" }}
                        >
                            {field.label}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                                {getChartDescription()}
                            </Typography>
                            {getFieldTypeLabel(field) && (
                                <>
                                    <Typography variant="caption" color="textSecondary">
                                        •
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {getFieldTypeLabel(field)}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        gap: 1.5,
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                    }}
                >
                    {showIntervalControl && (
                        <>
                            <DateTimePicker
                                label={t.from}
                                value={startDateTime}
                                onChange={(val) => onStartDateTimeChange(val)}
                                ampm={true}
                                format="DD/MM/YYYY hh:mm A"
                                slotProps={{
                                    textField: { size: "small", sx: { width: "200px" } },
                                }}
                                disabled={isGenerating}
                            />
                            <DateTimePicker
                                label={t.to}
                                value={endDateTime}
                                onChange={(val) => onEndDateTimeChange(val)}
                                ampm={true}
                                format="DD/MM/YYYY hh:mm A"
                                slotProps={{
                                    textField: { size: "small", sx: { width: "200px" } },
                                }}
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
                            sx={{
                                whiteSpace: "nowrap",
                                minWidth: "120px",
                                position: "relative",
                                ...getStartIconSpacing(dir),
                            }}
                        >
                            {isGenerating ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1,
                                    }}
                                >
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                        thickness={5}
                                        sx={{ mr: 0.5 }}
                                    />
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

            <Box
                ref={(el) => onRefReady && onRefReady(el)}
                sx={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {hasNoData ? (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                        }}
                    >
                        <Typography variant="body1" color="textSecondary">
                            No data to display
                        </Typography>
                    </Box>
                ) : field.chartType === "pie" ? (
                    <>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                gap: { xs: 2, md: 3 },
                                height: "100%",
                                alignItems: { xs: "center", md: "stretch" },
                            }}
                        >
                            <Box
                                sx={{
                                    flex: { xs: "0 0 auto", md: 1 },
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: { xs: "100%", md: "auto" },
                                    maxWidth: { xs: "400px", md: "none" },
                                }}
                            >
                                <PieChart
                                    series={[
                                        {
                                            data: field.data,
                                            highlightScope: { faded: "global", highlighted: "item" },
                                            faded: {
                                                innerRadius: 30,
                                                additionalRadius: -30,
                                                color: "gray",
                                            },
                                            arcLabel: () => "",
                                            valueFormatter: (item) => {
                                                const total = field.data.reduce(
                                                    (sum, d) => sum + d.value,
                                                    0
                                                );
                                                const percentage = ((item.value / total) * 100).toFixed(
                                                    1
                                                );
                                                return `${percentage}%`;
                                            },
                                        },
                                    ]}
                                    height={400}
                                    slotProps={{
                                        legend: {
                                            hidden: true,
                                            sx: { display: "none !important" },
                                        },
                                        pieArcLabel: {
                                            style: {
                                                fill: "white",
                                                fontWeight: 600,
                                                fontSize: "clamp(10px, 2vw, 14px)",
                                            },
                                        },
                                    }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    minWidth: { xs: "100%", md: "220px" },
                                    width: { xs: "100%", md: "auto" },
                                    overflow: "auto",
                                    pr: { xs: 0, md: 1 },
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: { xs: "center", md: "flex-start" },
                                }}
                            >
                                {field.data.map((item, idx) => {
                                    const total = field.data.reduce((sum, d) => sum + d.value, 0);
                                    const percentage = ((item.value / total) * 100).toFixed(1);
                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                mb: 1.5,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: "50%",
                                                    backgroundColor: item.color,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: "#1f2937",
                                                    whiteSpace: "nowrap",
                                                    fontSize: { xs: "0.875rem", md: "0.875rem" },
                                                }}
                                            >
                                                {item.label} {percentage}% ({item.value})
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    </>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: { xs: 2, md: 3 },
                        height: '100%',
                        alignItems: { xs: 'center', md: 'stretch' }
                    }}>
                        <Box sx={{
                            flex: { xs: '0 0 auto', md: 1 },
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: { xs: '100%', md: 'auto' },
                            maxWidth: { xs: '100%', md: 'none' }
                        }}>
                            <LineChart
                                xAxis={[{
                                    scaleType: 'point',
                                    data: field.xData,
                                    tickLabelStyle: {
                                        direction: 'ltr',
                                        textAlign: 'left',
                                    },
                                }]}
                                yAxis={[
                                    {
                                        min: 0,
                                        max: Math.max(...field.yData) + Math.ceil(Math.max(...field.yData) * 0.05),
                                        tickLabelStyle: {
                                            direction: 'ltr',
                                            textAlign: 'left',
                                        },
                                    }
                                ]}
                                series={[
                                    {
                                        data: field.yData,
                                        color: field.color,
                                        curve: 'linear'
                                    }
                                ]}
                                height={400}
                                margin={{ top: 30, bottom: 50, left: 50, right: 80 }}
                                slotProps={{
                                    legend: { hidden: true }
                                }}
                                sx={{
                                    '& .MuiMarkElement-root': {
                                        display: (d) => d.value === 0 ? 'none' : 'auto'
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{
                            minWidth: { xs: '100%', md: '220px' },
                            width: { xs: '100%', md: 'auto' },
                            overflow: 'auto',
                            pr: { xs: 0, md: 1 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: { xs: 'center', md: 'flex-start' }
                        }}>
                            {field.xData.map((label, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, direction: 'ltr' }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: field.color, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937', whiteSpace: 'nowrap', fontSize: { xs: '0.875rem', md: '0.875rem' }, direction: 'ltr', textAlign: 'left' }}>
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

export default function SurveyGuruInsightsPage() {
    const { slug } = useParams();
    const { t, dir } = useI18nLayout(translations);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [chartData, setChartData] = useState({});
    const [fieldParams, setFieldParams] = useState({});
    const [appliedParams, setAppliedParams] = useState({});
    const [generatingFields, setGeneratingFields] = useState({});
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartRefs, setChartRefs] = useState({});
    const [exportLoading, setExportLoading] = useState(false);
    const [exportRawLoading, setExportRawLoading] = useState(false);
    const [formInfo, setFormInfo] = useState(null);
    const [totalResponses, setTotalResponses] = useState(0);
    const [eventInfo, setEventInfo] = useState(null);

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
        const fetchQuestions = async () => {
            if (!slug) return;

            try {
                setLoading(true);
                const [questionsResponse, formResponse, summaryResponse] = await Promise.all([
                    getAvailableQuestions(slug),
                    getPublicFormBySlug(slug),
                    getInsightsSummary(slug),
                ]);

                const formData = formResponse?.data?.form || formResponse?.data || formResponse;
                setFormInfo(formData);

                // Fetch event information if eventId exists
                if (formData?.eventId) {
                    try {
                        const eventResponse = await getPublicEventById(formData.eventId);
                        const eventData = eventResponse?.data || eventResponse;
                        if (eventData) {
                            setEventInfo(eventData);
                        }
                    } catch (error) {
                        console.error("Error fetching event information:", error);
                    }
                }

                // Set total responses from summary
                if (summaryResponse?.data?.totalResponses !== undefined) {
                    setTotalResponses(summaryResponse.data.totalResponses);
                }

                const response = questionsResponse;

                const defaultParams = {};
                response.data.categoricalFields.forEach((f) => {
                    defaultParams[f.name] = {};
                });
                response.data.timeFields.forEach((f) => {
                    defaultParams[f.name] = {
                        intervalMinutes: 60,
                        startDateTime: dayjs().subtract(30, "day").startOf("day"),
                        endDateTime: dayjs().endOf("day"),
                    };
                });

                setFieldParams(defaultParams);
                setAppliedParams(defaultParams);

                const allFields = [
                    ...response.data.categoricalFields.map((f) => ({
                        ...f,
                        chartType: determineChartType(f),
                        color: FIELD_COLOR,
                    })),
                    ...response.data.timeFields.map((f) => ({
                        ...f,
                        chartType: "line",
                        color: FIELD_COLOR,
                    })),
                ];

                setAvailableQuestions(allFields);
            } catch (error) {
                console.error("Error loading questions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [slug]);

    useEffect(() => {
        const fetchChartData = async () => {
            if (
                selectedQuestions.length === 0 ||
                !slug ||
                availableQuestions.length === 0
            )
                return;

            for (const questionId of selectedQuestions) {
                const field = availableQuestions.find((f) => f.name === questionId);
                if (!field) continue;

                const appliedFieldParams = appliedParams[questionId];
                if (!appliedFieldParams) continue;

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
                            slug,
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
                            [questionId]: { ...field, xData, yData },
                        }));
                    } else {
                        response = await getQuestionDistribution(
                            slug,
                            questionId
                        );

                        const data = response.data.data.map((item, idx) => ({
                            id: idx,
                            value: item.value,
                            label: item.label,
                            color: getPieSegmentColor(idx),
                        }));

                        setChartData((prev) => ({
                            ...prev,
                            [questionId]: { ...field, data },
                        }));
                    }
                } catch (error) {
                    console.error(`Error loading chart data for ${questionId}:`, error);
                }
            }
        };

        fetchChartData();
    }, [selectedQuestions, slug, availableQuestions, appliedParams]);

    const handleExportPDF = async () => {
        if (selectedQuestions.length === 0) return;

        setExportLoading(true);
        try {
            // Fetch event info if not already loaded and formInfo has eventId
            let currentEventInfo = eventInfo;
            if (!currentEventInfo && formInfo?.eventId) {
                try {
                    const eventResponse = await getPublicEventById(formInfo.eventId);
                    currentEventInfo = eventResponse?.data || eventResponse;
                    if (currentEventInfo) {
                        setEventInfo(currentEventInfo);
                    }
                } catch (error) {
                    console.error("Error fetching event information:", error);
                    // Continue without event info if fetch fails
                }
            }

            const refs = selectedQuestions
                .map((questionId) => chartRefs[questionId])
                .filter(Boolean);

            if (refs.length === 0) {
                console.error("No chart references found");
                setExportLoading(false);
                return;
            }

            const labels = selectedQuestions.map((questionId) => {
                const field = availableQuestions.find((f) => f.name === questionId);
                return field?.label || questionId;
            });

            const chartDataArray = selectedQuestions.map((questionId) => {
                const data = chartData[questionId];
                return {
                    ...data,
                    intervalMinutes: getFieldParam(questionId, "intervalMinutes", 60),
                    startDateTime: getFieldParam(
                        questionId,
                        "startDateTime",
                        dayjs().subtract(30, "day").startOf("day")
                    ).toDate(),
                    endDateTime: getFieldParam(
                        questionId,
                        "endDateTime",
                        dayjs().endOf("day")
                    ).toDate(),
                    legend: false,
                };
            });

            // Prepare survey info for PDF export
            const surveyInfo = {
                title: formInfo?.title || null,
                description: formInfo?.description || null,
                totalResponses: totalResponses || 0,
            };

            // Use eventInfo if available, otherwise fallback to formInfo
            const eventDataForExport = currentEventInfo || formInfo || {};

            await exportChartsToPDF(refs, labels, chartDataArray, eventDataForExport, surveyInfo);
        } catch (error) {
            console.error("PDF export failed:", error);
            alert("Failed to export PDF. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    const handleExportRawData = async () => {
        if (selectedQuestions.length === 0 || !formInfo) return;

        setExportRawLoading(true);
        try {
            // Fetch event info if not already loaded and formInfo has eventId
            let currentEventInfo = eventInfo;
            if (!currentEventInfo && formInfo?.eventId) {
                try {
                    const eventResponse = await getPublicEventById(formInfo.eventId);
                    currentEventInfo = eventResponse?.data || eventResponse;
                    if (currentEventInfo) {
                        setEventInfo(currentEventInfo);
                    }
                } catch (error) {
                    console.error("Error fetching event information:", error);
                }
            }

            const lines = [];
            const formatDateTimeForCSV = (dateString) => {
                return dayjs(dateString).format('DD-MMM-YY, hh:mm a');
            };

            // Event Details section (same format as eventreg)
            if (currentEventInfo) {
                lines.push([`Logo URL:`, currentEventInfo.logoUrl || `N/A`].join(`,`));
                lines.push([`Event Name:`, currentEventInfo.name || `N/A`].join(`,`));
                lines.push([`From:`, currentEventInfo.startDate ? `"${formatDateTimeForCSV(currentEventInfo.startDate)}"` : `N/A`].join(`,`));
                lines.push([`To:`, currentEventInfo.endDate ? `"${formatDateTimeForCSV(currentEventInfo.endDate)}"` : `N/A`].join(`,`));
                lines.push([`Venue:`, currentEventInfo.venue || `N/A`].join(`,`));
                lines.push([`Total Registrations:`, `\t${currentEventInfo.registrations || 0}`].join(`,`));
            }

            // Survey Details section
            lines.push([`Title of survey:`, formInfo.title || `N/A`].join(`,`));
            lines.push([`Description:`, formInfo.description || `N/A`].join(`,`));
            lines.push([`Total Responses:`, `\t${totalResponses || 0}`].join(`,`));
            lines.push([]);

            // Data sections for each selected question
            selectedQuestions.forEach((questionId) => {
                const field = availableQuestions.find((f) => f.name === questionId);
                const data = chartData[questionId];

                if (!field || !data) return;

                lines.push([`=== ${field.label} ===`]);
                const fieldTypeLabel = getFieldTypeLabel(field);
                if (fieldTypeLabel) {
                    lines.push([`Type:`, fieldTypeLabel].join(`,`));
                }

                if (data.chartType === "pie") {
                    lines.push([`Value`, `Count`, `Percentage`].join(`,`));

                    const total = data.data.reduce((sum, d) => sum + d.value, 0);
                    data.data.forEach((item) => {
                        const percentage = ((item.value / total) * 100).toFixed(2);
                        const labelValue = item.label.replace(/"/g, `""`);
                        const formattedLabel = /^\d+$/.test(labelValue) ? `\t${labelValue}` : `"${labelValue}"`;
                        lines.push([
                            formattedLabel,
                            `\t${item.value}`,
                            `\t${percentage}%`,
                        ].join(`,`));
                    });
                } else if (data.chartType === "line") {
                    const startDateTime = getFieldParam(
                        questionId,
                        "startDateTime",
                        dayjs().subtract(30, "day").startOf("day")
                    );
                    const endDateTime = getFieldParam(
                        questionId,
                        "endDateTime",
                        dayjs().endOf("day")
                    );
                    const intervalMinutes = getFieldParam(questionId, "intervalMinutes", 60);

                    const formatDateTimeForCSV = (dateTime) => {
                        return dayjs(dateTime).format('DD-MMM-YY, hh:mm a');
                    };

                    lines.push([`From:`, `"${formatDateTimeForCSV(startDateTime)}"`].join(`,`));
                    lines.push([`To:`, `"${formatDateTimeForCSV(endDateTime)}"`].join(`,`));
                    lines.push([`Interval (minutes):`, `\t${intervalMinutes}`].join(`,`));
                    lines.push([`Timestamp`, `Count`].join(`,`));

                    data.xData.forEach((label, idx) => {
                        const formattedLabel = formatDateTimeForCSV(label);
                        lines.push([
                            `"${formattedLabel}"`,
                            `\t${data.yData[idx]}`,
                        ].join(`,`));
                    });
                }

                lines.push([]);
            });

            // Generate and download CSV
            const csvContent = `\uFEFF` + lines.join(`\n`);
            const blob = new Blob([csvContent], { type: `text/csv;charset=utf-8;` });
            const link = document.createElement(`a`);
            link.href = URL.createObjectURL(blob);
            link.download = `${formInfo.slug || `form`}_insights_raw_data.csv`;
            link.click();
        } catch (error) {
            console.error("Raw data export failed:", error);
        }
        setExportRawLoading(false);
    };

    const handleGenerate = async (questionId) => {
        setGeneratingFields((prev) => ({ ...prev, [questionId]: true }));
        setAppliedParams((prev) => ({
            ...prev,
            [questionId]: { ...fieldParams[questionId] },
        }));

        setTimeout(() => {
            setGeneratingFields((prev) => ({ ...prev, [questionId]: false }));
        }, 100);
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
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
                        {selectedQuestions.length > 0 && (
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

            <Paper
                sx={{
                    flex: "0 0 auto",
                    p: { xs: 1, sm: 1.5, md: 2 },
                    borderRadius: 2,
                    boxShadow: 2,
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
                    {t.availableQuestions}
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
                    {availableQuestions.map((field) => (
                        <QuestionChip
                            key={field.name}
                            fieldKey={field.name}
                            field={field}
                            isSelected={selectedQuestions.includes(field.name)}
                            onClick={() => {
                                setSelectedQuestions((prev) =>
                                    prev.includes(field.name)
                                        ? prev.filter((f) => f !== field.name)
                                        : [...prev, field.name]
                                );
                            }}
                        />
                    ))}
                </Stack>
            </Paper>

            <Stack
                spacing={2}
                sx={{ flex: "1 1 0%", overflow: "auto", minHeight: 0, pb: 2, px: 0.3 }}
            >
                {selectedQuestions.length === 0 ? (
                    <Paper
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                            boxShadow: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Box textAlign="center">
                            <BarChartIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
                            <Typography color="textSecondary">
                                {t.selectQuestionPrompt}
                            </Typography>
                        </Box>
                    </Paper>
                ) : (
                    selectedQuestions.map((questionId) => (
                        <Paper
                            key={questionId}
                            sx={{ borderRadius: 2, boxShadow: 2, minHeight: "450px" }}
                        >
                            <ChartVisualization
                                selectedField={questionId}
                                chartData={chartData}
                                intervalMinutes={getFieldParam(
                                    questionId,
                                    "intervalMinutes",
                                    60
                                )}
                                startDateTime={getFieldParam(
                                    questionId,
                                    "startDateTime",
                                    dayjs().subtract(30, "day").startOf("day")
                                )}
                                endDateTime={getFieldParam(
                                    questionId,
                                    "endDateTime",
                                    dayjs().endOf("day")
                                )}
                                onIntervalChange={(val) =>
                                    updateFieldParam(questionId, "intervalMinutes", val)
                                }
                                onStartDateTimeChange={(val) =>
                                    updateFieldParam(
                                        questionId,
                                        "startDateTime",
                                        val
                                            ? dayjs(val)
                                            : dayjs().subtract(30, "day").startOf("day")
                                    )
                                }
                                onEndDateTimeChange={(val) =>
                                    updateFieldParam(
                                        questionId,
                                        "endDateTime",
                                        val ? dayjs(val) : dayjs().endOf("day")
                                    )
                                }
                                onGenerate={() => handleGenerate(questionId)}
                                isGenerating={generatingFields[questionId] || false}
                                onRefReady={(el) => {
                                    if (el && chartRefs[questionId] !== el) {
                                        setChartRefs((prev) => ({ ...prev, [questionId]: el }));
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

