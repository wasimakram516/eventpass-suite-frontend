"use client";

import React from "react";
import {
    Box,
    TextField,
    Typography,
    Chip,
    Stack,
    Button,
    CircularProgress,
    Divider,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import useI18nLayout from "@/hooks/useI18nLayout";
import { toArabicDigits } from "@/utils/arabicDigits";
import { useEffect } from "react";

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

const ChartVisualization = ({
    selectedField,
    chartData,
    chartType,
    onChartTypeChange,
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
    hideChartTypeSelection = false,
    language = "en",
    segmentFields = null,
    selectedSegment = null,
    onSegmentChange = null,
}) => {
    const { dir } = useI18nLayout();

    useEffect(() => {
        if (language === "ar") {
            const container = document.getElementById(`chart-container-${selectedField}`);
            if (container) {
                const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
                let node;
                while (node = walker.nextNode()) {
                    if (node.nodeValue && /\d/.test(node.nodeValue)) {
                        node.nodeValue = toArabicDigits(node.nodeValue, language);
                    }
                }
            }
        }
    }, [language, selectedField, chartData]);

    const containerRef = React.useRef(null);

    useEffect(() => {
        if (onRefReady && containerRef.current) {
            onRefReady(containerRef.current);
        }
    }, [onRefReady, selectedField]);

    if (!selectedField || !chartData[selectedField]) {
        return null;
    }

    const field = chartData[selectedField];

    if (!field) return null;

    const showTopNControl = field.type === "text" || field.type === "number";
    const showIntervalControl = field.type === "time";
    const showGenerateButton = showTopNControl || showIntervalControl;
    const hasNoData =
        (chartType === "pie" || chartType === "donut") && (!field.data || field.data.length === 0);

    return (
        <Box 
            id={`chart-container-${selectedField}`}
            ref={containerRef}
            sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2, width: "100%" }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${field.color}15`, borderRadius: 1, p: 1, width: 48, height: 48, flexShrink: 0 }}>
                        <ICONS.insights />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1f2937" }}>
                            {field.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {selectedSegment ? "Total Completions" : (chartType === "line" ? "Historical Trend" : "Distribution Overview")}
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

            {!hideChartTypeSelection && (
                <Box sx={{ mb: 1.5 }}>
                    <Stack direction="column" spacing={1.5}>
                        {segmentFields && segmentFields.length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", mr: 1 }}>
                                    {t.segmentBy || "Segment By"}
                                </Typography>
                                {segmentFields.map((f) => (
                                    <Chip
                                        key={f.name}
                                        label={f.label}
                                        size="small"
                                        onClick={() => onSegmentChange(selectedSegment === f.name ? null : f.name)}
                                        sx={{
                                            cursor: "pointer",
                                            fontWeight: selectedSegment === f.name ? 600 : 400,
                                            backgroundColor: selectedSegment === f.name ? field.color : "transparent",
                                            color: selectedSegment === f.name ? "#fff" : "#374151",
                                            border: `1.5px solid ${selectedSegment === f.name ? field.color : "#e5e7eb"}`,
                                            "&:hover": {
                                                backgroundColor: selectedSegment === f.name ? field.color : `${field.color}15`,
                                                borderColor: field.color,
                                                color: selectedSegment === f.name ? "#fff" : field.color,
                                            },
                                        }}
                                    />
                                ))}
                            </Stack>
                        )}
                        
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {field.isSegmented && (field.type === "rating" || field.type === "nps") ? (
                                ["bar", "average"].map((type) => (
                                <Chip
                                    key={type}
                                    label={type === "bar" ? "Distribution" : "Average"}
                                    size="small"
                                    onClick={() => onChartTypeChange(type)}
                                    sx={{
                                        cursor: "pointer",
                                        fontWeight: chartType === type ? 600 : 400,
                                        backgroundColor: chartType === type ? field.color : "transparent",
                                        color: chartType === type ? "#fff" : "#374151",
                                        border: `1.5px solid ${chartType === type ? field.color : "#e5e7eb"}`,
                                        "&:hover": {
                                            backgroundColor: chartType === type ? field.color : `${field.color}15`,
                                            borderColor: field.color,
                                            color: chartType === type ? "#fff" : field.color,
                                        },
                                    }}
                                />
                            ))
                        ) : field.type === "time" ? (
                            ["line", "bar", "horizontalBar", "heatmap"].map((type) => (
                                <Chip
                                    key={type}
                                    label={
                                        type === "line" ? "Line" : 
                                        type === "bar" ? "Vertical Bar" : 
                                        type === "horizontalBar" ? "Horizontal Bar" :
                                        "Heatmap"
                                    }
                                    size="small"
                                    onClick={() => onChartTypeChange(type)}
                                    sx={{
                                        cursor: "pointer",
                                        fontWeight: chartType === type ? 600 : 400,
                                        backgroundColor: chartType === type ? field.color : "transparent",
                                        color: chartType === type ? "#fff" : "#374151",
                                        border: `1.5px solid ${chartType === type ? field.color : "#e5e7eb"}`,
                                        "&:hover": {
                                            backgroundColor: chartType === type ? field.color : `${field.color}15`,
                                            borderColor: field.color,
                                            color: chartType === type ? "#fff" : field.color,
                                        },
                                    }}
                                />
                            ))
                        ) : field.allowedChartTypes ? (
                            [[...field.allowedChartTypes, "horizontalBar"].filter((t, i, a) => t !== "donut" && a.indexOf(t) === i)].flat().map((type) => (
                                <Chip
                                    key={type}
                                    label={
                                        type === "bar" ? "Vertical Bar" :
                                        type === "horizontalBar" ? "Horizontal Bar" :
                                        type === "pie" ? "Pie" :
                                        type.charAt(0).toUpperCase() + type.slice(1)
                                    }
                                    size="small"
                                    onClick={() => onChartTypeChange(type)}
                                    sx={{
                                        cursor: "pointer",
                                        fontWeight: chartType === type ? 600 : 400,
                                        backgroundColor: chartType === type ? field.color : "transparent",
                                        color: chartType === type ? "#fff" : "#374151",
                                        border: `1.5px solid ${chartType === type ? field.color : "#e5e7eb"}`,
                                        "&:hover": {
                                            backgroundColor: chartType === type ? field.color : `${field.color}15`,
                                            borderColor: field.color,
                                            color: chartType === type ? "#fff" : field.color,
                                        },
                                    }}
                                />
                            ))
                        ) : (
                            ["pie", "bar", "horizontalBar"].map((type) => (
                                <Chip
                                    key={type}
                                    label={
                                        type === "pie" ? "Pie" : 
                                        type === "bar" ? "Vertical Bar" : 
                                        "Horizontal Bar"
                                    }
                                    size="small"
                                    onClick={() => onChartTypeChange(type)}
                                    sx={{
                                        cursor: "pointer",
                                        fontWeight: chartType === type ? 600 : 400,
                                        backgroundColor: chartType === type ? field.color : "transparent",
                                        color: chartType === type ? "#fff" : "#374151",
                                        border: `1.5px solid ${chartType === type ? field.color : "#e5e7eb"}`,
                                        "&:hover": {
                                            backgroundColor: chartType === type ? field.color : `${field.color}15`,
                                            borderColor: field.color,
                                            color: chartType === type ? "#fff" : field.color,
                                        },
                                    }}
                                />
                            ))
                        )}
                    </Stack>
                </Stack>
            </Box>
            )}

            <Box sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column" }}>
                {hasNoData ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <Typography variant="body1" color="textSecondary">{t.noData || "No data to display"}</Typography>
                    </Box>
                ) : (chartType === "pie" || chartType === "donut") ? (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 }, height: "100%", alignItems: { xs: "center", md: "stretch" } }}>
                        <Box sx={{ flex: { xs: "0 0 auto", md: 1 }, display: "flex", justifyContent: "center", alignItems: "center", width: { xs: "100%", md: "auto" } }}>
                            <PieChart
                                series={[{
                                    data: field.isSegmented ? field.segmentedData.xAxis.map((label, xIdx) => {
                                        const value = field.segmentedData.series.reduce((sum, s) => sum + (s.data[xIdx] || 0), 0);
                                        return {
                                            id: label,
                                            label: label,
                                            value: value
                                        };
                                    }) : field.data,
                                    innerRadius: chartType === "donut" ? 60 : 0,
                                    highlightScope: { faded: "global", highlighted: "item" },
                                    faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
                                    arcLabel: () => "",
                                    valueFormatter: (item) => {
                                        const dataToSum = field.isSegmented ? field.segmentedData.xAxis.map((_, xIdx) => 
                                            field.segmentedData.series.reduce((sum, s) => sum + (s.data[xIdx] || 0), 0)
                                        ) : field.data.map(d => d.value);
                                        const total = dataToSum.reduce((sum, v) => sum + v, 0);
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
                            {field.isSegmented ? (
                                field.segmentedData.xAxis.map((label, xIdx) => {
                                    const val = field.segmentedData.series.reduce((sum, s) => sum + (s.data[xIdx] || 0), 0);
                                    const total = field.segmentedData.xAxis.reduce((tSum, _, idx) => 
                                        tSum + field.segmentedData.series.reduce((sSum, s) => sSum + (s.data[idx] || 0), 0), 0);
                                    const percentage = total > 0 ? String(parseFloat(((val / total) * 100).toFixed(1))) : "0";
                                    return (
                                        <Box key={xIdx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, direction: "ltr", ml: { xs: 0, md: 1 } }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: "#1f2937", whiteSpace: "nowrap", fontSize: "0.875rem", direction: "ltr", textAlign: "left" }}>
                                                {label} {percentage}% ({val})
                                            </Typography>
                                        </Box>
                                    );
                                })
                            ) : (
                                field.data.map((item, idx) => {
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
                                })
                            )}
                        </Box>
                    </Box>
                ) : chartType === "line" ? (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 }, height: "100%", alignItems: { xs: "center", md: "stretch" } }}>
                        <Box sx={{ flex: { xs: "0 0 auto", md: 1 }, display: "flex", justifyContent: "center", alignItems: "center", width: { xs: "100%", md: "auto" } }}>
                            <LineChart
                                xAxis={[{ scaleType: "point", data: field.isSegmented ? (field.segmentedData?.xAxis || []) : (field.xData || []), tickLabelStyle: { direction: "ltr", textAlign: "left" } }]}
                                yAxis={[{ min: 0, max: Math.max(0, ...(field.isSegmented ? (field.segmentedData?.series?.flatMap(s => s.data) || [0]) : (field.yData || [0]))) + Math.ceil(Math.max(0, ...(field.isSegmented ? (field.segmentedData?.series?.flatMap(s => s.data) || [0]) : (field.yData || [0]))) * 0.05), tickLabelStyle: { direction: "ltr", textAlign: "left" } }]}
                                series={field.isSegmented ? (field.segmentedData?.series || []).map(s => ({ data: s.data || [], color: s.color, label: s.label, curve: "linear" })) : [{ data: field.yData || [], color: field.color, curve: "linear" }]}
                                height={400}
                                margin={{ top: 30, bottom: 50, left: 50, right: 80 }}
                                slotProps={{ legend: { hidden: !field.isSegmented } }}
                                sx={{ "& .MuiMarkElement-root": { display: (d) => d.value === 0 ? "none" : "auto" } }}
                            />
                        </Box>
                        {!field.isSegmented && (
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
                        )}
                    </Box>
                ) : (chartType === "bar" || chartType === "horizontalBar" || chartType === "average") ? (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 }, height: "100%", alignItems: { xs: "center", md: "stretch" } }}>
                        <Box sx={{ flex: { xs: "0 0 auto", md: 1 }, display: "flex", justifyContent: "center", alignItems: "center", width: { xs: "100%", md: "auto" }, minHeight: 400 }}>
                            {(!field || (chartType !== "average" && !field.data && !field.segmentedData && !field.xData)) ? (
                                <CircularProgress />
                            ) : field.isSegmented ? (
                                <BarChart
                                    key={`segmented-${chartType}-${selectedField}`}
                                    layout={chartType === "horizontalBar" ? "horizontal" : "vertical"}
                                    xAxis={chartType === "horizontalBar" ? [{ 
                                        label: t.count || "Count",
                                        tickLabelStyle: { direction: "ltr", textAlign: "left", fontSize: 10 } 
                                    }] : [{ 
                                        scaleType: "band", 
                                        data: chartType === "average" ? (field.averages?.map(a => a.segment) || []) : (field.segmentedData?.xAxis || []),
                                        tickLabelStyle: { direction: "ltr", textAlign: "left", fontSize: 10 },
                                        colorMap: chartType === "average" ? {
                                            type: 'ordinal',
                                            colors: field.averages?.map((_, i) => field.data?.[i]?.color || field.color) || [field.color],
                                            values: field.averages?.map(a => a.segment) || []
                                        } : undefined
                                    }]}
                                    yAxis={chartType === "horizontalBar" ? [{ 
                                        scaleType: "band", 
                                        data: field.segmentedData?.xAxis || [],
                                        tickLabelStyle: { direction: "ltr", textAlign: "right", fontSize: 10 }
                                    }] : [{ 
                                        label: chartType === "average" ? (t.averageRating || "Average Rating") : (t.count || "Count"),
                                        tickLabelStyle: { direction: "ltr", textAlign: "left" } 
                                    }]}
                                    series={chartType === "average" ? [{ 
                                        label: "Average Rating", 
                                        data: field.averages?.map(a => a.average) || [], 
                                        color: field.color,
                                    }] : (field.segmentedData?.series || [])}
                                    height={400}
                                    margin={{ top: 30, bottom: 70, left: chartType === "horizontalBar" ? 100 : 50, right: 30 }}
                                />
                            ) : (
                                <BarChart
                                    key={`standard-${chartType}-${selectedField}`}
                                    layout={chartType === "horizontalBar" ? "horizontal" : "vertical"}
                                    xAxis={chartType === "horizontalBar" ? [{ 
                                        label: t.count || "Count",
                                        tickLabelStyle: { direction: "ltr", textAlign: "left", fontSize: 10 } 
                                    }] : [{ 
                                        scaleType: "band", 
                                        data: field.type === "time" ? (field.xData || []) : (field.data?.map(d => d.label) || []),
                                        tickLabelStyle: { direction: "ltr", textAlign: "left", fontSize: 10 },
                                        colorMap: (field.type !== "time" && !field.isSegmented) ? {
                                            type: 'ordinal',
                                            colors: field.data?.map(d => d.color || field.color) || [field.color],
                                            values: field.data?.map(d => d.label) || []
                                        } : (field.type === "time" && !field.isSegmented ? {
                                            type: 'ordinal',
                                            colors: field.xData?.map((_, i) => getPieSegmentColor(i)) || [field.color],
                                            values: field.xData || []
                                        } : undefined)
                                    }]}
                                    yAxis={chartType === "horizontalBar" ? [{ 
                                        scaleType: "band", 
                                        data: field.type === "time" ? (field.xData || []) : (field.data?.map(d => d.label) || []),
                                        tickLabelStyle: { direction: "ltr", textAlign: "right", fontSize: 10 },
                                        colorMap: (field.type !== "time" && !field.isSegmented) ? {
                                            type: 'ordinal',
                                            colors: field.data?.map(d => d.color || field.color) || [field.color],
                                            values: field.data?.map(d => d.label) || []
                                        } : (field.type === "time" && !field.isSegmented ? {
                                            type: 'ordinal',
                                            colors: field.xData?.map((_, i) => getPieSegmentColor(i)) || [field.color],
                                            values: field.xData || []
                                        } : undefined)
                                    }] : [{ 
                                        label: t.count || "Count",
                                        min: 0, 
                                        max: (Math.max(0, ...(field.type === "time" ? (field.yData?.length ? field.yData : [0]) : (field.data?.length ? field.data.map(d => d.value) : [0])))) * 1.1,
                                        tickLabelStyle: { direction: "ltr", textAlign: "left" } 
                                    }]}
                                    series={[{ 
                                        data: field.type === "time" ? (field.yData || []) : (field.data?.map(d => d.value) || []), 
                                        color: field.color,
                                    }]}
                                    height={400}
                                    margin={{ top: 30, bottom: 70, left: chartType === "horizontalBar" ? 100 : 50, right: 30 }}
                                    slotProps={{ legend: { hidden: true } }}
                                />
                            )}
                        </Box>
                        {!field.isSegmented && field.type !== "time" && (
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
                        )}
                    </Box>
                ) : chartType === "heatmap" ? (
                    <Box sx={{ height: 400, width: "100%", py: 2 }}>
                        <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: "60px repeat(24, 1fr)", height: "100%", width: "100%" }}>
                                <Box />
                                {Array.from({ length: 24 }).map((_, h) => (
                                    <Typography key={h} variant="caption" sx={{ textAlign: "center", color: "text.secondary", fontSize: "9px" }}>
                                        {h}h
                                    </Typography>
                                ))}
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, dIdx) => {
                                    const dayNum = dIdx;
                                    const start = startDateTime ? new Date(startDateTime) : null;
                                    const end = endDateTime ? new Date(endDateTime) : null;

                                    return (
                                        <React.Fragment key={dayName}>
                                            <Typography variant="caption" sx={{ display: "flex", alignItems: "center", fontWeight: 600, color: "text.secondary" }}>
                                                {dayName}
                                            </Typography>
                                            {Array.from({ length: 24 }).map((_, h) => {
                                                let count = 0;
                                                if (field.type === "time" && field.xData && field.yData) {
                                                    field.xData.forEach((ts, idx) => {
                                                        const date = new Date(ts);
                                                        if (start && date < start) return;
                                                        if (end && date > end) return;
                                                        
                                                        if (!isNaN(date.getTime()) && date.getDay() === dayNum && date.getHours() === h) {
                                                            count += (field.yData[idx] || 0);
                                                        }
                                                    });
                                                }

                                                const maxVal = field.type === "time" && field.yData 
                                                    ? Math.max(...field.yData, 1) 
                                                    : 1;
                                                
                                                const alpha = count > 0 ? 0.2 + (count / maxVal) * 0.8 : 0.05;

                                                return (
                                                    <Box
                                                        key={h}
                                                        title={`${dayName}, ${h}:00 - ${count} activities`}
                                                        sx={{
                                                            m: 0.1,
                                                            borderRadius: 0.5,
                                                            backgroundColor: count > 0 ? field.color : "#f3f4f6",
                                                            opacity: alpha,
                                                            aspectRatio: "1/1",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "transform 0.2s",
                                                            "&:hover": { transform: "scale(1.2)", opacity: 1, zIndex: 1, cursor: "pointer", boxShadow: 2 }
                                                        }}
                                                    >
                                                        {count > 0 && (
                                                            <Typography sx={{ color: alpha > 0.6 ? "#fff" : "#000", fontSize: "8px", fontWeight: "bold" }}>
                                                                {count}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </Box>
                        </Box>
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
};

export default ChartVisualization;
