import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateTimeWithLocale, formatDate } from '@/utils/dateUtils';
const addEventHeader = async (pdf, eventInfo, pageWidth, margin) => {
  if (!eventInfo) return margin;

  const logoSize = 20;
  let currentY = margin;

  if (eventInfo.logoUrl) {
    try {
      const response = await fetch(eventInfo.logoUrl);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      pdf.addImage(base64, 'PNG', margin, currentY, logoSize, logoSize);
      currentY += logoSize + 3;
    } catch (error) {
      console.error('Error loading event logo:', error);
    }
  }

  // Event name
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text(eventInfo.name, margin, currentY + 5);

  currentY += 10;

  // Event details
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);

  const fromDate = formatDate(eventInfo.startDate);
  const toDate = formatDate(eventInfo.endDate);

  pdf.text(`From: ${fromDate}`, margin, currentY);
  pdf.text(`To: ${toDate}`, margin, currentY + 5);
  pdf.text(`Venue: ${eventInfo.venue}`, margin, currentY + 10);
  pdf.text(`Registrations: ${eventInfo.registrations}`, margin, currentY + 15);

  currentY += 20;

  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  return currentY;
};

export const exportChartsToPDF = async (chartRefs, fieldLabels, chartDataArray, eventInfo) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const chartWidth = pageWidth - (margin * 2);
  const maxChartHeight = 100;
  const titleHeight = 10;
  const spacing = 8;
  const legendSpacing = 5;

  const headerHeight = await addEventHeader(pdf, eventInfo, pageWidth, margin);
  let yPosition = headerHeight + spacing;
  let isFirstChart = true;

  for (let i = 0; i < chartRefs.length; i++) {
    const chartElement = chartRefs[i];
    const fieldLabel = fieldLabels[i];
    const chartData = chartDataArray[i];

    if (!chartElement) continue;

    try {
      // Capture chart image
      const legendElements = chartElement.querySelectorAll('.MuiChartsLegend-root, [class*="MuiChartsLegend"]');
      legendElements.forEach(el => el.style.display = 'none');

      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      legendElements.forEach(el => el.style.display = '');

      const imgData = canvas.toDataURL('image/png');
      const imgAspectRatio = canvas.width / canvas.height;
      const chartHeight = Math.min(chartWidth / imgAspectRatio, maxChartHeight);

      let legendHeight = 0;
      let legendItems = [];

      if (chartData?.chartType === 'pie' && chartData?.data) {
        legendItems = chartData.data.map(item => ({
          label: item.label,
          color: item.color,
          value: item.value
        }));

        const itemsPerColumn = Math.ceil(legendItems.length / 2);
        legendHeight = itemsPerColumn * 6 + 5;
      }

      const totalHeight = titleHeight + spacing + chartHeight + legendHeight;
      if (yPosition + totalHeight > pageHeight - margin && !isFirstChart) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text(fieldLabel, margin, yPosition);

      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);

      if (chartData.chartType === 'pie' && (chartData.type === 'text' || chartData.type === 'number')) {
        pdf.text(`Top ${chartData.topN || 10}`, margin, yPosition);
        yPosition += 5;
      } else if (chartData.chartType === 'line' && chartData.type === 'time') {
        const startDate = formatDateTimeWithLocale(chartData.startDateTime);
        const endDate = formatDateTimeWithLocale(chartData.endDateTime);

        pdf.text(`From: ${startDate}`, margin, yPosition);
        pdf.text(`To: ${endDate}`, margin, yPosition + 5);
        pdf.text(`Interval: ${chartData.intervalMinutes || 60} min`, margin, yPosition + 10);
        yPosition += 15;
      }

      yPosition += spacing + 3;


      // Add legend for pie charts
      pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
      yPosition += chartHeight + spacing;
      // Add separator line after each chart
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += spacing;

      isFirstChart = false;
    } catch (error) {
      console.error(`Error capturing chart ${i}:`, error);
    }
  }

  pdf.save('insights_charts.pdf');
};