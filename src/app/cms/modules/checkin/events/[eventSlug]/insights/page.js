"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import BarChartIcon from "@mui/icons-material/BarChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
    getAvailableFields,
    getFieldDistribution,
    getTimeDistribution,
    getInsightsSummary,
    getScannedByTypeDistribution,
    getScannedByUserDistribution,
} from "@/services/eventreg/insightsService";
import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import useCheckInSocket from "@/hooks/modules/checkin/useCheckInSocket";
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
import * as XLSX from "xlsx";

const translations = {
    en: {
        pageTitle: "Intelligent Insights",
        pageDescription:
            "Analyze event data and visualize key metrics through interactive charts and distributions.",
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
        totalScanned: "Total Scanned",
        scanRate: "Scan Rate",
        timezone: "Timezone",
        badgePrintStats: "Badge Print Stats",
        totalBadgePrints: "Total Badge Prints",
        noPrints: "0 Prints (Never Printed)",
        onePrint: "1 Print",
        multiPrint: "Multi-Print (2+)",
        multiPrintRate: "Multi-Print Rate",
        registrationAttendance: "Registration & Attendance",
        postEventReport: "POST-EVENT REPORT",
        confidential: "Confidential — For Internal Use Only",
        presentedBy: "Presented by",
        poweredBy: "Powered by",
    },
    ar: {
        pageTitle: "تحليلات ذكية",
        pageDescription:
            "تحليل بيانات الحدث وتصور المقاييس الرئيسية من خلال الرسوم البيانية والتوزيعات التفاعلية.",
        availableFields: "الحقول المتاحة",
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
        totalScanned: "إجمالي المسح",
        scanRate: "معدل المسح",
        timezone: "المنطقة الزمنية",
        badgePrintStats: "إحصائيات طباعة الشارات",
        totalBadgePrints: "إجمالي طباعة الشارات",
        noPrints: "0 طباعة (لم يُطبع)",
        onePrint: "طباعة واحدة",
        multiPrint: "طباعة متعددة (2+)",
        multiPrintRate: "معدل الطباعة المتعددة",
        registrationAttendance: "التسجيل والحضور",
        postEventReport: "تقرير ما بعد الحدث",
        confidential: "سري — للاستخدام الداخلي فقط",
        presentedBy: "مقدم من",
        poweredBy: "مدعوم من",
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
    chartTypeOverride,
    onChartTypeChange,
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

    const showTopNControl = field.type === "text" || field.type === "number";
    const showIntervalControl = field.type === "time";
    const showGenerateButton = showTopNControl || showIntervalControl;
    const isCategorical = field.chartType === "pie";
    const isTimeBased = field.chartType === "line";
    const effectiveChartType = chartTypeOverride || field.chartType;
    const chartTypeChips = isCategorical
        ? [
              { label: "Pie", value: "pie" },
              { label: "Donut", value: "donut" },
              { label: "Bar", value: "bar" },
          ]
        : isTimeBased
        ? [
              { label: "Line", value: "line" },
              { label: "Bar", value: "bar" },
          ]
        : null;
    const hasNoData = isCategorical && (!field.data || field.data.length === 0);
    const barData = isCategorical && field.data ? field.data.filter((d) => d.value > 0) : [];
    const barTotal = field.data ? field.data.reduce((sum, d) => sum + d.value, 0) : 0;

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
                        <Typography variant="caption" color="textSecondary">
                            {getChartDescription()}
                        </Typography>
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
                    {showTopNControl && (
                        <TextField
                            label={t.topN}
                            type="number"
                            size="small"
                            value={topN}
                            onChange={(e) => {
                                const val =
                                    e.target.value === "" ? 0 : parseInt(e.target.value);
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

            {chartTypeChips && (
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                    {chartTypeChips.map((chip) => (
                        <Chip
                            key={chip.value}
                            label={chip.label}
                            size="small"
                            onClick={() => onChartTypeChange(chip.value)}
                            sx={{
                                cursor: "pointer",
                                fontWeight: effectiveChartType === chip.value ? 600 : 400,
                                backgroundColor:
                                    effectiveChartType === chip.value ? field.color : "transparent",
                                color: effectiveChartType === chip.value ? "#fff" : "#374151",
                                border: `1.5px solid ${effectiveChartType === chip.value ? field.color : "#e5e7eb"}`,
                                "&:hover": {
                                    backgroundColor:
                                        effectiveChartType === chip.value
                                            ? field.color
                                            : `${field.color}15`,
                                    borderColor: field.color,
                                    color: effectiveChartType === chip.value ? "#fff" : field.color,
                                },
                            }}
                        />
                    ))}
                </Stack>
            )}

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
                ) : effectiveChartType === "pie" || effectiveChartType === "donut" ? (
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
                                            data: barData,
                                            innerRadius: effectiveChartType === "donut" ? 80 : 0,
                                            highlightScope: { faded: "global", highlighted: "item" },
                                            faded: {
                                                innerRadius: 30,
                                                additionalRadius: -30,
                                                color: "gray",
                                            },
                                            arcLabel: () => "",
                                            valueFormatter: (item) => {
                                                const percentage = ((item.value / barTotal) * 100).toFixed(1);
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
                                    px: { xs: 0, md: 2.5 },
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: { xs: "center", md: "flex-start" },
                                    direction: "ltr",
                                }}
                            >
                                {barData.map((item, idx) => {
                                    const percentage = ((item.value / barTotal) * 100).toFixed(1);
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
                                                    direction: "ltr",
                                                    textAlign: "left",
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
                ) : effectiveChartType === "bar" && isCategorical ? (
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
                            <BarChart
                                xAxis={[{
                                    scaleType: "band",
                                    data: barData.map((d) => d.label),
                                    tickLabelStyle: { angle: -30, textAnchor: "end", fontSize: 11 },
                                    colorMap: {
                                        type: "ordinal",
                                        colors: barData.map((d) => d.color),
                                    },
                                }]}
                                series={[{
                                    data: barData.map((d) => d.value),
                                }]}
                                height={400}
                                margin={{ top: 20, bottom: 70, left: 50, right: 20 }}
                                slotProps={{ legend: { hidden: true } }}
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
                            {barData.map((item, idx) => {
                                const percentage = ((item.value / barTotal) * 100).toFixed(1);
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
                                                direction: "ltr",
                                                textAlign: "left",
                                            }}
                                        >
                                            {item.label} {percentage}% ({item.value})
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                ) : effectiveChartType === "line" ? (
                    <Box sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: { xs: 2, md: 3 },
                        height: "100%",
                        alignItems: { xs: "center", md: "stretch" },
                    }}>
                        <Box sx={{
                            flex: { xs: "0 0 auto", md: 1 },
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: { xs: "100%", md: "auto" },
                            maxWidth: { xs: "100%", md: "none" },
                        }}>
                            <LineChart
                                xAxis={[{
                                    scaleType: "point",
                                    data: field.xData,
                                    tickLabelStyle: {
                                        direction: "ltr",
                                        textAlign: "left",
                                    },
                                }]}
                                yAxis={[
                                    {
                                        min: 0,
                                        max: Math.max(...field.yData) + Math.ceil(Math.max(...field.yData) * 0.05),
                                        tickLabelStyle: {
                                            direction: "ltr",
                                            textAlign: "left",
                                        },
                                    }
                                ]}
                                series={[
                                    {
                                        data: field.yData,
                                        color: field.color,
                                        curve: "linear",
                                    }
                                ]}
                                height={400}
                                margin={{ top: 30, bottom: 50, left: 50, right: 80 }}
                                slotProps={{
                                    legend: { hidden: true },
                                }}
                                sx={{
                                    "& .MuiMarkElement-root": {
                                        display: (d) => d.value === 0 ? "none" : "auto",
                                    },
                                }}
                            />
                        </Box>
                        <Box sx={{
                            minWidth: { xs: "100%", md: "220px" },
                            width: { xs: "100%", md: "auto" },
                            overflow: "auto",
                            pr: { xs: 0, md: 1 },
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: { xs: "center", md: "flex-start" },
                        }}>
                            {field.xData.map((label, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr" }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: field.color, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: { xs: "0.875rem", md: "0.875rem" }, direction: "ltr", textAlign: "left" }}>
                                        {label} ({field.yData[idx]})
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: { xs: 2, md: 3 },
                        height: "100%",
                        alignItems: { xs: "center", md: "stretch" },
                    }}>
                        <Box sx={{
                            flex: { xs: "0 0 auto", md: 1 },
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: { xs: "100%", md: "auto" },
                            maxWidth: { xs: "100%", md: "none" },
                        }}>
                            <BarChart
                                xAxis={[{
                                    scaleType: "band",
                                    data: field.xData,
                                    tickLabelStyle: { angle: -30, textAnchor: "end", fontSize: 11 },
                                }]}
                                series={[{
                                    data: field.yData,
                                    color: field.color,
                                }]}
                                height={400}
                                margin={{ top: 30, bottom: 70, left: 50, right: 80 }}
                                slotProps={{ legend: { hidden: true } }}
                            />
                        </Box>
                        <Box sx={{
                            minWidth: { xs: "100%", md: "220px" },
                            width: { xs: "100%", md: "auto" },
                            overflow: "auto",
                            pr: { xs: 0, md: 1 },
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: { xs: "center", md: "flex-start" },
                        }}>
                            {field.xData.map((label, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr" }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: field.color, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: { xs: "0.875rem", md: "0.875rem" }, direction: "ltr", textAlign: "left" }}>
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

export default function CheckInAnalyticsDashboard() {
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
    const [chartTypeOverrides, setChartTypeOverrides] = useState({});
    const [eventInfo, setEventInfo] = useState(null);
    const [summary, setSummary] = useState(null);
    const scannedIdsRef = useRef(new Set());

    const eventId = eventInfo?._id;

    const handleBadgePrinted = useCallback((data) => {
        setSummary((prev) => {
            if (!prev) return prev;
            const pc = data.printCount;
            let { totalPrints, noPrintCount, onePrintCount, multiPrintCount, totalRegistrations } = prev;
            totalPrints += 1;
            if (pc === 1) {
                noPrintCount = Math.max(0, noPrintCount - 1);
                onePrintCount += 1;
            } else if (pc === 2) {
                onePrintCount = Math.max(0, onePrintCount - 1);
                multiPrintCount += 1;
            }
            const multiPrintRate = totalRegistrations > 0
                ? ((multiPrintCount / totalRegistrations) * 100).toFixed(2)
                : "0.00";
            return { ...prev, totalPrints, noPrintCount, onePrintCount, multiPrintCount, multiPrintRate };
        });
    }, []);

    const handleNewRegistration = useCallback(() => {
        setSummary((prev) => {
            if (!prev) return prev;
            const totalRegistrations = (prev.totalRegistrations || 0) + 1;
            const noPrintCount = prev.noPrintCount + 1;
            const multiPrintRate = totalRegistrations > 0
                ? ((prev.multiPrintCount / totalRegistrations) * 100).toFixed(2)
                : "0.00";
            const scanRate = totalRegistrations > 0
                ? (((prev.uniqueScanned || 0) / totalRegistrations) * 100).toFixed(2)
                : "0.00";
            return { ...prev, totalRegistrations, noPrintCount, multiPrintRate, scanRate };
        });
    }, []);

    const handleScanConfirmed = useCallback((data) => {
        const registrationId = data.registrationId?.toString();
        if (!registrationId || scannedIdsRef.current.has(registrationId)) return;
        scannedIdsRef.current.add(registrationId);
        setSummary((prev) => {
            if (!prev) return prev;
            const uniqueScanned = (prev.uniqueScanned || 0) + 1;
            const scanRate = prev.totalRegistrations > 0
                ? ((uniqueScanned / prev.totalRegistrations) * 100).toFixed(2)
                : "0.00";
            return { ...prev, uniqueScanned, scanRate };
        });
    }, []);

    useCheckInSocket({
        eventId,
        onBadgePrinted: handleBadgePrinted,
        onNewRegistration: handleNewRegistration,
        onScanConfirmed: handleScanConfirmed,
    });

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
                const [fieldsResponse, summaryResponse, eventRes] = await Promise.all([
                    getAvailableFields(eventSlug),
                    getInsightsSummary(eventSlug),
                    getCheckInEventBySlug(eventSlug),
                ]);

                if (summaryResponse?.data) setSummary(summaryResponse.data);
                if (eventRes && !eventRes.error) setEventInfo(eventRes.data ?? eventRes);

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

                setFieldParams(defaultParams);
                setAppliedParams(defaultParams);

                const allFields = [
                    ...response.data.categoricalFields
                        .filter((f) => f.name !== "token")
                        .map((f) => ({
                            ...f,
                            chartType: determineChartType(f),
                            color: FIELD_COLOR,
                        })),
                    ...response.data.timeFields
                        .filter((f) => f.name !== "token")
                        .map((f) => ({
                            ...f,
                            chartType: "line",
                            color: FIELD_COLOR,
                        })),
                ];

                allFields.push(
                    {
                        name: "scannedByType",
                        label: "Scanned By Staff Type",
                        type: "special",
                        chartType: "pie",
                        color: FIELD_COLOR,
                    },
                    {
                        name: "scannedByUser",
                        label: "Scanned By Staff Name",
                        type: "special",
                        chartType: "pie",
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
                    } else if (
                        fieldName === "scannedByType" ||
                        fieldName === "scannedByUser"
                    ) {
                        response =
                            fieldName === "scannedByType"
                                ? await getScannedByTypeDistribution(eventSlug)
                                : await getScannedByUserDistribution(eventSlug);

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
                return {
                    ...data,
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

            await exportChartsToPDF(
                refs,
                labels,
                chartDataArray,
                { ...eventInfo, ...(summary || {}) },
                null,
                language,
                dir,
                t,
                Intl.DateTimeFormat().resolvedOptions().timeZone
            );
        } catch (error) {
            console.error("PDF export failed:", error);
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
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
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

            pushRow(t.logoUrl, eventInfo.logoUrl || "N/A");
            pushRow(t.eventName, eventInfo.name || "N/A");
            pushRow(t.from, eventInfo.startDate ? formatDateTimeForExcel(eventInfo.startDate) : "N/A");
            pushRow(t.to, eventInfo.endDate ? formatDateTimeForExcel(eventInfo.endDate) : "N/A");
            pushRow(t.venue, eventInfo.venue || "N/A");
            pushRow(t.totalRegistrations, leftAlignNumber(eventInfo.registrations, 0));
            pushRow(t.totalScanned, leftAlignNumber(summary?.uniqueScanned, 0));
            pushRow(t.scanRate, summary ? `${summary.scanRate}%` : "0.00%");
            pushRow(t.timezone, getTimezoneLabel(timezone));
            wsData.push([]);

            pushRow("=== Badge Print Stats ===");
            pushRow(t.totalBadgePrints, leftAlignNumber(summary?.totalPrints, 0));
            pushRow(t.noPrints, leftAlignNumber(summary?.noPrintCount, 0));
            pushRow(t.onePrint, leftAlignNumber(summary?.onePrintCount, 0));
            pushRow(t.multiPrint, leftAlignNumber(summary?.multiPrintCount, 0));
            pushRow(t.multiPrintRate, summary ? `${summary.multiPrintRate}%` : "0.00%");
            wsData.push([]);

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
            link.download = `${eventInfo.slug || "event"}_checkin_insights_raw_data.xlsx`;
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
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {[
                        { label: t.totalRegistrations, value: summary.totalRegistrations, color: "#0077b6" },
                        { label: t.totalScanned, value: summary.uniqueScanned, color: "#0284c7" },
                        { label: t.scanRate, value: `${summary.scanRate}%`, color: "#06b6d4" },
                        { label: t.totalBadgePrints, value: summary.totalPrints, color: "#f59e0b" },
                        { label: t.noPrints, value: summary.noPrintCount, color: "#ef4444" },
                        { label: t.onePrint, value: summary.onePrintCount, color: "#84cc16" },
                        { label: t.multiPrint, value: summary.multiPrintCount, color: "#10b981" },
                        { label: t.multiPrintRate, value: `${summary.multiPrintRate}%`, color: "#8b5cf6" },
                    ].map(({ label, value, color }) => (
                        <Paper
                            key={label}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                boxShadow: 2,
                                flex: "1 1 140px",
                                minWidth: 140,
                                textAlign: "center",
                            }}
                        >
                            <Typography variant="h4" fontWeight="bold" sx={{ color }}>
                                {value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {label}
                            </Typography>
                        </Paper>
                    ))}
                </Box>
            )}

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
                    {t.availableFields}
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
            </Paper>

            <Stack
                spacing={2}
                sx={{ flex: "1 1 0%", overflow: "auto", minHeight: 0, pb: 2, px: 0.3 }}
            >
                {selectedFields.length === 0 ? (
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
                                {t.selectFieldPrompt}
                            </Typography>
                        </Box>
                    </Paper>
                ) : (
                    selectedFields.map((fieldName) => (
                        <Paper
                            key={fieldName}
                            sx={{ borderRadius: 2, boxShadow: 2, minHeight: "450px" }}
                        >
                            <ChartVisualization
                                selectedField={fieldName}
                                chartData={chartData}
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
                                chartTypeOverride={chartTypeOverrides[fieldName] || null}
                                onChartTypeChange={(type) =>
                                    setChartTypeOverrides((prev) => ({ ...prev, [fieldName]: type }))
                                }
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
