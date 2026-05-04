"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    TextField,
    Typography,
    Chip,
    Stack,
    Divider,
    CircularProgress,
    Paper,
    Button,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import {
    getAvailableQuestions,
    getQuestionDistribution,
    getTimeDistribution,
    getSegmentedDistribution,
    getInsightsSummary,
} from "@/services/surveyguru/insightsService";
import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import { getPublicEventById } from "@/services/eventreg/eventService";
import ICONS from "@/utils/iconUtil";
import ChartVisualization from "@/components/insights/ChartVisualization";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import AppCard from "@/components/cards/AppCard";
import useI18nLayout from "@/hooks/useI18nLayout";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ar";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { exportChartsToPDF } from "@/components/badges/pdfExportCharts";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale, formatDateWithShortMonth } from "@/utils/dateUtils";
import * as XLSX from "xlsx";
import { translateTexts } from "@/services/translationService";
import { toArabicDigits } from "@/utils/arabicDigits";

const translations = {
    en: {
        pageTitle: "Intelligent Insights",
        pageDescription:
            "Analyze survey responses and visualize key metrics through interactive charts and distributions.",
        availableQuestions: "Available Questions",
        selectChipsPrompt: "Select the chips to see the charts",
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
        venue: "Venue",
        registrations: "Registrations",
        type: "Type",
        page: "Page",
        of: "of",
        rating: "Rating",
        titleOfSurvey: "Title of survey",
        description: "Description",
        totalResponses: "Total Responses",
        logoUrl: "Logo URL",
        eventName: "Event Name",
        category: "Category",
        count: "Count",
        percentage: "Percentage",
        value: "Value",
        intervalMinutesFull: "Interval (minutes)",
        timestamp: "Timestamp",
        totalRegistrations: "Total Registrations",
        segmentedBy: "Segmented By",
        exportedAt: "Exported At",
    },
    ar: {
        pageTitle: "تحليلات ذكية",
        pageDescription:
            "تحليل استجابات الاستطلاع وتصور المقاييس الرئيسية من خلال الرسوم البيانية والتوزيعات التفاعلية.",
        availableQuestions: "الأسئلة المتاحة",
        selectChipsPrompt: "اختر الشرائح لعرض الرسوم البيانية",
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
        venue: "الموقع",
        registrations: "التسجيلات",
        type: "النوع",
        page: "صفحة",
        of: "من",
        rating: "التقييم",
        titleOfSurvey: "عنوان الاستطلاع",
        description: "الوصف",
        totalResponses: "إجمالي الردود",
        logoUrl: "رابط الشعار",
        eventName: "اسم الحدث",
        category: "الفئة",
        count: "العدد",
        percentage: "النسبة المئوية",
        value: "القيمة",
        intervalMinutesFull: "الفاصل الزمني (بالدقائق)",
        timestamp: "الطابع الزمني",
        totalRegistrations: "إجمالي التسجيلات",
        segmentedBy: "مقسم حسب",
        exportedAt: "تاريخ التصدير",
    },
};

const FIELD_COLOR = "#0077b6";

// Format percentage with % sign on the right (even in RTL)
const formatPercentage = (value, language) => {
    const percentage = typeof value === "number" ? value.toFixed(1) : String(value);
    if (language === "ar") {
        const arabicDigits = toArabicDigits(percentage, language);
        return `\u202D${arabicDigits}%\u202C`;
    }
    return `${percentage}%`;
};

// Custom format function for DateTimePicker that converts digits to Arabic and AM/PM to ص/م
const formatDateForPicker = (date, formatString, language) => {
    if (!date) return "";
    const formatted = date.format(formatString);
    if (language === "ar") {
        let arabicFormatted = toArabicDigits(formatted, language);
        arabicFormatted = arabicFormatted.replace(/\bAM\b/gi, "ص");
        arabicFormatted = arabicFormatted.replace(/\bPM\b/gi, "م");
        return arabicFormatted;
    }
    return formatted;
};

//  format function for DateTimePicker that returns Arabic formatted date
const createArabicFormatFunction = (language) => {
    return (date) => {
        if (!date) return "";
        return formatDateForPicker(date, "DD/MM/YYYY hh:mm A", language);
    };
};

dayjs.extend(utc);

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

const determineChartType = (field, currentType) => {
    if (currentType) return currentType;
    if (!field) return "bar";
    if (field.isSegmented) {
        if (field.type === "rating" || field.type === "nps") return "average";
        return "bar";
    }
    if (field.type === "time") return "line";
    return "pie";
};


dayjs.extend(utc);

const QuestionChip = ({ field, translatedLabel, isSelected, onClick }) => {
    return (
        <Chip
            label={translatedLabel || field.label}
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


export default function SurveyGuruInsightsPage() {
    const { slug } = useParams();
    const { t, dir, language } = useI18nLayout(translations);

    useEffect(() => {
        if (language === "ar") {
            dayjs.locale("ar");
        } else {
            dayjs.locale("en");
        }
    }, [language]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [chartData, setChartData] = useState({});
    const [fieldParams, setFieldParams] = useState({});
    const [appliedParams, setAppliedParams] = useState({});
    const [generatingFields, setGeneratingFields] = useState({});
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const chartRefs = useRef({});
    const [exportLoading, setExportLoading] = useState(false);
    const [exportRawLoading, setExportRawLoading] = useState(false);
    const [formInfo, setFormInfo] = useState(null);
    const [totalResponses, setTotalResponses] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [eventInfo, setEventInfo] = useState(null);
    const [translatedQuestions, setTranslatedQuestions] = useState([]);
    const [translatedChartData, setTranslatedChartData] = useState({});
    const [translatedEventInfo, setTranslatedEventInfo] = useState(null);
    const [translatedFormInfo, setTranslatedFormInfo] = useState(null);
    const [registrationFields, setRegistrationFields] = useState([]);
    const [selectedRegistrationField, setSelectedRegistrationField] = useState(null);

    useEffect(() => {
        if (selectedQuestions.length > 0 && selectedRegistrationField) {
            const hasInvalidQuestion = selectedQuestions.some(qId => {
                const field = availableQuestions.find(f => f.name === qId);
                return !field || field.type === "text";
            });
            if (hasInvalidQuestion) {
                setSelectedRegistrationField(null);
            }
        }
    }, [selectedQuestions, availableQuestions, selectedRegistrationField]);

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

                if (questionsResponse?.error) {
                    console.error("Error fetching questions:", questionsResponse.message);
                    setAvailableQuestions([]);
                    setLoading(false);
                    return;
                }

                const responseData = questionsResponse?.data || questionsResponse;
                if (!responseData || !responseData.categoricalFields) {
                    console.error("Unexpected questions response structure:", questionsResponse);
                    setAvailableQuestions([]);
                    setLoading(false);
                    return;
                }

                if (responseData.totalQuestions !== undefined) {
                    setTotalQuestions(responseData.totalQuestions);
                }

                const defaultParams = {};
                responseData.categoricalFields.forEach((f) => {
                    defaultParams[f.name] = {};
                });
                responseData.timeFields?.forEach((f) => {
                    defaultParams[f.name] = {
                        intervalMinutes: 60,
                        startDateTime: dayjs().subtract(30, "day").startOf("day"),
                        endDateTime: dayjs().endOf("day"),
                    };
                });

                setFieldParams(defaultParams);
                setAppliedParams(defaultParams);

                const registrationFieldsData = responseData.registrationFields || [];
                const allFields = [
                    ...responseData.categoricalFields.map((f) => ({
                        ...f,
                        chartType: f.isRegistrationField ? "pie" : determineChartType(f),
                        allowedChartTypes: f.type === "time" ? ["line", "bar", "horizontalBar", "heatmap"] : ["pie", "bar", "horizontalBar"],
                        color: FIELD_COLOR,
                    })),
                    ...(responseData.timeFields || []).map((f) => ({
                        ...f,
                        chartType: "line",
                        allowedChartTypes: ["line", "bar", "horizontalBar", "heatmap"],
                        color: FIELD_COLOR,
                    })),
                ];

                setAvailableQuestions(allFields);
                setRegistrationFields(registrationFieldsData);
            } catch (error) {
                console.error("Error loading questions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [slug]);

    // Re-translate when language changes
    useEffect(() => {
        if (!availableQuestions.length) return;

        const translateQuestions = async () => {
            try {
                if (language === "ar") {
                    const textsToTranslate = availableQuestions.map((f) => f.label || "");
                    const translatedLabels = await translateTexts(textsToTranslate, language);

                    const translated = availableQuestions.map((f, idx) => ({
                        ...f,
                        label: toArabicDigits(translatedLabels[idx] || f.label, language),
                    }));

                    setTranslatedQuestions(translated);
                } else {
                    setTranslatedQuestions(availableQuestions);
                }
            } catch (error) {
                console.error("Error translating questions:", error);
                setTranslatedQuestions(availableQuestions);
            }
        };

        translateQuestions();
    }, [language, availableQuestions]);

    // Re-translate form and event info when language changes
    useEffect(() => {
        if (!formInfo) return;

        const translateFormInfo = async () => {
            try {
                if (language === "ar") {
                    const textsToTranslate = [
                        formInfo.title || "",
                        formInfo.description || "",
                    ].filter(Boolean);

                    if (textsToTranslate.length > 0) {
                        const translated = await translateTexts(textsToTranslate, language);
                        setTranslatedFormInfo({
                            ...formInfo,
                            title: toArabicDigits(translated[0] || formInfo.title, language),
                            description: toArabicDigits(translated[1] || formInfo.description, language),
                        });
                    } else {
                        setTranslatedFormInfo(formInfo);
                    }
                } else {
                    setTranslatedFormInfo(formInfo);
                }
            } catch (error) {
                console.error("Error translating form info:", error);
                setTranslatedFormInfo(formInfo);
            }
        };

        translateFormInfo();
    }, [language, formInfo]);

    useEffect(() => {
        if (!eventInfo) return;

        const translateEventInfo = async () => {
            try {
                if (language === "ar") {
                    const textsToTranslate = [
                        eventInfo.name || "",
                        eventInfo.venue || "",
                        eventInfo.description || "",
                    ].filter(Boolean);

                    if (textsToTranslate.length > 0) {
                        const translated = await translateTexts(textsToTranslate, language);
                        setTranslatedEventInfo({
                            ...eventInfo,
                            name: toArabicDigits(translated[0] || eventInfo.name, language),
                            venue: toArabicDigits(translated[1] || eventInfo.venue, language),
                            description: toArabicDigits(translated[2] || eventInfo.description, language),
                        });
                    } else {
                        setTranslatedEventInfo(eventInfo);
                    }
                } else {
                    setTranslatedEventInfo(eventInfo);
                }
            } catch (error) {
                console.error("Error translating event info:", error);
                setTranslatedEventInfo(eventInfo);
            }
        };

        translateEventInfo();
    }, [language, eventInfo]);

    // Re-translate chart data option labels when language changes
    useEffect(() => {
        if (Object.keys(chartData).length === 0) return;

        const reTranslateChartData = async () => {
            if (language !== "ar") {
                setTranslatedChartData(chartData);
                return;
            }

            try {
                const updated = {};
                for (const questionId of Object.keys(chartData)) {
                    const data = chartData[questionId];
                    if (data.chartType === "pie" && data.data && data.data.length > 0) {
                        const labelsToTranslate = data.data.map((item) => item.label || "");
                        const translatedLabels = await translateTexts(labelsToTranslate, language);

                        const translatedData = data.data.map((item, idx) => ({
                            ...item,
                            label: toArabicDigits(translatedLabels[idx] || item.label, language),
                        }));

                        updated[questionId] = { ...data, data: translatedData };
                    } else if (data.chartType === "line") {
                        const field = availableQuestions.find((f) => f.name === questionId);
                        if (field && data.xData) {
                            updated[questionId] = data;
                        } else {
                            updated[questionId] = data;
                        }
                    } else {
                        updated[questionId] = data;
                    }
                }
                setTranslatedChartData(updated);
            } catch (error) {
                console.error("Error re-translating chart data:", error);
                setTranslatedChartData(chartData);
            }
        };

        reTranslateChartData();
    }, [language, chartData, availableQuestions]);

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
                            formatDateTimeWithLocale(d.timestamp, language === "ar" ? "ar-SA" : "en-GB")
                        );
                        const yData = filteredData.map((d) => d.count);

                        setChartData((prev) => ({
                            ...prev,
                            [questionId]: { ...field, xData, yData },
                        }));

                        setTranslatedChartData((prev) => ({
                            ...prev,
                            [questionId]: { ...field, xData, yData },
                        }));
                    } else {
                        if (selectedRegistrationField && !field.isRegistrationField) {
                            response = await getSegmentedDistribution(
                                slug,
                                questionId,
                                selectedRegistrationField
                            );

                            if (response?.error || !response?.data?.data) {
                                console.error(`Error loading segmented data for ${questionId}:`, response?.message);
                                continue;
                            }

                            const results = response.data.data;
                            let segmentedData;
                            const xAxis = results.map(r => r.segment);
                            
                            // Extract all possible answer labels across all segments
                            const allLabelsSet = new Set();
                            results.forEach(r => {
                                (r.distribution || []).forEach(d => allLabelsSet.add(d.label));
                            });
                            
                            let allLabels = Array.from(allLabelsSet);
                            
                            // For numeric questions (rating/nps), sort labels numerically
                            if (field.type === "rating" || field.type === "nps") {
                                allLabels.sort((a, b) => parseFloat(a) - parseFloat(b));
                            }

                            const series = allLabels.map((label, idx) => ({
                                label,
                                data: results.map(r => {
                                    const dist = (r.distribution || []).find(d => d.label === label);
                                    return dist ? dist.value : 0;
                                }),
                                color: getPieSegmentColor(idx)
                            }));

                            segmentedData = { xAxis, series };

                            const aggregateDist = new Map();
                            results.forEach(r => {
                                (r.distribution || []).forEach(d => {
                                    aggregateDist.set(d.label, (aggregateDist.get(d.label) || 0) + d.value);
                                });
                            });
                            const totalData = Array.from(aggregateDist.entries()).map(([label, value], idx) => ({
                                label, value, color: getPieSegmentColor(idx)
                            }));

                            const selectedRegFieldLabel = registrationFields.find(f => f.name === selectedRegistrationField)?.label || selectedRegistrationField;

                            setChartData((prev) => ({
                                ...prev,
                                [questionId]: { 
                                    ...field, 
                                    isSegmented: true,
                                    segmentedBy: selectedRegFieldLabel,
                                    segmentedData,
                                    data: totalData,
                                    averages: results.map(r => ({ segment: r.segment, average: r.average }))
                                },
                            }));

                            setTranslatedChartData((prev) => ({
                                ...prev,
                                [questionId]: { 
                                    ...field, 
                                    isSegmented: true,
                                    segmentedBy: selectedRegFieldLabel,
                                    segmentedData,
                                    averages: results.map(r => ({ segment: r.segment, average: r.average }))
                                },
                            }));
                        } else {
                            response = await getQuestionDistribution(
                                slug,
                                questionId
                            );

                            if (response?.error || !response?.data?.data) {
                                console.error(`Error loading distribution data for ${questionId}:`, response?.message);
                                continue;
                            }

                            const data = response.data.data.map((item, idx) => ({
                                id: idx,
                                value: item.value,
                                label: item.label,
                                color: getPieSegmentColor(idx),
                            }));

                            setChartData((prev) => ({
                                ...prev,
                                [questionId]: { ...field, data, isSegmented: false },
                            }));

                            setTranslatedChartData((prev) => ({
                                ...prev,
                                [questionId]: { ...field, data, isSegmented: false },
                            }));

                            const translateOptionLabels = async () => {
                                try {
                                    if (language === "ar" && data.length > 0) {
                                        const labelsToTranslate = data.map((item) => item.label || "");
                                        const translatedLabels = await translateTexts(labelsToTranslate, language);

                                        const translatedData = data.map((item, idx) => ({
                                            ...item,
                                            label: toArabicDigits(translatedLabels[idx] || item.label, language),
                                        }));

                                        setTranslatedChartData((prev) => ({
                                            ...prev,
                                            [questionId]: { ...field, data: translatedData, isSegmented: false },
                                        }));
                                    } else {
                                        setTranslatedChartData((prev) => ({
                                            ...prev,
                                            [questionId]: { ...field, data, isSegmented: false },
                                        }));
                                    }
                                } catch (error) {
                                    console.error("Error translating option labels:", error);
                                    setTranslatedChartData((prev) => ({
                                        ...prev,
                                        [questionId]: { ...field, data, isSegmented: false },
                                    }));
                                }
                            };
                            translateOptionLabels();
                        }
                    }
                } catch (error) {
                    console.error(`Error loading chart data for ${questionId}:`, error);
                }
            }
        };

        fetchChartData();
    }, [selectedQuestions, slug, availableQuestions, appliedParams, language, selectedRegistrationField]);

    const handleExportPDF = async () => {
        if (selectedQuestions.length === 0) return;

        setExportLoading(true);
        try {
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

            const refs = selectedQuestions
                .map((questionId) => chartRefs.current[questionId])
                .filter(Boolean);

            if (refs.length === 0) {
                console.error("No chart references found");
                setExportLoading(false);
                return;
            }

            const questionsToUse = translatedQuestions.length > 0 ? translatedQuestions : availableQuestions;
            const labels = selectedQuestions.map((questionId) => {
                const field = questionsToUse.find((f) => f.name === questionId);
                return field?.label || questionId;
            });

            const chartDataToUse = Object.keys(translatedChartData).length > 0 ? translatedChartData : chartData;
            const chartDataArray = selectedQuestions.map((questionId) => {
                const data = chartDataToUse[questionId] || chartData[questionId];
                const activeType = getFieldParam(questionId, "chartType", data.type === "time" ? "line" : "pie");
                
                return {
                    ...data,
                    chartType: activeType,
                    fieldName: selectedRegistrationField,
                    intervalMinutes: getFieldParam(questionId, "intervalMinutes", 60),
                    startDateTime: getFieldParam(questionId, "startDateTime", dayjs().subtract(30, "day").startOf("day")).toDate(),
                    endDateTime: getFieldParam(questionId, "endDateTime", dayjs().endOf("day")).toDate(),
                    legend: false,
                };
            });

            const eventDataForExport = {
                name: currentEventInfo?.name || formInfo?.title || "Survey Insights",
                logoUrl: currentEventInfo?.logoUrl || undefined,
                subtitle: currentEventInfo?.name ? formInfo?.title : undefined,
                subtitleLabel: "Survey",
                startDateFormatted: currentEventInfo?.startDate ? dayjs(currentEventInfo.startDate).format("DD-MMM-YY, hh:mm a") : undefined,
                endDateFormatted: currentEventInfo?.endDate ? dayjs(currentEventInfo.endDate).format("DD-MMM-YY, hh:mm a") : undefined,
                venue: currentEventInfo?.venue || "N/A",
                summaryCards: [
                    { label: t.totalResponses, value: totalResponses, color: "#0077b6" },
                    formInfo?.isAnonymous === false && eventInfo?.registrations ? {
                        label: "Response Rate",
                        value: `${((totalResponses / eventInfo.registrations) * 100).toFixed(1)}%`,
                        color: "#10b981"
                    } : null,
                    { label: "Questions", value: totalQuestions || availableQuestions.filter(q => q.isSurveyQuestion).length, color: "#f59e0b" },
                ].filter(Boolean)
            };

            await exportChartsToPDF(
                refs,
                labels,
                chartDataArray,
                eventDataForExport,
                null,
                language,
                dir,
                t,
                Intl.DateTimeFormat().resolvedOptions().timeZone
            );
        } catch (error) {
            console.error("PDF export failed:", error);
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
                const strVal = String(val);
                return language === "ar" ? toArabicDigits(strVal, language) : strVal;
            };
            const leftAlignNumber = (value, fallback = 0) => {
                const resolved = value !== undefined && value !== null ? value : fallback;
                const strVal = `${resolved}`;
                return language === "ar" ? toArabicDigits(strVal, language) : strVal;
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

            const eventInfoToUse = translatedEventInfo || currentEventInfo;
            const formInfoToUse = translatedFormInfo || formInfo;
            const questionsToUse = translatedQuestions.length > 0 ? translatedQuestions : availableQuestions;
            const chartDataToUse = Object.keys(translatedChartData).length > 0 ? translatedChartData : chartData;

            // Event Details section (same format as eventreg)
            if (eventInfoToUse) {
                pushRow(t.logoUrl, eventInfoToUse.logoUrl || "N/A");
                pushRow(t.eventName, eventInfoToUse.name || "N/A");
                pushRow(t.exportedAt, formatDateTimeWithLocale(new Date()));
                pushRow(t.from, eventInfoToUse.startDate ? formatDateTimeForExcel(eventInfoToUse.startDate) : "N/A");
                pushRow(t.to, eventInfoToUse.endDate ? formatDateTimeForExcel(eventInfoToUse.endDate) : "N/A");
                pushRow(t.venue, eventInfoToUse.venue || "N/A");
                pushRow(t.totalRegistrations, leftAlignNumber(eventInfoToUse.registrations, 0));
            }

            // Survey Details section
            pushRow(t.titleOfSurvey, formInfoToUse.title || "N/A");
            pushRow(t.description, formInfoToUse.description || "N/A");
            pushRow(t.totalResponses, leftAlignNumber(totalResponses, 0));
            pushRow("Timezone", getTimezoneLabel(timezone));
            wsData.push([]);

            const getFieldTypeLabel = (field) => {
                const typeMap = { rating: t.rating || "Rating", nps: "NPS", time: "Time", text: "Text" };
                return field?.type ? (typeMap[field.type] || field.type) : null;
            };

            // Data sections for each selected question
            selectedQuestions.forEach((questionId) => {
                const field = questionsToUse.find((f) => f.name === questionId);
                const data = chartDataToUse[questionId] || chartData[questionId];

                if (!field || !data) return;

                pushRow(`=== ${field.label} ===`);
                const fieldTypeLabel = getFieldTypeLabel(field);
                if (fieldTypeLabel) {
                    pushRow(t.type, fieldTypeLabel);
                }

                if (data.chartType === "pie") {
                    pushRow(t.value, t.count, t.percentage);

                    const total = data.data.reduce((sum, d) => sum + d.value, 0);
                    data.data.forEach((item) => {
                        const percentage = ((item.value / total) * 100).toFixed(2);
                        const percentageStr = language === "ar"
                            ? toArabicDigits(percentage, language) + "%"
                            : `${percentage}%`;
                        pushRow(toNumericIfPossible(item.label), formatCountValue(item.value), percentageStr);
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

                    pushRow(t.from, formatDateTimeForExcel(startDateTime.format()));
                    pushRow(t.to, formatDateTimeForExcel(endDateTime.format()));
                    pushRow(t.intervalMinutesFull, formatCountValue(intervalMinutes));
                    pushRow(t.timestamp, t.count);

                    data.xData.forEach((label, idx) => {

                        const formattedLabel = label;
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
            link.download = `${formInfo.slug || "form"}_insights_raw_data.xlsx`;
            link.click();
            URL.revokeObjectURL(link.href);
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

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} sx={{ width: { xs: "100%", sm: "auto" } }}>
                    {selectedQuestions.length > 0 && (
                        <>
                            <Button
                                variant="outlined"
                                onClick={handleExportRawData}
                                disabled={exportRawLoading}
                                startIcon={exportRawLoading ? <CircularProgress size={20} color="inherit" /> : <ICONS.download />}
                                sx={{ whiteSpace: "nowrap", py: 1, ...getStartIconSpacing(dir) }}
                            >
                                {exportRawLoading ? t.exporting : t.exportRawData}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleExportPDF}
                                disabled={exportLoading}
                                startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <ICONS.download />}
                                sx={{ whiteSpace: "nowrap", py: 1, ...getStartIconSpacing(dir) }}
                            >
                                {exportLoading ? t.exporting : t.exportInsights}
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>

            <Divider />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                {[
                    { label: t.totalResponses, value: totalResponses, color: "#0077b6" },
                    formInfo?.isAnonymous === false && eventInfo?.registrations ? {
                        label: "Response Rate",
                        value: `${((totalResponses / eventInfo.registrations) * 100).toFixed(1)}%`,
                        color: "#10b981"
                    } : null,
                    { label: "Questions", value: totalQuestions || availableQuestions.filter(q => q.isSurveyQuestion).length, color: "#f59e0b" },
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
                ))}</Box>

            {/* Survey Questions Chip Selector */}
            <AppCard
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 3,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    border: "1px solid #f1f5f9",
                    mb: 1,
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
                    {language === "ar" ? "أسئلة الاستطلاع" : "Survey Questions"}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        color: "text.secondary",
                        mb: 2,
                    }}
                >
                    {t.selectChipsPrompt}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1.5 }}>
                    {(translatedQuestions.length > 0 ? translatedQuestions : availableQuestions)
                        .filter(f => !f.isRegistrationField)
                        .map((field) => (
                            <QuestionChip
                                key={field.name}
                                field={field}
                                translatedLabel={field.label}
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
            </AppCard>

                            {/* Segment By — only show if form is linked to an event AND a question is selected */}
                            {formInfo?.eventId && registrationFields.length > 0 && selectedQuestions.length > 0 && (
                                <AppCard
                                    sx={{
                                        p: { xs: 2, md: 3 },
                                        borderRadius: 3,
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        border: selectedRegistrationField ? "1.5px solid #0077b6" : "1px solid #f1f5f9",
                                        transition: "border-color 0.2s",
                                        mb: 1,
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b" }}>
                                            {language === "ar" ? "تقسيم حسب حقل التسجيل" : "Segment By Registration Field"}
                                        </Typography>
                                        {selectedRegistrationField && (
                                            <Typography
                                                variant="caption"
                                                sx={{ color: "#6b7280", ml: "auto", cursor: "pointer", "&:hover": { color: "#0077b6" } }}
                                                onClick={() => setSelectedRegistrationField(null)}
                                            >
                                                {language === "ar" ? "مسح" : "Clear"}
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    {selectedQuestions.some(qId => {
                                        const q = availableQuestions.find(f => f.name === qId);
                                        return q?.type === "text";
                                    }) && (
                                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
                                            {language === "ar" ? "ملاحظة: لا يمكن تقسيم الأسئلة النصية" : "Note: Text-based questions cannot be segmented"}
                                        </Typography>
                                    )}

                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1.5 }}>
                                        {availableQuestions
                                            .filter(f => f.isRegistrationField)
                                            .map((field) => {
                                                const isSegmentAvailable = !selectedQuestions.some(qId => {
                                                    const q = availableQuestions.find(f => f.name === qId);
                                                    return q?.type === "text";
                                                });

                                                return (
                                                    <QuestionChip
                                                        key={field.name}
                                                        field={field}
                                                        translatedLabel={field.label}
                                                        isSelected={selectedRegistrationField === field.name}
                                                        onClick={() => {
                                                            if (!isSegmentAvailable) return;
                                                            setSelectedRegistrationField(prev => prev === field.name ? null : field.name);
                                                        }}
                                                        sx={{
                                                            opacity: isSegmentAvailable ? 1 : 0.5,
                                                            cursor: isSegmentAvailable ? "pointer" : "not-allowed",
                                                            filter: isSegmentAvailable ? "none" : "grayscale(1)"
                                                        }}
                                                    />
                                                );
                                            })}
                                    </Stack>
                                </AppCard>
                            )}

            <Stack
                spacing={2}
                sx={{ flex: "1 1 0%", overflow: "auto", minHeight: 0, pb: 2, px: 0.3 }}
            >
                {selectedQuestions.length === 0 ? (
                    <AppCard
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
                    </AppCard>
                ) : (
                    selectedQuestions.map((questionId) => {
                        const question = availableQuestions.find(f => f.name === questionId);
                        const isTextQuestion = question?.type === "text";
                        const isTimeQuestion = question?.type === "time";
                        const isSegmented = !!selectedRegistrationField && !isTextQuestion && !isTimeQuestion;

                        return (
                            <AppCard
                                key={questionId}
                                sx={{ 
                                    borderRadius: 3, 
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", 
                                    minHeight: "450px", 
                                    border: isSegmented ? "1.5px solid #0077b6" : "1px solid #f1f5f9",
                                    mb: 3 
                                }}
                            >
                                <ChartVisualization
                                    selectedField={questionId}
                                    chartData={chartData}
                                    chartType={getFieldParam(questionId, "chartType", determineChartType(chartData[questionId]))}
                                    onChartTypeChange={(val) => updateFieldParam(questionId, "chartType", val)}
                                    intervalMinutes={getFieldParam(questionId, "intervalMinutes", 60)}
                                startDateTime={getFieldParam(questionId, "startDateTime", dayjs().subtract(30, "day").startOf("day"))}
                                endDateTime={getFieldParam(questionId, "endDateTime", dayjs().endOf("day"))}
                                onIntervalChange={(val) => updateFieldParam(questionId, "intervalMinutes", val)}
                                onStartDateTimeChange={(val) => updateFieldParam(questionId, "startDateTime", val ? dayjs(val) : dayjs().subtract(30, "day").startOf("day"))}
                                onEndDateTimeChange={(val) => updateFieldParam(questionId, "endDateTime", val ? dayjs(val) : dayjs().endOf("day"))}
                                onGenerate={() => handleGenerate(questionId)}
                                isGenerating={generatingFields[questionId] || false}
                                    onRefReady={(el) => {
                                        if (el) {
                                            chartRefs.current[questionId] = el;
                                        }
                                    }}
                                    t={t}
                                    language={language}
                                />
                            </AppCard>
                        );
                    })
                )}
            </Stack>
        </Box>
    );
}
