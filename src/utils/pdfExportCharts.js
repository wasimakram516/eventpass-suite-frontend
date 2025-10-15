import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateTimeWithLocale } from '@/utils/dateUtils';

export const exportChartsToPDF = async (chartRefs, fieldLabels, chartDataArray) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const chartWidth = pageWidth - (margin * 2);
  const maxChartHeight = 100;
  const titleHeight = 10;
  const spacing = 8;
  const legendSpacing = 5;

  let yPosition = margin;
  let isFirstChart = true;

  for (let i = 0; i < chartRefs.length; i++) {
    const chartElement = chartRefs[i];
    const fieldLabel = fieldLabels[i];
    const chartData = chartDataArray[i];

    if (!chartElement) continue;

    try {
      // Capture chart image
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

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

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      const chartDescription = chartData.chartType === 'pie' ? 'Distribution Overview' : 'Historical Trend';
      pdf.text(chartDescription, margin, yPosition + 5);

      if (chartData.chartType === 'pie' && (chartData.type === 'text' || chartData.type === 'number')) {
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Top ${chartData.topN || 10}`, pageWidth - margin, yPosition-1, { align: 'right' });
      } else if (chartData.chartType === 'line' && chartData.type === 'time') {
        pdf.setFontSize(11);
        pdf.setTextColor(107, 114, 128);
        const startDate = `From: ${formatDateTimeWithLocale(chartData.startDateTime)}`;
        const endDate = `To: ${formatDateTimeWithLocale(chartData.endDateTime)}`;
        const intervalText = `Interval: ${chartData.intervalMinutes || 60} min`;

        const textX = pageWidth - 70; 
        pdf.text(startDate, textX, yPosition-1);
        pdf.text(endDate, textX, yPosition + 5);
        pdf.text(intervalText, textX, yPosition + 11);
      }

      yPosition += titleHeight + spacing + 3;


      // Add legend for pie charts
      if (legendItems.length > 0) {
        const legendWidth = 45;
        const gapBetweenChartAndLegend = 3;
        const adjustedChartWidth = chartWidth - legendWidth - gapBetweenChartAndLegend;
        const adjustedChartHeight = Math.min(adjustedChartWidth / imgAspectRatio, maxChartHeight);

        pdf.addImage(imgData, 'PNG', margin, yPosition, adjustedChartWidth, adjustedChartHeight);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        const legendX = margin + adjustedChartWidth + gapBetweenChartAndLegend;
        const itemHeight = 6;
        const legendStartY = yPosition + (adjustedChartHeight / 2) - ((legendItems.length * itemHeight) / 2);

        legendItems.forEach((item, idx) => {
          const yPos = legendStartY + (idx * itemHeight);

          pdf.setFillColor(item.color);
          pdf.circle(legendX + 2, yPos - 1, 1.5, 'F');

          pdf.setTextColor('#333333');
          pdf.text(`${item.label}`, legendX + 6, yPos, { maxWidth: legendWidth - 6 });
        });

        yPosition += adjustedChartHeight + spacing;
      } else {
        pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
        yPosition += chartHeight + spacing;
      }

      isFirstChart = false;
    } catch (error) {
      console.error(`Error capturing chart ${i}:`, error);
    }
  }

  pdf.save('insights_charts.pdf');
};