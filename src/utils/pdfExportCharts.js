import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
      pdf.text(fieldLabel, margin, yPosition);
      yPosition += titleHeight + spacing;

      pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
      yPosition += chartHeight + legendSpacing;

      // Add legend for pie charts
      if (legendItems.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        const columnWidth = chartWidth / 2;
        const itemsPerColumn = Math.ceil(legendItems.length / 2);

        legendItems.forEach((item, idx) => {
          const column = Math.floor(idx / itemsPerColumn);
          const row = idx % itemsPerColumn;

          const xPos = margin + (column * columnWidth);
          const yPos = yPosition + (row * 6);

          pdf.setFillColor(item.color);
          pdf.circle(xPos + 2, yPos - 1, 1.5, 'F');

          pdf.setTextColor('#333333');
          pdf.text(`${item.label}: ${item.value}`, xPos + 6, yPos);
        });

        yPosition += legendHeight + spacing;
      } else {
        yPosition += spacing;
      }

      isFirstChart = false;
    } catch (error) {
      console.error(`Error capturing chart ${i}:`, error);
    }
  }

  pdf.save('insights_charts.pdf');
};