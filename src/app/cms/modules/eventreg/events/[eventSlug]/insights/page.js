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
        startDate: "Start Date",
        startTime: "Start Time",
        endDate: "End Date",
        endTime: "End Time",
        intervalMinutes: "Interval (min)",
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
        startDate: "تاريخ البدء",
        startTime: "وقت البدء",
        endDate: "تاريخ النهاية",
        endTime: "وقت النهاية",
        intervalMinutes: "الفاصل الزمني (دقيقة)",
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
    onStartDateChange,
    onStartTimeChange,
    onEndDateChange,
    onEndTimeChange,
    topN,
    intervalMinutes,
    t
}) => {
    if (!selectedField || !chartData[selectedField]) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center'
                }}
            >
                <Box>
                    <BarChartIcon sx={{ fontSize: 48, color: '#d1d5db', mx: 'auto', mb: 2 }} />
                    <Typography color="textSecondary">
                        {t.selectFieldPrompt}
                    </Typography>
                </Box>
            </Box>
        );
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
                        <TextField
                            label={t.startDate}
                            type="date"
                            size="small"
                            defaultValue={new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]}
                            onChange={(e) => onStartDateChange(new Date(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: '150px' }}
                        />
                        <TextField
                            label={t.startTime}
                            type="time"
                            size="small"
                            defaultValue="00:00"
                            onChange={(e) => onStartTimeChange(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: '140px' }}
                        />
                        <TextField
                            label={t.endDate}
                            type="date"
                            size="small"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            onChange={(e) => onEndDateChange(new Date(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: '150px' }}
                        />
                        <TextField
                            label={t.endTime}
                            type="time"
                            size="small"
                            defaultValue="23:59"
                            onChange={(e) => onEndTimeChange(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: '140px' }}
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

            <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
                {field.chartType === 'pie' ? (
                    <PieChart
                        series={[
                            {
                                data: field.data,
                                highlightScope: { faded: 'global', highlighted: 'item' },
                                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' }
                            }
                        ]}
                        height={400}
                        slotProps={{
                            legend: { hidden: true }
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
    const [selectedField, setSelectedField] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableFields, setAvailableFields] = useState([]);
    const [chartData, setChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [topN, setTopN] = useState(10);
    const [intervalMinutes, setIntervalMinutes] = useState(60);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [startTime, setStartTime] = useState('00:00');
    const [endDate, setEndDate] = useState(new Date());
    const [endTime, setEndTime] = useState('23:59');


    const mergeDateTime = (date, timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const dateStr = date.toISOString().split('T')[0];
        const isoString = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;
        return new Date(isoString);
    };
    useEffect(() => {
        const fetchFields = async () => {
            if (!eventSlug) return;

            try {
                setLoading(true);
                const response = await getAvailableFields(eventSlug);

                const allFields = [
                    ...response.data.categoricalFields.map((f, idx) => ({
                        ...f,
                        chartType: determineChartType(f),
                        color: getFieldColor(idx)
                    })),
                    ...response.data.timeFields.map((f, idx) => ({
                        ...f,
                        chartType: 'line',
                        color: getFieldColor(response.data.categoricalFields.length + idx)
                    }))
                ];

                allFields.push(
                    {
                        name: 'scannedByType',
                        label: 'Scanned By Type',
                        type: 'special',
                        chartType: 'pie',
                        color: getFieldColor(allFields.length)
                    },
                    {
                        name: 'scannedByUser',
                        label: 'Scanned By User',
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
            if (!selectedField || !eventSlug || availableFields.length === 0) return;

            const field = availableFields.find(f => f.name === selectedField);
            if (!field) return;

            try {
                let response;

                if (field.type === 'time') {
                    const start = mergeDateTime(startDate, startTime);
                    const end = mergeDateTime(endDate, endTime);

                    response = await getTimeDistribution(eventSlug, selectedField, start, end, intervalMinutes);


                    const filteredData = response.data.data.filter(d => d.count > 0);
                    const xData = filteredData.map(d => {
                        const [datePart, timePart] = d.timestamp.split('T');
                        const [year, month, day] = datePart.split('-');
                        const time = timePart.slice(0, 5);
                        return `${month}/${day}, ${time}`;
                    });
                    const yData = filteredData.map(d => d.count);

                    setChartData(prev => ({
                        ...prev,
                        [selectedField]: {
                            ...field,
                            xData,
                            yData
                        }
                    }));
                } else if (selectedField === 'scannedByType' || selectedField === 'scannedByUser') {
                    response = selectedField === 'scannedByType'
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
                        [selectedField]: {
                            ...field,
                            data
                        }
                    }));
                } else {
                    const useTopN = field.type === 'text' || field.type === 'number' ? topN : null;
                    response = await getFieldDistribution(eventSlug, selectedField, useTopN);

                    const data = response.data.data.map((item, idx) => ({
                        id: idx,
                        value: item.value,
                        label: item.label,
                        color: getFieldColor(idx)
                    }));

                    setChartData(prev => ({
                        ...prev,
                        [selectedField]: {
                            ...field,
                            data
                        }
                    }));
                }
            } catch (error) {
                console.error('Error loading chart data:', error);
            }
        };

        fetchChartData();
    }, [selectedField, eventSlug, availableFields, topN, intervalMinutes, startDate, startTime, endDate, endTime]);




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
                background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
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
                            isSelected={selectedField === field.name}
                            onClick={() => setSelectedField(field.name)}
                        />
                    ))}
                </Stack>
            </Paper>

            <Paper
                sx={{
                    flex: '1 1 0%',
                    borderRadius: 2,
                    boxShadow: 2,
                    overflow: 'hidden',
                    minHeight: 0,
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            >
                <ChartVisualization
                    selectedField={selectedField}
                    chartData={chartData}
                    topN={topN}
                    intervalMinutes={intervalMinutes}
                    onTopNChange={setTopN}
                    onIntervalChange={setIntervalMinutes}
                    onStartDateChange={setStartDate}
                    onStartTimeChange={setStartTime}
                    onEndDateChange={setEndDate}
                    onEndTimeChange={setEndTime}
                    t={t}
                />
            </Paper>
        </Box>
    );
}