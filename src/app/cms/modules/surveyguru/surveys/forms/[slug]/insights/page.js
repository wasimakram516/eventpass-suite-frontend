"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    TextField,
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
import AppCard from "@/components/cards/AppCard";
import useI18nLayout from "@/hooks/useI18nLayout";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ar";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { exportChartsToPDF } from "@/components/badges/pdfExportCharts";
import { Button, CircularProgress } from "@mui/material";
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

// Function to convert digits in a DOM element to Arabic-Indic numerals
const convertDigitsInElement = (element, language) => {
    if (language !== "ar" || !element) return;

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue && /\d/.test(node.nodeValue)) {
            textNodes.push(node);
        }
    }

    textNodes.forEach(textNode => {
        textNode.nodeValue = toArabicDigits(textNode.nodeValue, language);
    });

    const contentEditableElements = element.querySelectorAll('[contenteditable="true"]');
    contentEditableElements.forEach(el => {
        if (el.textContent && /\d/.test(el.textContent)) {
            const converted = toArabicDigits(el.textContent, language);
            if (el.textContent !== converted) {
                el.textContent = converted;
            }
        }
    });

    const elementsWithAria = element.querySelectorAll('[aria-valuetext], [aria-valuenow]');
    elementsWithAria.forEach(el => {
        if (el.getAttribute('aria-valuetext') && /\d/.test(el.getAttribute('aria-valuetext'))) {
            const converted = toArabicDigits(el.getAttribute('aria-valuetext'), language);
            el.setAttribute('aria-valuetext', converted);
        }
        if (el.getAttribute('aria-valuenow') && /\d/.test(el.getAttribute('aria-valuenow'))) {
            const converted = toArabicDigits(el.getAttribute('aria-valuenow'), language);
            el.setAttribute('aria-valuenow', converted);
        }
    });
};

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

const ChartVisualization = ({
    selectedField,
    chartData,
    translatedChartData,
    translatedQuestions,
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
    language,
}) => {
    const { dir } = useI18nLayout();

    const field = translatedChartData[selectedField] || chartData[selectedField];

    const translatedQuestion = translatedQuestions.find((q) => q.name === selectedField);
    const questionLabel = translatedQuestion?.label || field?.label || "";

    useEffect(() => {
        if (language === "ar" && field && selectedField) {
            const convertInputDigits = () => {
                const container = document.getElementById(`date-picker-container-${selectedField}`);
                if (!container) return;

                const inputs = container.querySelectorAll('input[type="text"]');
                inputs.forEach(input => {
                    if (input.value && (/\d/.test(input.value) || /\b(AM|PM)\b/i.test(input.value))) {
                        if (input.value.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || input.value.match(/\d{1,2}:\d{2}/)) {
                            let converted = toArabicDigits(input.value, language);
                            converted = converted.replace(/\bAM\b/gi, "ص");
                            converted = converted.replace(/\bPM\b/gi, "م");
                            if (input.value !== converted && document.activeElement !== input) {
                                input.value = converted;
                            }
                        }
                    }
                });

                const pickerSections = container.querySelectorAll('.MuiPickersSectionList-sectionContent[contenteditable="true"]');
                pickerSections.forEach(section => {
                    if (section.textContent && /\d/.test(section.textContent)) {
                        const converted = toArabicDigits(section.textContent, language);
                        if (section.textContent !== converted && document.activeElement !== section) {
                            section.textContent = converted;
                        }
                    }
                });

                const ariaElements = container.querySelectorAll('[aria-valuetext]');
                ariaElements.forEach(el => {
                    const ariaValue = el.getAttribute('aria-valuetext');
                    if (ariaValue && /\d/.test(ariaValue)) {
                        const converted = toArabicDigits(ariaValue, language);
                        if (ariaValue !== converted) {
                            el.setAttribute('aria-valuetext', converted);
                        }
                    }
                });
            };

            convertInputDigits();
            const interval = setInterval(convertInputDigits, 100);
            return () => clearInterval(interval);
        }
    }, [language, startDateTime, endDateTime, field, selectedField]);

    if (!selectedField || !chartData[selectedField] || !field) {
        return null;
    }

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
                            {questionLabel}
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
                            <LocalizationProvider
                                dateAdapter={AdapterDayjs}
                                adapterLocale={language === "ar" ? "ar" : "en"}
                            >
                                <Box
                                    id={`date-picker-container-${selectedField}`}
                                    sx={{
                                        position: "relative",
                                        display: "flex",
                                        gap: language === "ar" ? 3 : 1.5,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <DateTimePicker
                                        key={`from-${language}`}
                                        label={t.from}
                                        value={startDateTime}
                                        onChange={(val) => onStartDateTimeChange(val)}
                                        ampm={true}
                                        format="DD/MM/YYYY hh:mm A"
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                sx: {
                                                    width: language === "ar" ? "240px" : "200px",
                                                },
                                                onFocus: (e) => {
                                                    if (language === "ar" && e.target.value) {
                                                        let converted = toArabicDigits(e.target.value, language);
                                                        converted = converted.replace(/\bAM\b/gi, "ص");
                                                        converted = converted.replace(/\bPM\b/gi, "م");
                                                        e.target.value = converted;
                                                    }
                                                    setTimeout(() => {
                                                        const picker = document.querySelector('[role="dialog"]');
                                                        if (picker && language === "ar") {
                                                            convertDigitsInElement(picker, language);
                                                        }
                                                    }, 100);
                                                },
                                                onBlur: (e) => {
                                                    if (language === "ar" && e.target.value) {
                                                        let converted = toArabicDigits(e.target.value, language);
                                                        converted = converted.replace(/\bAM\b/gi, "ص");
                                                        converted = converted.replace(/\bPM\b/gi, "م");
                                                        e.target.value = converted;
                                                    }
                                                },
                                            },
                                            actionBar: {
                                                actions: ["cancel", "ok"],
                                            },
                                        }}
                                        disabled={isGenerating}
                                        onOpen={() => {
                                            setTimeout(() => {
                                                const picker = document.querySelector('[role="dialog"]');
                                                if (picker && language === "ar") {
                                                    convertDigitsInElement(picker, language);
                                                    const observer = new MutationObserver(() => {
                                                        convertDigitsInElement(picker, language);
                                                    });
                                                    observer.observe(picker, {
                                                        childList: true,
                                                        subtree: true,
                                                        characterData: true,
                                                    });
                                                    if (picker) {
                                                        picker._arabicObserver = observer;
                                                    }
                                                }
                                            }, 100);
                                        }}
                                        onClose={() => {
                                            const picker = document.querySelector('[role="dialog"]');
                                            if (picker && picker._arabicObserver) {
                                                picker._arabicObserver.disconnect();
                                            }
                                        }}
                                    />
                                    <DateTimePicker
                                        key={`to-${language}`}
                                        label={t.to}
                                        value={endDateTime}
                                        onChange={(val) => onEndDateTimeChange(val)}
                                        ampm={true}
                                        format="DD/MM/YYYY hh:mm A"
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                sx: {
                                                    width: language === "ar" ? "240px" : "200px",
                                                },
                                                onFocus: (e) => {
                                                    if (language === "ar" && e.target.value) {
                                                        let converted = toArabicDigits(e.target.value, language);
                                                        converted = converted.replace(/\bAM\b/gi, "ص");
                                                        converted = converted.replace(/\bPM\b/gi, "م");
                                                        e.target.value = converted;
                                                    }
                                                    setTimeout(() => {
                                                        const picker = document.querySelector('[role="dialog"]');
                                                        if (picker && language === "ar") {
                                                            convertDigitsInElement(picker, language);
                                                        }
                                                    }, 100);
                                                },
                                                onBlur: (e) => {
                                                    if (language === "ar" && e.target.value) {
                                                        let converted = toArabicDigits(e.target.value, language);
                                                        converted = converted.replace(/\bAM\b/gi, "ص");
                                                        converted = converted.replace(/\bPM\b/gi, "م");
                                                        e.target.value = converted;
                                                    }
                                                },
                                            },
                                            actionBar: {
                                                actions: ["cancel", "ok"],
                                            },
                                        }}
                                        disabled={isGenerating}
                                        onOpen={() => {
                                            setTimeout(() => {
                                                const picker = document.querySelector('[role="dialog"]');
                                                if (picker && language === "ar") {
                                                    convertDigitsInElement(picker, language);
                                                    const observer = new MutationObserver(() => {
                                                        convertDigitsInElement(picker, language);
                                                    });
                                                    observer.observe(picker, {
                                                        childList: true,
                                                        subtree: true,
                                                        characterData: true,
                                                    });
                                                    if (picker) {
                                                        picker._arabicObserver = observer;
                                                    }
                                                }
                                            }, 100);
                                        }}
                                        onClose={() => {
                                            const picker = document.querySelector('[role="dialog"]');
                                            if (picker && picker._arabicObserver) {
                                                picker._arabicObserver.disconnect();
                                            }
                                        }}
                                    />
                                </Box>
                            </LocalizationProvider>
                            <TextField
                                key={`interval-${language}`}
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
                                                return formatPercentage(percentage, language);
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
                                    px: { xs: 0, md: 2.5 },
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: { xs: "center", md: "flex-start" },
                                    direction: "ltr",
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
                                                direction: "ltr",
                                                ml: { xs: 0, md: 1 },
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
                                                    direction: language === "ar" ? "rtl" : "ltr",
                                                    textAlign: language === "ar" ? "right" : "left",
                                                }}
                                            >
                                                {item.label} {formatPercentage(percentage, language)} ({toArabicDigits(item.value, language)})
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
                                    data: field.xData.map(label => toArabicDigits(label, language)),
                                    tickLabelStyle: {
                                        direction: language === "ar" ? "rtl" : "ltr",
                                        textAlign: language === "ar" ? "right" : "left",
                                    },
                                }]}
                                yAxis={[
                                    {
                                        min: 0,
                                        max: Math.max(...field.yData) + Math.ceil(Math.max(...field.yData) * 0.05),
                                        tickLabelStyle: {
                                            direction: language === "ar" ? "rtl" : "ltr",
                                            textAlign: language === "ar" ? "right" : "left",
                                        },
                                        valueFormatter: (value) => toArabicDigits(String(value), language),
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
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, direction: language === "ar" ? "rtl" : "ltr" }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: field.color, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937', whiteSpace: 'nowrap', fontSize: { xs: '0.875rem', md: '0.875rem' }, direction: language === "ar" ? "rtl" : "ltr", textAlign: language === "ar" ? "right" : "left" }}>
                                        {toArabicDigits(label, language)} ({toArabicDigits(field.yData[idx], language)})
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
    const [chartRefs, setChartRefs] = useState({});
    const [exportLoading, setExportLoading] = useState(false);
    const [exportRawLoading, setExportRawLoading] = useState(false);
    const [formInfo, setFormInfo] = useState(null);
    const [totalResponses, setTotalResponses] = useState(0);
    const [eventInfo, setEventInfo] = useState(null);
    const [translatedQuestions, setTranslatedQuestions] = useState([]);
    const [translatedChartData, setTranslatedChartData] = useState({});
    const [translatedEventInfo, setTranslatedEventInfo] = useState(null);
    const [translatedFormInfo, setTranslatedFormInfo] = useState(null);

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
                                        [questionId]: { ...field, data: translatedData },
                                    }));
                                } else {
                                    setTranslatedChartData((prev) => ({
                                        ...prev,
                                        [questionId]: { ...field, data },
                                    }));
                                }
                            } catch (error) {
                                console.error("Error translating option labels:", error);
                                setTranslatedChartData((prev) => ({
                                    ...prev,
                                    [questionId]: { ...field, data },
                                }));
                            }
                        };
                        translateOptionLabels();
                    }
                } catch (error) {
                    console.error(`Error loading chart data for ${questionId}:`, error);
                }
            }
        };

        fetchChartData();
    }, [selectedQuestions, slug, availableQuestions, appliedParams, language]);

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

            const questionsToUse = translatedQuestions.length > 0 ? translatedQuestions : availableQuestions;
            const labels = selectedQuestions.map((questionId) => {
                const field = questionsToUse.find((f) => f.name === questionId);
                return field?.label || questionId;
            });

            const chartDataToUse = Object.keys(translatedChartData).length > 0 ? translatedChartData : chartData;
            const chartDataArray = selectedQuestions.map((questionId) => {
                const data = chartDataToUse[questionId] || chartData[questionId];
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

                return {
                    ...data,
                    intervalMinutes: intervalMinutes,
                    startDateTime: startDateTime.toDate(),
                    endDateTime: endDateTime.toDate(),
                    startDateTimeFormatted: formatDateTimeWithLocale(
                        startDateTime.toISOString(),
                        language === "ar" ? "ar-SA" : "en-GB"
                    ),
                    endDateTimeFormatted: formatDateTimeWithLocale(
                        endDateTime.toISOString(),
                        language === "ar" ? "ar-SA" : "en-GB"
                    ),
                    intervalMinutesFormatted: language === "ar"
                        ? toArabicDigits(String(intervalMinutes), language)
                        : String(intervalMinutes),
                    intervalMinutesSuffix: "min",
                    legend: false,
                };
            });

            const formInfoToUse = translatedFormInfo || formInfo;
            const surveyInfo = {
                title: formInfoToUse?.title || null,
                description: formInfoToUse?.description || null,
                totalResponses: totalResponses || 0,
                totalResponsesFormatted: language === "ar"
                    ? toArabicDigits(String(totalResponses || 0), language)
                    : String(totalResponses || 0),
            };


            const eventDataForExport = (translatedEventInfo || currentEventInfo) || formInfoToUse || {};

            if (eventDataForExport.startDate) {
                eventDataForExport.startDateFormatted = formatDateWithShortMonth(
                    eventDataForExport.startDate,
                    language === "ar" ? "ar-SA" : "en-GB"
                );
            }
            if (eventDataForExport.endDate) {
                eventDataForExport.endDateFormatted = formatDateWithShortMonth(
                    eventDataForExport.endDate,
                    language === "ar" ? "ar-SA" : "en-GB"
                );
            }

            if (eventDataForExport.registrations !== undefined) {
                eventDataForExport.registrationsFormatted = language === "ar"
                    ? toArabicDigits(String(eventDataForExport.registrations || 0), language)
                    : String(eventDataForExport.registrations || 0);
            }

            await exportChartsToPDF(
                refs,
                labels,
                chartDataArray,
                eventDataForExport,
                surveyInfo,
                language,
                dir,
                t
            );
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

            const formatDateTimeForExcel = (dateString) => {
                return formatDateTimeWithLocale(dateString, language === "ar" ? "ar-SA" : "en-GB");
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
                pushRow(t.from, eventInfoToUse.startDate ? formatDateTimeForExcel(eventInfoToUse.startDate) : "N/A");
                pushRow(t.to, eventInfoToUse.endDate ? formatDateTimeForExcel(eventInfoToUse.endDate) : "N/A");
                pushRow(t.venue, eventInfoToUse.venue || "N/A");
                pushRow(t.totalRegistrations, leftAlignNumber(eventInfoToUse.registrations, 0));
            }

            // Survey Details section
            pushRow(t.titleOfSurvey, formInfoToUse.title || "N/A");
            pushRow(t.description, formInfoToUse.description || "N/A");
            pushRow(t.totalResponses, leftAlignNumber(totalResponses, 0));
            wsData.push([]);

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

            <AppCard
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
                    {(translatedQuestions.length > 0 ? translatedQuestions : availableQuestions).map((field) => (
                        <QuestionChip
                            key={field.name}
                            fieldKey={field.name}
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
                    selectedQuestions.map((questionId) => (
                        <AppCard
                            key={questionId}
                            sx={{ borderRadius: 2, boxShadow: 2, minHeight: "450px" }}
                        >
                            <ChartVisualization
                                selectedField={questionId}
                                chartData={chartData}
                                translatedChartData={translatedChartData}
                                translatedQuestions={translatedQuestions.length > 0 ? translatedQuestions : availableQuestions}
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
                                language={language}
                            />
                        </AppCard>
                    ))
                )}
            </Stack>
        </Box>
    );
}

