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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
                    {!hideChartTypeSelection && (
                        <Box>
                            <Stack direction="row" spacing={1.5}>
                                {field.isSegmented && (field.type === "rating" || field.type === "nps") ? (
                                    ["bar", "average"].map((type) => (
                                        <Chip
                                            key={type}
                                            label={type === "bar" ? "Distribution" : "Average"}
                                            size="small"
                                            onClick={() => onChartTypeChange(type)}
                                            sx={{
                                                height: 24,
                                                px: 0.5,
                                                fontSize: "0.75rem",
                                                backgroundColor: chartType === type ? "#0077b6" : "#f3f4f6",
                                                fontWeight: 600,
                                                color: chartType === type ? "#ffffff" : "#6b7280",
                                                borderRadius: "20px",
                                                border: "none",
                                                "&:hover": { backgroundColor: chartType === type ? "#005f92" : "#e5e7eb" }
                                            }}
                                        />
                                    ))
                                ) : field.type === "time" ? (
                                    ["line", "bar"].map((type) => (
                                        <Chip
                                            key={type}
                                            label={type === "line" ? "Line" : "Bar"}
                                            size="small"
                                            onClick={() => onChartTypeChange(type)}
                                            sx={{
                                                height: 24,
                                                px: 0.5,
                                                fontSize: "0.75rem",
                                                backgroundColor: chartType === type ? "#0077b6" : "#f3f4f6",
                                                fontWeight: 600,
                                                color: chartType === type ? "#ffffff" : "#6b7280",
                                                borderRadius: "20px",
                                                border: "none",
                                                "&:hover": { backgroundColor: chartType === type ? "#005f92" : "#e5e7eb" }
                                            }}
                                        />
                                    ))
                                ) : field.allowedChartTypes ? (
                                    field.allowedChartTypes.map((type) => (
                                        <Chip
                                            key={type}
                                            label={type.charAt(0).toUpperCase() + type.slice(1)}
                                            size="small"
                                            onClick={() => onChartTypeChange(type)}
                                            sx={{
                                                height: 24,
                                                px: 0.5,
                                                fontSize: "0.75rem",
                                                backgroundColor: chartType === type ? "#0077b6" : "#f3f4f6",
                                                fontWeight: 600,
                                                color: chartType === type ? "#ffffff" : "#6b7280",
                                                borderRadius: "20px",
                                                border: "none",
                                                "&:hover": { backgroundColor: chartType === type ? "#005f92" : "#e5e7eb" }
                                            }}
                                        />
                                    ))
                                ) : (
                                    ["pie", "donut", "bar"].map((type) => (
                                        <Chip
                                            key={type}
                                            label={type === "pie" ? "Pie" : type === "donut" ? "Donut" : "Bar"}
                                            size="small"
                                            onClick={() => onChartTypeChange(type)}
                                            sx={{
                                                height: 24,
                                                px: 0.5,
                                                fontSize: "0.75rem",
                                                backgroundColor: chartType === type ? "#0077b6" : "#f3f4f6",
                                                fontWeight: 600,
                                                color: chartType === type ? "#ffffff" : "#6b7280",
                                                borderRadius: "20px",
                                                border: "none",
                                                "&:hover": { backgroundColor: chartType === type ? "#005f92" : "#e5e7eb" }
                                            }}
                                        />
                                    ))
                                )}
                            </Stack>
                        </Box>
                    )}
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                    {segmentFields && segmentFields.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="segment-select-label">Segment By</InputLabel>
                            <Select
                                labelId="segment-select-label"
                                value={selectedSegment || ""}
                                label="Segment By"
                                onChange={(e) => onSegmentChange(e.target.value || null)}
                                sx={{ borderRadius: 1.5 }}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {segmentFields.map((f) => (
                                    <MenuItem key={f.name} value={f.name}>
                                        {f.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
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
                                    data: field.data,
                                    innerRadius: chartType === "donut" ? 60 : 0,
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
                ) : chartType === "line" ? (
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
                ) : (chartType === "bar" || chartType === "average") ? (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 }, height: "100%", alignItems: { xs: "center", md: "stretch" } }}>
                        <Box sx={{ flex: { xs: "0 0 auto", md: 1 }, display: "flex", justifyContent: "center", alignItems: "center", width: { xs: "100%", md: "auto" } }}>
                            {field.isSegmented ? (
                                chartType === "average" ? (
                                    <BarChart
                                        xAxis={[{ 
                                            scaleType: "band", 
                                            data: field.averages.map(a => a.segment),
                                            tickLabelStyle: { direction: "ltr", textAlign: "left", fontSize: 10 }
                                        }]}
                                        series={[{
                                            label: "Average Rating",
                                            data: field.averages.map(a => a.average),
                                            color: field.color
                                        }]}
                                        height={400}
                                        margin={{ top: 30, bottom: 70, left: 50, right: 30 }}
                                    />
                                ) : (
                                    <BarChart
                                        xAxis={[{ 
                                            scaleType: "band", 
                                            data: field.segmentedData.xAxis,
                                            tickLabelStyle: { direction: "ltr", textAlign: "left", fontSize: 10 }
                                        }]}
                                        series={field.segmentedData.series}
                                        height={400}
                                        margin={{ top: 30, bottom: 70, left: 50, right: 30 }}
                                    />
                                )
                            ) : (
                                <BarChart
                                    xAxis={[{ 
                                        scaleType: "band", 
                                        data: field.type === "time" ? field.xData : field.data.map(d => d.label),
                                        tickLabelStyle: { direction: "ltr", textAlign: "left", fontSize: 10 }
                                    }]}
                                    yAxis={[{ 
                                        min: 0, 
                                        max: Math.max(...(field.type === "time" ? field.yData : field.data.map(d => d.value))) * 1.1,
                                        tickLabelStyle: { direction: "ltr", textAlign: "left" } 
                                    }]}
                                    series={[{ 
                                        data: field.type === "time" ? field.yData : field.data.map(d => d.value), 
                                        color: field.color 
                                    }]}
                                    height={400}
                                    margin={{ top: 30, bottom: 70, left: 50, right: 30 }}
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
                ) : null}
            </Box>
        </Box>
    );
};

export default ChartVisualization;
