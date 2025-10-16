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
  getAvailableFields,
  getFieldDistribution,
  getTimeDistribution,
  getScannedByTypeDistribution,
  getScannedByUserDistribution,
} from "@/services/eventreg/insightsService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import ICONS from "@/utils/iconUtil";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import useI18nLayout from "@/hooks/useI18nLayout";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { exportChartsToPDF } from "@/components/pdfExportCharts";
import { Button, CircularProgress } from "@mui/material";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

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
          <LineChart
            xAxis={[
              {
                scaleType: "point",
                data: field.xData,
                tickLabelStyle: {
                  direction: "ltr",
                  textAlign: "left",
                },
              },
            ]}
            yAxis={[
              {
                min: 0,
                max:
                  Math.max(...field.yData) +
                  Math.ceil(Math.max(...field.yData) * 0.05), //add 5% padding
                tickLabelStyle: {
                  direction: "ltr", // Force LTR for x-axis labels
                  textAlign: "left", // Ensure text alignment is consistent
                },
              },
            ]}
            series={[
              {
                data: field.yData,
                color: field.color,
                curve: "linear",
              },
            ]}
            height={400}
            margin={{ top: 30, bottom: 50, left: 50, right: 80 }}
            slotProps={{
              legend: { hidden: true },
            }}
            sx={{
              "& .MuiMarkElement-root": {
                display: (d) => (d.value === 0 ? "none" : "auto"),
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default function AnalyticsDashboard() {
  const { eventSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);
  const [selectedFields, setSelectedFields] = useState([]);
  const [chartData, setChartData] = useState({});
  const [fieldParams, setFieldParams] = useState({});
  const [appliedParams, setAppliedParams] = useState({});
  const [generatingFields, setGeneratingFields] = useState({});
  const [availableFields, setAvailableFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartRefs, setChartRefs] = useState({});
  const [exportLoading, setExportLoading] = useState(false);
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
    const fetchFields = async () => {
      if (!eventSlug) return;

      try {
        setLoading(true);
        const [fieldsResponse, eventResponse] = await Promise.all([
          getAvailableFields(eventSlug),
          getPublicEventBySlug(eventSlug),
        ]);

        const eventData =
          eventResponse?.data?.event || eventResponse?.data || eventResponse;
        console.log("Event data structure:", eventData);
        setEventInfo(eventData);
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

      await exportChartsToPDF(refs, labels, chartDataArray, eventInfo);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
    setExportLoading(false);
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
