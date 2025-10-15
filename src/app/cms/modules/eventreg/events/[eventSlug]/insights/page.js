'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    TextField,
    Paper,
    Typography,
    Chip,
    Stack,
    Divider
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import {
    Search as SearchIcon,
    BarChart as BarChartIcon
} from '@mui/icons-material';
import {
    getAvailableFields,
    getFieldDistribution,
    getTimeDistribution,
    getScannedByTypeDistribution,
    getScannedByUserDistribution
} from '@/services/eventreg/insightsService';
import ICONS from "@/utils/iconUtil";
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import useI18nLayout from '@/hooks/useI18nLayout';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { exportChartsToPDF } from '@/utils/pdfExportCharts';
import { Button, CircularProgress } from '@mui/material';
import getStartIconSpacing from '@/utils/getStartIconSpacing';

const translations = {
    en: {
        pageTitle: "Insights",
        pageDescription: "Analyze event data and visualize key metrics through interactive charts and distributions.",
        searchPlaceholder: "Search fields...",
        availableFields: "Available Fields",
        selectFieldPrompt: "Select a field to view insights",
        distributionOverview: "Distribution Overview",
        historicalTrend: "Historical Trend",
        topN: "Top N",
        from: "From",
        to: "To",
        intervalMinutes: "Interval (min)",
        exportInsights: "Export Insights",
        exporting: "Exporting...",
    },
    ar: {
        pageTitle: "التحليلات",
        pageDescription: "تحليل بيانات الحدث وتصور المقاييس الرئيسية من خلال الرسوم البيانية والتوزيعات التفاعلية.",
        searchPlaceholder: "بحث في الحقول...",
        availableFields: "الحقول المتاحة",
        selectFieldPrompt: "اختر حقلاً لعرض التحليلات",
        distributionOverview: "نظرة عامة على التوزيع",
        historicalTrend: "الاتجاه التاريخي",
        topN: "أعلى N",
        from: "من",
        to: "إلى",
        intervalMinutes: "الفاصل الزمني (دقيقة)",
        exportInsights: "تصدير التحليلات",
        exporting: "جاري التصدير...",
    },
};

const fieldColors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#a855f7', '#eab308'
];

const getFieldColor = (index) => fieldColors[index % fieldColors.length];

const determineChartType = (field) => {
    if (field.type === 'time') return 'line';
    return 'pie';
};
dayjs.extend(utc);
const FieldChip = ({ field, isSelected, onClick }) => {
    return (
        <Chip
            label={field.label}
            onClick={onClick}
            sx={{
                backgroundColor: isSelected ? field.color : '#ffffff',
                color: isSelected ? '#ffffff' : '#374151',
                fontWeight: isSelected ? 600 : 500,
                border: isSelected ? 'none' : '2px solid #e5e7eb',
                boxShadow: isSelected ? `0 8px 20px -4px ${field.color}60` : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease-out',
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 4px 12px ${field.color}40`,
                    backgroundColor: isSelected ? field.color : `${field.color}15`,
                    color: isSelected ? '#ffffff' : field.color,
                    borderColor: field.color
                }
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
    startDateTime,
    endDateTime,
    topN,
    intervalMinutes,
    t,
    onRefReady
}) => {
    if (!selectedField || !chartData[selectedField]) {
        return null;
    }

    const field = chartData[selectedField];

    if (!field) return null;

    const getChartDescription = () => {
        if (field.chartType === 'pie') return t.distributionOverview;
        return t.historicalTrend;
    };

    const showTopNControl = field.type === 'text' || field.type === 'number';
    const showIntervalControl = field.type === 'time';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${field.color}15`,
                            borderRadius: 1,
                            p: 1,
                            width: 48,
                            height: 48,
                            flexShrink: 0
                        }}
                    >
                        <ICONS.insights />
                    </Box>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 'bold', color: '#1f2937' }}
                        >
                            {field.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {getChartDescription()}
                        </Typography>
                    </Box>
                </Box>

                {showTopNControl && (
                    <TextField
                        label={t.topN}
                        type="number"
                        size="small"
                        value={topN}
                        onChange={(e) => onTopNChange(parseInt(e.target.value) || 5)}
                        InputProps={{ inputProps: { min: 1, max: 50 } }}
                        sx={{ width: '120px' }}
                    />
                )}

                {showIntervalControl && (
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <DateTimePicker
                            label={t.from}
                            value={startDateTime}
                            onChange={(val) => onStartDateTimeChange(val)}
                            ampm={false}
                            format="DD/MM/YYYY HH:mm"
                            slotProps={{ textField: { size: 'small', sx: { width: '200px' } } }}
                        />
                        <DateTimePicker
                            label={t.to}
                            value={endDateTime}
                            onChange={(val) => onEndDateTimeChange(val)}
                            ampm={false}
                            format="DD/MM/YYYY HH:mm"
                            slotProps={{ textField: { size: 'small', sx: { width: '200px' } } }}
                        />
                        <TextField
                            label={t.intervalMinutes}
                            type="number"
                            size="small"
                            value={intervalMinutes}
                            onChange={(e) => onIntervalChange(parseInt(e.target.value) || 60)}
                            InputProps={{ inputProps: { min: 1, max: 1440 } }}
                            sx={{ width: '140px' }}
                        />
                    </Box>
                )}
            </Box>

            <Box
                ref={(el) => onRefReady && onRefReady(el)}
                sx={{ flex: 1, minHeight: 0, width: '100%' }}
            >
                {field.chartType === 'pie' ? (
                    <PieChart
                        series={[
                            {
                                data: field.data,
                                highlightScope: { faded: 'global', highlighted: 'item' },
                                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                arcLabel: (item) => `${((item.value / field.data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%`,
                                arcLabelMinAngle: 35
                            }
                        ]}
                        height={400}
                        slotProps={{
                            legend: { hidden: true },
                            pieArcLabel: {
                                style: {
                                    fill: 'white',
                                    fontWeight: 600,
                                    fontSize: 'clamp(10px, 2vw, 14px)'
                                }
                            }
                        }}
                    />
                ) : (
                    <LineChart
                        xAxis={[{
                            scaleType: 'point',
                            data: field.xData
                        }]}
                        yAxis={[
                            {
                                min: 0,
                                max: Math.max(...field.yData) + Math.ceil(Math.max(...field.yData) * 0.05) //add 5% padding
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
                )}
            </Box>
        </Box>
    );
};

export default function AnalyticsDashboard() {
    const { eventSlug } = useParams();
    const { t, dir } = useI18nLayout(translations);
    const [selectedFields, setSelectedFields] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableFields, setAvailableFields] = useState([]);
    const [chartData, setChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [fieldParams, setFieldParams] = useState({});
    const [chartRefs, setChartRefs] = useState({});
    const [exportLoading, setExportLoading] = useState(false);

    const getFieldParam = (fieldName, paramName, defaultValue) => {
        return fieldParams[fieldName]?.[paramName] ?? defaultValue;
    };

    const updateFieldParam = (fieldName, paramName, value) => {
        setFieldParams(prev => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                [paramName]: value
            }
        }));
    };

    useEffect(() => {
        const fetchFields = async () => {
            if (!eventSlug) return;

            try {
                setLoading(true);
                const response = await getAvailableFields(eventSlug);

                const allFields = [
                    ...response.data.categoricalFields
                        .filter(f => f.name !== 'token')
                        .map((f, idx) => ({
                            ...f,
                            chartType: determineChartType(f),
                            color: getFieldColor(idx)
                        })),
                    ...response.data.timeFields
                        .filter(f => f.name !== 'token')
                        .map((f, idx) => ({
                            ...f,
                            chartType: 'line',
                            color: getFieldColor(response.data.categoricalFields.length + idx)
                        }))
                ];

                allFields.push(
                    {
                        name: 'scannedByType',
                        label: 'Scanned By Staff Type',
                        type: 'special',
                        chartType: 'pie',
                        color: getFieldColor(allFields.length)
                    },
                    {
                        name: 'scannedByUser',
                        label: 'Scanned By Staff Name',
                        type: 'special',
                        chartType: 'pie',
                        color: getFieldColor(allFields.length + 1)
                    }
                );

                setAvailableFields(allFields);
            } catch (error) {
                console.error('Error loading fields:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFields();
    }, [eventSlug]);



    useEffect(() => {
        const fetchChartData = async () => {
            if (selectedFields.length === 0 || !eventSlug || availableFields.length === 0) return;

            for (const fieldName of selectedFields) {
                const field = availableFields.find(f => f.name === fieldName);
                if (!field) continue;

                const topN = getFieldParam(fieldName, 'topN', 10);
                const intervalMinutes = getFieldParam(fieldName, 'intervalMinutes', 60);
                const startDateTime = getFieldParam(fieldName, 'startDateTime', dayjs().subtract(30, 'day').startOf('day'));
                const endDateTime = getFieldParam(fieldName, 'endDateTime', dayjs().endOf('day'));

                try {
                    let response;
                    if (field.type === 'time') {
                        const start = new Date(`${startDateTime.format('YYYY-MM-DD')}T${startDateTime.format('HH:mm:ss')}Z`);
                        const end = new Date(`${endDateTime.format('YYYY-MM-DD')}T${endDateTime.format('HH:mm:ss')}Z`);
                        response = await getTimeDistribution(eventSlug, fieldName, start, end, intervalMinutes);

                        const startTimeUTC = start.getTime();
                        const endTimeUTC = end.getTime();

                        const filteredData = response.data.data.filter(d => {
                            const pointTime = dayjs.utc(d.timestamp).valueOf();
                            return d.count > 0 && pointTime >= startTimeUTC && pointTime <= endTimeUTC;
                        });

                        const xData = filteredData.map(d => {
                            const [datePart, timePart] = d.timestamp.split('T');
                            const [year, month, day] = datePart.split('-');
                            const time = timePart.slice(0, 5);
                            return `${day}/${month}, ${time}`;
                        });
                        const yData = filteredData.map(d => d.count);

                        setChartData(prev => ({
                            ...prev,
                            [fieldName]: { ...field, xData, yData }
                        }));
                    } else if (fieldName === 'scannedByType' || fieldName === 'scannedByUser') {
                        response = fieldName === 'scannedByType'
                            ? await getScannedByTypeDistribution(eventSlug)
                            : await getScannedByUserDistribution(eventSlug);

                        const data = response.data.data.map((item, idx) => ({
                            id: idx,
                            value: item.value,
                            label: item.label,
                            color: getFieldColor(idx)
                        }));

                        setChartData(prev => ({
                            ...prev,
                            [fieldName]: { ...field, data }
                        }));
                    } else {
                        const useTopN = field.type === 'text' || field.type === 'number' ? topN : null;
                        response = await getFieldDistribution(eventSlug, fieldName, useTopN);

                        const data = response.data.data.map((item, idx) => ({
                            id: idx,
                            value: item.value,
                            label: item.label,
                            color: getFieldColor(idx)
                        }));

                        setChartData(prev => ({
                            ...prev,
                            [fieldName]: { ...field, data }
                        }));
                    }
                } catch (error) {
                    console.error(`Error loading chart data for ${fieldName}:`, error);
                }
            }
        };

        fetchChartData();
    }, [selectedFields, eventSlug, availableFields, fieldParams]);

    const handleExportPDF = async () => {
        if (selectedFields.length === 0) return;

        setExportLoading(true);
        try {
            const refs = selectedFields
                .map(fieldName => chartRefs[fieldName])
                .filter(Boolean);

            const labels = selectedFields.map(fieldName => {
                const field = availableFields.find(f => f.name === fieldName);
                return field?.label || fieldName;
            });

            const chartDataArray = selectedFields.map(fieldName => chartData[fieldName]);

            await exportChartsToPDF(refs, labels, chartDataArray);
        } catch (error) {
            console.error('PDF export failed:', error);
        }
        setExportLoading(false);
    };


    const filteredFields = useMemo(() => {
        return availableFields.filter(field =>
            field.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, availableFields]);

    return (
        <Box
            dir={dir}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                p: { xs: 1, sm: 1.5, md: 2 },
                gap: 1,
                boxSizing: 'border-box'
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
                        <Typography variant="h4" fontWeight="bold">
                            {t.pageTitle}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {t.pageDescription}
                        </Typography>
                    </Box>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        sx={{ width: { xs: "100%", sm: "auto" }, gap: { xs: 1, sm: 2 } }}
                    >
                        <TextField
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: '#9ca3af' }} />
                            }}
                            sx={{
                                width: { xs: "100%", sm: "auto" },
                                maxWidth: { xs: '100%', sm: '300px', md: '400px' },
                                minWidth: { xs: '100%', sm: '200px' },
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#ffffff',
                                    '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6'
                                    }
                                }
                            }}
                        />

                        {selectedFields.length > 0 && (
                            <Button
                                variant="contained"
                                onClick={handleExportPDF}
                                disabled={exportLoading}
                                startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <ICONS.download />}
                                sx={{
                                    whiteSpace: 'nowrap',
                                    width: { xs: '100%', sm: 'auto' },
                                    minWidth: { xs: '100%', sm: 'fit-content' },
                                    py: 1,
                                    ...getStartIconSpacing(dir)
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
                    flex: '0 0 auto',
                    p: { xs: 1, sm: 1.5, md: 2 },
                    borderRadius: 2,
                    boxShadow: 2,
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        fontWeight: 600,
                        color: '#374151',
                        mb: 1
                    }}
                >
                    {t.availableFields}
                </Typography>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        flexWrap: 'wrap',
                        gap: 1,
                        maxWidth: '100%'
                    }}
                >
                    {filteredFields.map((field) => (
                        <FieldChip
                            key={field.name}
                            fieldKey={field.name}
                            field={field}
                            isSelected={selectedFields.includes(field.name)}
                            onClick={() => {
                                setSelectedFields(prev =>
                                    prev.includes(field.name)
                                        ? prev.filter(f => f !== field.name)
                                        : [...prev, field.name]
                                );
                            }}
                        />
                    ))}
                </Stack>
            </Paper>

            <Stack spacing={2} sx={{ flex: '1 1 0%', overflow: 'auto', minHeight: 0, pb: 2, px: 0.3 }}>
                {selectedFields.length === 0 ? (
                    <Paper sx={{ flex: 1, borderRadius: 2, boxShadow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box textAlign="center">
                            <BarChartIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                            <Typography color="textSecondary">{t.selectFieldPrompt}</Typography>
                        </Box>
                    </Paper>
                ) : (
                    selectedFields.map(fieldName => (
                        <Paper key={fieldName} sx={{ borderRadius: 2, boxShadow: 2, minHeight: '450px' }}>
                            <ChartVisualization
                                selectedField={fieldName}
                                chartData={chartData}
                                topN={getFieldParam(fieldName, 'topN', 10)}
                                intervalMinutes={getFieldParam(fieldName, 'intervalMinutes', 60)}
                                startDateTime={getFieldParam(fieldName, 'startDateTime', dayjs().subtract(30, 'day').startOf('day'))}
                                endDateTime={getFieldParam(fieldName, 'endDateTime', dayjs().endOf('day'))}
                                onTopNChange={(val) => updateFieldParam(fieldName, 'topN', val)}
                                onIntervalChange={(val) => updateFieldParam(fieldName, 'intervalMinutes', val)}
                                onStartDateTimeChange={(val) => updateFieldParam(fieldName, 'startDateTime', val ? dayjs(val) : dayjs().subtract(30, 'day').startOf('day'))}
                                onEndDateTimeChange={(val) => updateFieldParam(fieldName, 'endDateTime', val ? dayjs(val) : dayjs().endOf('day'))}
                                onRefReady={(el) => {
                                    if (el && chartRefs[fieldName] !== el) {
                                        setChartRefs(prev => ({ ...prev, [fieldName]: el }));
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