import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatDateTimeWithLocale, formatDate } from "@/utils/dateUtils";

const addEventHeader = async (pdf, eventInfo, pageWidth, margin, surveyInfo = null) => {
  if (!eventInfo) return margin;

  const logoMaxWidth = 40;
  const logoMaxHeight = 20;
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

      const img = new Image();
      img.src = base64;
      await new Promise((res) => (img.onload = res));
      const ratio = Math.min(
        logoMaxWidth / img.width,
        logoMaxHeight / img.height
      );
      const logoWidth = img.width * ratio;
      const logoHeight = img.height * ratio;

      pdf.addImage(base64, "PNG", margin, currentY, logoWidth, logoHeight);
      currentY += logoHeight + 3;
    } catch (error) {
      console.error("Error loading event logo:", error);
    }
  }

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(31, 41, 55);
  pdf.text(String(eventInfo.name || ""), margin, currentY + 5);

  currentY += 10;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(107, 114, 128);

  const fromDate = formatDate(eventInfo.startDate);
  const toDate = formatDate(eventInfo.endDate);

  pdf.text(`From: ${fromDate}`, margin, currentY);
  pdf.text(`To: ${toDate}`, margin, currentY + 5);
  pdf.text(`Venue: ${String(eventInfo.venue || "")}`, margin, currentY + 10);
  pdf.text(`Registrations: ${String(eventInfo.registrations || 0)}`, margin, currentY + 15);

  currentY += 20;

  //survey-specific fields only if surveyInfo is provided (survey guru only)
  if (surveyInfo) {
    if (surveyInfo.title) {
      pdf.text(`Title of survey: ${String(surveyInfo.title)}`, margin, currentY);
      currentY += 5;
    }

    if (surveyInfo.description) {
      const description = String(surveyInfo.description || "");
      const maxWidth = pageWidth - margin * 2;
      const lines = pdf.splitTextToSize(`Description: ${description}`, maxWidth);
      pdf.text(lines, margin, currentY);
      currentY += lines.length * 5;
    }

    if (surveyInfo.totalResponses !== undefined && surveyInfo.totalResponses !== null) {
      pdf.text(`Total Responses: ${String(surveyInfo.totalResponses)}`, margin, currentY);
      currentY += 5;
    }
  }

  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  return currentY;
};

export const exportChartsToPDF = async (
  chartRefs,
  fieldLabels,
  chartDataArray,
  eventInfo,
  surveyInfo = null
) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const chartWidth = pageWidth - margin * 2;
  const maxChartHeight = 100;
  const titleHeight = 10;
  const spacing = 8;

  let yPosition = (await addEventHeader(pdf, eventInfo, pageWidth, margin, surveyInfo)) + spacing;
  let isFirstChart = true;

  for (let i = 0; i < chartRefs.length; i++) {
    const chartElement = chartRefs[i];
    const fieldLabel = fieldLabels[i];
    const chartData = chartDataArray[i];
    if (!chartElement) continue;

    try {
      const legendElements = chartElement.querySelectorAll(
        '.MuiChartsLegend-root, [class*="MuiChartsLegend"]'
      );
      legendElements.forEach((el) => (el.style.display = "none"));

      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      legendElements.forEach((el) => (el.style.display = ""));

      const imgData = canvas.toDataURL("image/png");
      const imgAspectRatio = canvas.width / canvas.height;
      const chartHeight = Math.min(chartWidth / imgAspectRatio, maxChartHeight);

      const totalHeight = titleHeight + spacing + chartHeight + spacing;

      if (yPosition + totalHeight > pageHeight - margin && !isFirstChart) {
        pdf.addPage();
        yPosition = margin + spacing;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text(fieldLabel, margin, yPosition);

      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);

      if (
        chartData.chartType === "pie" &&
        (chartData.type === "text" || chartData.type === "number" || chartData.type === "multi" || chartData.questionType === "multi")
      ) {
        pdf.text(`Top ${chartData.topN || 10}`, margin, yPosition);
        yPosition += 5;
      } else if (chartData.chartType === "line" && chartData.type === "time") {
        const startDate = formatDateTimeWithLocale(chartData.startDateTime);
        const endDate = formatDateTimeWithLocale(chartData.endDateTime);
        pdf.text(`From: ${startDate}`, margin, yPosition);
        pdf.text(`To: ${endDate}`, margin, yPosition + 5);
        pdf.text(
          `Interval: ${chartData.intervalMinutes || 60} min`,
          margin,
          yPosition + 10
        );
        yPosition += 15;
      }

      yPosition += spacing + 3;
      pdf.addImage(imgData, "PNG", margin, yPosition, chartWidth, chartHeight);
      yPosition += chartHeight + spacing;

      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += spacing;

      isFirstChart = false;
    } catch (error) {
      console.error(`Error capturing chart ${i}:`, error);
    }
  }

  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(120);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  pdf.save(`${eventInfo?.name || "insights"}_charts.pdf`);
};
