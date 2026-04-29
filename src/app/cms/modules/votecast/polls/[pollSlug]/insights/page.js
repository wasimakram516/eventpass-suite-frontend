"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    Grid,
    Card,
    CardContent,
    Collapse,
    IconButton,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { BarChart as BarChartIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import {
    getPollInsightsSummary,
    getPollInsightsFields,
    getPollInsightsDistribution,
    getPollInsightsTimeDistribution,
    getPollCrossBreakdown,
} from "@/services/votecast/pollInsightsService";
import { getPublicPollBySlug } from "@/services/votecast/pollService";
import useVotecastSocket from "@/hooks/modules/votecast/useVotecastSocket";
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
        pageTitle: "Poll Insights",
        pageDescription:
            "Analyze voting participation, trends, and breakdowns for this poll.",
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
        uniqueVoters: "Unique Voters",
        participationRate: "Participation Rate",
        totalVotes: "Total Votes Cast",
        questionCount: "Question Count",
        voterName: "Name",
        pollTitle: "Poll Title",
        category: "Category",
        noData: "No data to display",
        crossBreakdown: "Cross Breakdown",
        crossBreakdownDesc: "See how different groups voted on each question.",
        chartTypeStacked: "Stacked Bar",
        chartTypeGrouped: "Grouped Bar",
        chartTypeNormalized: "100% Stacked",
        chartTypePie: "Pie Groups",
        noBreakdownData: "No breakdown data for this question.",
        totalVotesLabel: "votes",
        chartTypeDonut: "Donut Groups",
        chartTypeLine: "Line",
        responsePattern: "Response Pattern",
        responsePatternDesc: "Aggregate option frequency across all questions.",
        pollOverview: "Poll Overview",
        postEventReport: "POST-EVENT REPORT",
        confidential: "Confidential — For Internal Use Only",
        presentedBy: "Presented by",
        poweredBy: "Powered by",
        page: "Page",
        of: "of",
        venue: "Venue",
        eventName: "Event",
        timezone: "Timezone",
    },
    ar: {
        pageTitle: "تحليلات الاستطلاع",
        pageDescription:
            "تحليل مشاركة التصويت والاتجاهات والتوزيعات لهذا الاستطلاع.",
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
        exporting: "جاري التصدير...",
        exportRawData: "تصدير البيانات الأولية",
        count: "العدد",
        percentage: "النسبة المئوية",
        intervalMinutesFull: "الفاصل الزمني (بالدقائق)",
        timestamp: "الطابع الزمني",
        totalRegistrations: "إجمالي التسجيلات",
        uniqueVoters: "الناخبون الفريدون",
        participationRate: "معدل المشاركة",
        totalVotes: "إجمالي الأصوات المُدلى بها",
        questionCount: "عدد الأسئلة",
        pollTitle: "عنوان الاستطلاع",
        category: "الفئة",
        noData: "لا توجد بيانات للعرض",
        crossBreakdown: "التوزيع التقاطعي",
        crossBreakdownDesc: "اعرف كيف صوّتت المجموعات المختلفة على كل سؤال.",
        chartTypeStacked: "شريطي مكدّس",
        chartTypeGrouped: "شريطي مجمّع",
        chartTypeNormalized: "مكدّس 100%",
        chartTypePie: "دائري للمجموعات",
        noBreakdownData: "لا توجد بيانات لهذا السؤال.",
        totalVotesLabel: "أصوات",
        chartTypeDonut: "دائري حلقي",
        chartTypeLine: "خطي",
        responsePattern: "نمط الاستجابة",
        responsePatternDesc: "تكرار الخيارات المجمّعة عبر جميع الأسئلة.",
        pollOverview: "نظرة عامة على الاستطلاع",
        postEventReport: "تقرير ما بعد الحدث",
        confidential: "سري — للاستخدام الداخلي فقط",
        presentedBy: "مقدم من",
        poweredBy: "مدعوم من",
        page: "صفحة",
        of: "من",
        venue: "الموقع",
        eventName: "الحدث",
        timezone: "المنطقة الزمنية",
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
        Math.round(255 * x).toString(16).padStart(2, "0");
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

const KpiCard = ({ label, value }) => (
    <Card elevation={2} sx={{ borderRadius: 2, textAlign: "center" }}>
        <CardContent sx={{ py: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
                {value ?? "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
                {label}
            </Typography>
        </CardContent>
    </Card>
);

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
    chartTypeOverride,
    onChartTypeChange,
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
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2, width: "100%" }}>
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
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1f2937" }}>
                            {field.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {getChartDescription()}
                        </Typography>
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
                sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column" }}
            >
                {hasNoData ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <Typography variant="body1" color="textSecondary">{t.noData}</Typography>
                    </Box>
                ) : effectiveChartType === "pie" || effectiveChartType === "donut" ? (
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
                                        faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
                                        arcLabel: () => "",
                                        valueFormatter: (item) => {
                                            return `${((item.value / barTotal) * 100).toFixed(1)}%`;
                                        },
                                    },
                                ]}
                                height={400}
                                slotProps={{
                                    legend: { hidden: true, sx: { display: "none !important" } },
                                    pieArcLabel: {
                                        style: { fill: "white", fontWeight: 600, fontSize: "clamp(10px, 2vw, 14px)" },
                                    },
                                }}
                            />
                        </Box>
                        <Box
                            sx={{
                                minWidth: { xs: "100%", md: "220px" },
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
                                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr", ml: { xs: 0, md: 1 } }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }} />
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: { xs: "0.875rem", md: "0.875rem" }, direction: "ltr", textAlign: "left" }}
                                        >
                                            {item.label} {percentage}% ({item.value})
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
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
                                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr", ml: { xs: 0, md: 1 } }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }} />
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: { xs: "0.875rem", md: "0.875rem" }, direction: "ltr", textAlign: "left" }}
                                        >
                                            {item.label} {percentage}% ({item.value})
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                ) : effectiveChartType === "line" ? (
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
                            }}
                        >
                            <LineChart
                                xAxis={[{
                                    scaleType: "point",
                                    data: field.xData,
                                    tickLabelStyle: { direction: "ltr", textAlign: "left" },
                                }]}
                                yAxis={[{
                                    min: 0,
                                    max: Math.max(...field.yData) + Math.ceil(Math.max(...field.yData) * 0.05),
                                    tickLabelStyle: { direction: "ltr", textAlign: "left" },
                                }]}
                                series={[{ data: field.yData, color: field.color, curve: "linear" }]}
                                height={400}
                                margin={{ top: 30, bottom: 50, left: 50, right: 80 }}
                                slotProps={{ legend: { hidden: true } }}
                                sx={{ "& .MuiMarkElement-root": { display: (d) => d.value === 0 ? "none" : "auto" } }}
                            />
                        </Box>
                        <Box
                            sx={{
                                minWidth: { xs: "100%", md: "220px" },
                                overflow: "auto",
                                pr: { xs: 0, md: 1 },
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: { xs: "center", md: "flex-start" },
                            }}
                        >
                            {field.xData.map((label, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr" }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: field.color, flexShrink: 0 }} />
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: "0.875rem", direction: "ltr", textAlign: "left" }}
                                    >
                                        {label} ({field.yData[idx]})
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ) : (
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
                            }}
                        >
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
                        <Box
                            sx={{
                                minWidth: { xs: "100%", md: "220px" },
                                overflow: "auto",
                                pr: { xs: 0, md: 1 },
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: { xs: "center", md: "flex-start" },
                            }}
                        >
                            {field.xData.map((label, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr" }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: field.color, flexShrink: 0 }} />
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: "0.875rem", direction: "ltr", textAlign: "left" }}
                                    >
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

const CrossBreakdownChart = ({ breakdownData, chartType, t }) => {
    if (!breakdownData?.segments?.length) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                {t.noBreakdownData}
            </Typography>
        );
    }

    const { options, segments } = breakdownData;
    const segmentColors = segments.map((_, idx) => getPieSegmentColor(idx + 5));
    const xAxisData = options.map((o) => o.text);

    if (chartType === "pie" || chartType === "donut") {
        return (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "flex-start", pt: 1 }}>
                {segments.map((seg, segIdx) => {
                    const pieData = seg.distribution
                        .filter((d) => d.count > 0)
                        .map((d, dIdx) => ({
                            id: dIdx,
                            value: d.count,
                            label: d.optionText,
                            color: getPieSegmentColor(dIdx),
                        }));
                    if (!pieData.length) return null;
                    const total = pieData.reduce((sum, d) => sum + d.value, 0);
                    return (
                        <Box key={seg.fieldValue} sx={{ textAlign: "center", minWidth: 180, maxWidth: 220 }}>
                            <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.5, color: "#1f2937" }}>
                                {seg.fieldValue}
                            </Typography>
                            <PieChart
                                series={[{
                                    data: pieData,
                                    innerRadius: chartType === "donut" ? 45 : 0,
                                    highlightScope: { faded: "global", highlighted: "item" },
                                    arcLabel: () => "",
                                }]}
                                height={180}
                                slotProps={{ legend: { hidden: true } }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {total} {total === 1 ? "vote" : t.totalVotesLabel}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        );
    }

    if (chartType === "line") {
        const lineSeries = segments.map((seg, segIdx) => ({
            label: seg.fieldValue,
            data: options.map((opt) => {
                const d = seg.distribution.find((d) => d.optionIndex === opt.index);
                return d?.count || 0;
            }),
            color: segmentColors[segIdx],
            curve: "linear",
        }));

        return (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, alignItems: { xs: "center", md: "stretch" } }}>
                <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                    <LineChart
                        xAxis={[{ scaleType: "point", data: xAxisData, tickLabelStyle: { direction: "ltr" } }]}
                        yAxis={[{ min: 0 }]}
                        series={lineSeries}
                        height={320}
                        margin={{ top: 20, bottom: 60, left: 50, right: 20 }}
                        slotProps={{ legend: { hidden: true } }}
                        sx={{
                            "& .MuiLineElement-root": { display: "none" },
                            "& .MuiChartsLegend-root": { display: "none" },
                        }}
                    />
                </Box>
                <Box
                    sx={{
                        minWidth: 140,
                        maxWidth: { xs: "100%", md: 200 },
                        maxHeight: 280,
                        overflow: "auto",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 0.75,
                        py: 1,
                        direction: "ltr",
                    }}
                >
                    {segments.map((seg, idx) => (
                        <Box key={seg.fieldValue} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: segmentColors[idx], flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#374151", whiteSpace: "nowrap" }}>
                                {seg.fieldValue}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    }

    let series;

    if (chartType === "normalized") {
        const optionTotals = options.map((opt) =>
            segments.reduce((sum, seg) => {
                const d = seg.distribution.find((d) => d.optionIndex === opt.index);
                return sum + (d?.count || 0);
            }, 0)
        );
        series = segments.map((seg, segIdx) => ({
            label: seg.fieldValue,
            data: options.map((opt, optIdx) => {
                const count = seg.distribution.find((d) => d.optionIndex === opt.index)?.count || 0;
                const total = optionTotals[optIdx];
                return total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0;
            }),
            color: segmentColors[segIdx],
            stack: "total",
            valueFormatter: (v) => `${v}%`,
        }));
    } else {
        series = segments.map((seg, segIdx) => ({
            label: seg.fieldValue,
            data: options.map((opt) => {
                const d = seg.distribution.find((d) => d.optionIndex === opt.index);
                return d?.count || 0;
            }),
            color: segmentColors[segIdx],
            ...(chartType === "stacked" ? { stack: "total" } : {}),
        }));
    }

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, alignItems: { xs: "center", md: "stretch" } }}>
            <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                <BarChart
                    xAxis={[{ scaleType: "band", data: xAxisData, tickLabelStyle: { direction: "ltr" } }]}
                    yAxis={chartType === "normalized" ? [{ min: 0, max: 100 }] : [{}]}
                    series={series}
                    height={320}
                    margin={{ top: 20, bottom: 60, left: 50, right: 20 }}
                    slotProps={{ legend: { hidden: true } }}
                />
            </Box>
            <Box
                sx={{
                    minWidth: 140,
                    maxWidth: { xs: "100%", md: 200 },
                    maxHeight: 280,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 0.75,
                    py: 1,
                    direction: "ltr",
                }}
            >
                {segments.map((seg, idx) => (
                    <Box key={seg.fieldValue} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: segmentColors[idx], flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#374151", whiteSpace: "nowrap" }}>
                            {seg.fieldValue}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const ResponsePatternSection = ({ questions, t }) => {
    const [open, setOpen] = useState(false);
    if (!questions?.length) return null;
    return (
        <Paper sx={{ borderRadius: 2, boxShadow: 2, overflow: "hidden" }}>
            <Box
                onClick={() => setOpen((prev) => !prev)}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: { xs: 1.5, sm: 2 }, cursor: "pointer", userSelect: "none", "&:hover": { backgroundColor: "#f9fafb" } }}
            >
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1f2937" }}>
                        {t.responsePattern}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t.responsePatternDesc}
                    </Typography>
                </Box>
                <IconButton size="small" sx={{ ml: 1, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}>
                    <ExpandMoreIcon fontSize="small" />
                </IconButton>
            </Box>
            <Collapse in={open}>
                <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 } }}>
                    <Stack spacing={2.5}>
                        {questions.map((q, qi) => {
                            const total = (q.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
                            return (
                                <Box key={String(q._id)}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: "#1f2937" }}>
                                        {q.question}
                                    </Typography>
                                    <Stack spacing={1}>
                                        {(q.options || []).map((opt, oi) => {
                                            const pct = total > 0 ? ((opt.votes || 0) / total) * 100 : 0;
                                            return (
                                                <Box key={oi}>
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">{opt.text}</Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ direction: "ltr", flexShrink: 0, ml: 1 }}>
                                                            {opt.votes || 0} ({pct.toFixed(1)}%)
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ height: 8, borderRadius: 4, backgroundColor: "#f3f4f6", overflow: "hidden" }}>
                                                        <Box sx={{ height: "100%", width: `${pct}%`, backgroundColor: getPieSegmentColor(oi), borderRadius: 4, transition: "width 0.5s ease" }} />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                    {qi < questions.length - 1 && <Divider sx={{ mt: 2 }} />}
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default function PollInsightsDashboard() {
    const { pollSlug } = useParams();
    const { t, dir, language } = useI18nLayout(translations);

    const [selectedFields, setSelectedFields] = useState([]);
    const [chartData, setChartData] = useState({});
    const [fieldParams, setFieldParams] = useState({});
    const [appliedParams, setAppliedParams] = useState({});
    const [generatingFields, setGeneratingFields] = useState({});
    const [availableFields, setAvailableFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartRefs, setChartRefs] = useState({});
    const [crossChartRefs, setCrossChartRefs] = useState({});
    const [exportLoading, setExportLoading] = useState(false);
    const [exportRawLoading, setExportRawLoading] = useState(false);
    const [chartTypeOverrides, setChartTypeOverrides] = useState({});
    const [summary, setSummary] = useState(null);
    const [pollInfo, setPollInfo] = useState(null);
    const [linkedEvent, setLinkedEvent] = useState(null);
    const [regFields, setRegFields] = useState([]);
    const [crossField, setCrossField] = useState(null);
    const [crossChartType, setCrossChartType] = useState("pie");
    const [crossBreakdownData, setCrossBreakdownData] = useState({});
    const [crossBreakdownLoading, setCrossBreakdownLoading] = useState(false);

    const pollId = pollInfo?._id;

    const handleVoteCast = useCallback((data) => {
        setSummary((prev) => {
            if (!prev) return prev;
            const totalVotes = (prev.totalVotes || 0) + 1;
            const uniqueVoters = data.isNewVoter ? (prev.uniqueVoters || 0) + 1 : (prev.uniqueVoters || 0);
            const participationRate = prev.totalRegistrations > 0
                ? parseFloat(((uniqueVoters / prev.totalRegistrations) * 100).toFixed(2))
                : prev.participationRate;
            const questionCount = data.questionCount ?? prev.questionCount;
            return { ...prev, totalVotes, uniqueVoters, participationRate, questionCount };
        });
    }, []);

    const handleQuestionCountChanged = useCallback((data) => {
        setSummary((prev) => {
            if (!prev) return prev;
            return { ...prev, questionCount: data.questionCount };
        });
    }, []);

    useVotecastSocket({ pollId, onVoteCast: handleVoteCast, onQuestionCountChanged: handleQuestionCountChanged });

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
            if (!pollSlug) return;
            setLoading(true);
            try {
                const [fieldsRes, summaryRes, pollRes] = await Promise.all([
                    getPollInsightsFields(pollSlug),
                    getPollInsightsSummary(pollSlug),
                    getPublicPollBySlug(pollSlug),
                ]);

                if (pollRes && !pollRes.error) {
                    setPollInfo(pollRes);
                    const eventId = pollRes.linkedEventRegId?._id || pollRes.linkedEventRegId;
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

                (fieldsRes?.data?.categoricalFields || []).forEach((f) => {
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
                setRegFields(fieldsRes?.data?.registrationFields || []);
            } catch (err) {
                console.error("Error loading poll insights:", err);
            }
            setLoading(false);
        };
        load();
    }, [pollSlug]);

    useEffect(() => {
        const fetchChartData = async () => {
            if (!selectedFields.length || !pollSlug || !availableFields.length) return;

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

                        const res = await getPollInsightsTimeDistribution(
                            pollSlug,
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

                        const res = await getPollInsightsDistribution(pollSlug, fieldName, useTopN);
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
    }, [selectedFields, pollSlug, availableFields, appliedParams]);

    useEffect(() => {
        if (!crossField || !pollInfo?.questions?.length || !pollSlug) return;
        const fetchCross = async () => {
            setCrossBreakdownLoading(true);
            const results = {};
            await Promise.all(
                (pollInfo.questions || []).map(async (q) => {
                    try {
                        const res = await getPollCrossBreakdown(pollSlug, crossField, String(q._id));
                        if (res?.data) results[String(q._id)] = res.data;
                    } catch {}
                })
            );
            setCrossBreakdownData(results);
            setCrossBreakdownLoading(false);
        };
        fetchCross();
    }, [crossField, pollSlug, pollInfo]);

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

            // Append cross breakdown charts if a cross field is selected and data is loaded
            if (crossField && !crossBreakdownLoading) {
                const crossFieldLabel = regFields.find((f) => f.name === crossField)?.label || crossField;
                (pollInfo?.questions || []).forEach((q) => {
                    const ref = crossChartRefs[String(q._id)];
                    if (ref && crossBreakdownData[String(q._id)]?.segments?.length) {
                        refs.push(ref);
                        labels.push(`${t.crossBreakdown}: ${crossFieldLabel}`);
                        chartDataArray.push({ chartType: "image" });
                    }
                });
            }

            const formatPdfDate = (d) => d ? dayjs(d).format("DD-MMM-YY, hh:mm a") : undefined;
            const pdfEventInfo = {
                name: pollInfo?.title || pollInfo?.slug || "",
                logoUrl: linkedEvent?.logoUrl || undefined,
                subtitle: linkedEvent?.name || undefined,
                subtitleLabel: t.eventName || "Event",
                startDateFormatted: formatPdfDate(linkedEvent?.startDate),
                endDateFormatted: formatPdfDate(linkedEvent?.endDate),
                venue: linkedEvent?.venue || undefined,
                // Poll KPI stats for the top card row in the PDF
                uniqueVoters: summary?.uniqueVoters,
                totalVotes: summary?.totalVotes,
                questionCount: summary?.questionCount,
                participationRate: summary?.participationRate ?? null,
                totalRegistrations: summary?.totalRegistrations,
                // Response pattern (unlinked polls only)
                responsePatternQuestions: !pollInfo?.linkedEventRegId ? (pollInfo?.questions || []) : undefined,
            };
            await exportChartsToPDF(refs, labels, chartDataArray, pdfEventInfo, null, language, dir, t, Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch (err) {
            console.error("PDF export failed:", err);
        }
        setExportLoading(false);
    };

    const handleExportRawData = () => {
        if (!selectedFields.length || !pollInfo) return;
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

            // Poll info section
            pushRow(t.pollTitle, pollInfo.title || "N/A");
            pushRow(t.totalVotes, leftAlign(summary?.totalVotes));
            if (summary?.participationRate != null) pushRow(t.participationRate, `${summary.participationRate}%`);
            pushRow(t.questionCount, leftAlign(summary?.questionCount));
            pushRow(t.timezone, getTimezoneLabel(timezone));
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

            // Cross Breakdown section
            if (crossField && Object.keys(crossBreakdownData).length > 0) {
                const crossFieldLabel = regFields.find((f) => f.name === crossField)?.label || crossField;
                pushRow(`=== ${t.crossBreakdown}: ${crossFieldLabel} ===`);
                wsData.push([]);

                (pollInfo?.questions || []).forEach((q) => {
                    const bd = crossBreakdownData[String(q._id)];
                    if (!bd?.segments?.length) return;

                    pushRow(q.question);

                    const segmentLabels = bd.segments.map((s) => s.fieldValue);
                    const headerRow = [t.category, ...segmentLabels];
                    if (language === "ar") wsData.push([...headerRow].reverse());
                    else wsData.push(headerRow);

                    bd.options.forEach((opt) => {
                        const counts = bd.segments.map((seg) => {
                            const d = seg.distribution.find((d) => d.optionIndex === opt.index);
                            return d?.count || 0;
                        });
                        const dataRow = [toNumericIfPossible(opt.text), ...counts];
                        if (language === "ar") wsData.push([...dataRow].reverse());
                        else wsData.push(dataRow);
                    });
                    wsData.push([]);
                });
            }

            // Response Pattern section (unlinked polls only)
            if (!pollInfo?.linkedEventRegId && pollInfo?.questions?.length) {
                pushRow(`=== ${t.responsePattern} ===`);
                wsData.push([]);
                pollInfo.questions.forEach((q) => {
                    pushRow(q.question);
                    const total = (q.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
                    const headerRow = [t.category, t.count, t.percentage];
                    if (language === "ar") wsData.push([...headerRow].reverse());
                    else wsData.push(headerRow);
                    (q.options || []).forEach((opt) => {
                        const pct = total > 0 ? ((opt.votes || 0) / total * 100).toFixed(1) : "0.0";
                        const dataRow = [toNumericIfPossible(opt.text), formatCount(opt.votes || 0), `${pct}%`];
                        if (language === "ar") wsData.push([...dataRow].reverse());
                        else wsData.push(dataRow);
                    });
                    wsData.push([]);
                });
            }

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            if (language === "ar") ws["!views"] = [{ rightToLeft: true }];
            XLSX.utils.book_append_sheet(wb, ws, "Insights Data");
            const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${pollInfo.slug || "poll"}_insights_raw_data.xlsx`;
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

            {/* KPI Summary Cards */}
            {summary && (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 150px" }}>
                        <KpiCard label={t.totalVotes} value={summary.totalVotes} />
                    </Box>
                    {summary.participationRate !== null && (
                        <Box sx={{ flex: "1 1 150px" }}>
                            <KpiCard label={t.participationRate} value={`${summary.participationRate}%`} />
                        </Box>
                    )}
                    <Box sx={{ flex: "1 1 150px" }}>
                        <KpiCard label={t.questionCount} value={summary.questionCount} />
                    </Box>
                </Box>
            )}

            {/* Response Pattern — unlinked polls only */}
            {!pollInfo?.linkedEventRegId && pollInfo?.questions?.length > 0 && (
                <ResponsePatternSection questions={pollInfo.questions} t={t} />
            )}

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

                {/* Cross Breakdown Section */}
                {regFields.length > 0 && (
                    <Paper sx={{ borderRadius: 2, boxShadow: 2, p: { xs: 1.5, sm: 2 } }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1f2937", mb: 0.5 }}>
                            {t.crossBreakdown}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t.crossBreakdownDesc}
                        </Typography>

                        {/* Registration field chips */}
                        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: crossField ? 2 : 0 }}>
                            {regFields.map((f) => (
                                <Chip
                                    key={f.name}
                                    label={f.label}
                                    onClick={() => {
                                        setCrossField((prev) => (prev === f.name ? null : f.name));
                                        setCrossBreakdownData({});
                                    }}
                                    sx={{
                                        backgroundColor: crossField === f.name ? FIELD_COLOR : "#ffffff",
                                        color: crossField === f.name ? "#ffffff" : "#374151",
                                        fontWeight: crossField === f.name ? 600 : 500,
                                        border: crossField === f.name ? "none" : "2px solid #e5e7eb",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            backgroundColor: crossField === f.name ? FIELD_COLOR : `${FIELD_COLOR}15`,
                                            color: crossField === f.name ? "#ffffff" : FIELD_COLOR,
                                            borderColor: FIELD_COLOR,
                                        },
                                    }}
                                />
                            ))}
                        </Stack>

                        {crossField && (
                            <>
                                {/* Chart type chips */}
                                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
                                    {[
                                        { id: "pie", label: "Pie" },
                                        { id: "donut", label: "Donut" },
                                        { id: "bar", label: "Bar" },
                                    ].map((ct) => (
                                        <Chip
                                            key={ct.id}
                                            label={ct.label}
                                            onClick={() => setCrossChartType(ct.id)}
                                            sx={{
                                                backgroundColor: crossChartType === ct.id ? FIELD_COLOR : "#ffffff",
                                                color: crossChartType === ct.id ? "#ffffff" : "#374151",
                                                fontWeight: crossChartType === ct.id ? 600 : 500,
                                                border: crossChartType === ct.id ? "none" : "2px solid #e5e7eb",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                "&:hover": {
                                                    backgroundColor: crossChartType === ct.id ? FIELD_COLOR : `${FIELD_COLOR}15`,
                                                    color: crossChartType === ct.id ? "#ffffff" : FIELD_COLOR,
                                                    borderColor: FIELD_COLOR,
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>

                                {crossBreakdownLoading ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <Stack spacing={2}>
                                        {(pollInfo?.questions || []).map((q) => {
                                            const bd = crossBreakdownData[String(q._id)];
                                            return (
                                                <Paper
                                                    key={String(q._id)}
                                                    variant="outlined"
                                                    sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}
                                                    ref={(el) => {
                                                        if (el) setCrossChartRefs((prev) => {
                                                            if (prev[String(q._id)] === el) return prev;
                                                            return { ...prev, [String(q._id)]: el };
                                                        });
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "#1f2937" }}>
                                                        {q.question}
                                                    </Typography>
                                                    <CrossBreakdownChart breakdownData={bd} chartType={crossChartType} t={t} />
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </>
                        )}
                    </Paper>
                )}
            </Stack>
        </Box>
    );
}
