import html2canvas from "html2canvas";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatDateTimeWithLocale, formatDate } from "@/utils/dateUtils";

const getTimezoneLabel = (timezone) => {
  try {
    const now = new Date();
    const longName = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "long",
    })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value || timezone;

    const shortOffset = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value || "";

    return shortOffset ? `${longName} (${shortOffset})` : longName;
  } catch {
    return timezone || "UTC";
  }
};

// Layout & font sizes
const FONT_TITLE = 16;
const FONT_SECTION = 14;
const FONT_LABEL = 9;
const FONT_VALUE = 9;
const FONT_PAGENUM = 10;

const LEFT_MARGIN = 42.52;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const TEXT_WRAP_WIDTH = 520;
const LINE_HEIGHT = 14.17;
const CHART_MAX_HEIGHT = 283.47;
const SPACING = 22.68;

// Load Cairo fonts for Arabic support
const loadCairoFonts = async (pdf) => {
  try {
    const regularResponse = await fetch("/fonts/cairo/Cairo-Regular.ttf");
    const regularBytes = await regularResponse.arrayBuffer();
    const font = await pdf.embedFont(regularBytes);

    const boldResponse = await fetch("/fonts/cairo/Cairo-Bold.ttf");
    const boldBytes = await boldResponse.arrayBuffer();
    const bold = await pdf.embedFont(boldBytes);

    return { font, bold };
  } catch (error) {
    console.error("Error loading Cairo fonts:", error);
    return null;
  }
};

// function to get text X position based on RTL/LTR
const getTextX = (text, x, pageWidth, margin, isRTL, align = "left", font, fontSize) => {
  if (isRTL && align === "left") {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    return pageWidth - margin - textWidth;
  }
  return x;
};

// function to render label and value with proper RTL/LTR positioning
const renderLabelValue = (page, label, value, x, y, pageWidth, margin, isRTL, font, boldFont, fontSize) => {
  const colon = ":";
  const spacing = 2.8;

  if (isRTL) {
    const valueText = String(value);
    const labelText = String(label);
    const labelWidth = boldFont.widthOfTextAtSize(labelText, fontSize);
    const colonWidth = font.widthOfTextAtSize(colon, fontSize);
    const valueWidth = font.widthOfTextAtSize(valueText, fontSize);
    const labelX = pageWidth - margin - labelWidth;
    const colonX = labelX - spacing - colonWidth;
    const valueX = colonX - spacing - valueWidth;

    page.drawText(valueText, {
      x: valueX,
      y: y,
      size: fontSize,
      font: font,
    });
    page.drawText(colon, {
      x: colonX,
      y: y,
      size: fontSize,
      font: font,
    });
    page.drawText(labelText, {
      x: labelX,
      y: y,
      size: fontSize,
      font: boldFont,
    });
  } else {
    const labelText = `${label}${colon} `;
    const labelWidth = boldFont.widthOfTextAtSize(labelText, fontSize);

    page.drawText(labelText, {
      x: x,
      y: y,
      size: fontSize,
      font: boldFont,
    });

    page.drawText(String(value), {
      x: x + labelWidth,
      y: y,
      size: fontSize,
      font: font,
    });
  }
};


const addEventHeader = async (
  pdf,
  page,
  eventInfo,
  pageWidth,
  margin,
  surveyInfo = null,
  language = "en",
  isRTL = false,
  translations = {},
  font,
  boldFont,
  timezone = null
) => {
  if (!eventInfo) return PAGE_HEIGHT - margin;

  const logoMaxWidth = 113.39;
  const logoMaxHeight = 56.69;
  let currentY = PAGE_HEIGHT - margin;

  if (eventInfo.logoUrl) {
    try {
      const response = await fetch(eventInfo.logoUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      let image;
      if (blob.type === "image/png") {
        image = await pdf.embedPng(arrayBuffer);
      } else if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
        image = await pdf.embedJpg(arrayBuffer);
      } else {
        image = await pdf.embedPng(arrayBuffer);
      }

      const imgDims = image.scale(Math.min(
        logoMaxWidth / image.width,
        logoMaxHeight / image.height
      ));

      const logoX = isRTL ? pageWidth - margin - imgDims.width : margin;
      page.drawImage(image, {
        x: logoX,
        y: currentY - imgDims.height,
        width: imgDims.width,
        height: imgDims.height,
      });
      currentY -= imgDims.height + 17;
    } catch (error) {
      console.warn("Error loading event logo:", error.message);
    }
  }

  const eventName = String(eventInfo.name || "");
  const eventNameX = getTextX(eventName, margin, pageWidth, margin, isRTL, "left", boldFont, FONT_TITLE);
  page.drawText(eventName, {
    x: eventNameX,
    y: currentY,
    size: FONT_TITLE,
    font: boldFont,
    color: rgb(0.12, 0.16, 0.22), // #1f2937
  });
  currentY -= 14.17;

  // Optional subtitle (e.g. "Event Name: xyz" for poll insights)
  if (eventInfo.subtitle) {
    renderLabelValue(page, eventInfo.subtitleLabel || "Event Name", String(eventInfo.subtitle), margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }

  // Event details
  const fromLabel = translations.from || "From";
  const toLabel = translations.to || "To";
  const venueLabel = translations.venue || "Venue";
  const registrationsLabel = translations.registrations || "Registrations";

  if (eventInfo.startDate || eventInfo.startDateFormatted) {
    const fromDate = eventInfo.startDateFormatted || formatDate(eventInfo.startDate);
    renderLabelValue(page, fromLabel, fromDate, margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }
  if (eventInfo.endDate || eventInfo.endDateFormatted) {
    const toDate = eventInfo.endDateFormatted || formatDate(eventInfo.endDate);
    renderLabelValue(page, toLabel, toDate, margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }
  if (eventInfo.venue) {
    renderLabelValue(page, venueLabel, String(eventInfo.venue), margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }
  if (eventInfo.registrations !== undefined && eventInfo.registrations !== null) {
    const registrationsValue = eventInfo.registrationsFormatted !== undefined
      ? eventInfo.registrationsFormatted
      : String(eventInfo.registrations);
    renderLabelValue(page, registrationsLabel, registrationsValue, margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }

  // Survey-specific fields only if surveyInfo is provided
  if (surveyInfo) {
    const titleOfSurveyLabel = translations.titleOfSurvey || "Title of survey";
    const descriptionLabel = translations.description || "Description";
    const totalResponsesLabel = translations.totalResponses || "Total Responses";

    if (surveyInfo.title) {
      renderLabelValue(page, titleOfSurveyLabel, String(surveyInfo.title), margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
      currentY -= LINE_HEIGHT;
    }

    if (surveyInfo.description) {
      const description = String(surveyInfo.description || "");
      const maxWidth = (pageWidth - margin * 2) * 0.8;

      if (isRTL) {
        const labelText = String(descriptionLabel);
        const colon = ":";
        const spacing = 2.8;

        const labelWidth = boldFont.widthOfTextAtSize(labelText, FONT_LABEL);
        const colonWidth = font.widthOfTextAtSize(colon, FONT_LABEL);
        const labelX = pageWidth - margin - labelWidth;
        const colonX = labelX - spacing - colonWidth;

        const availableWidth = colonX - margin - spacing;

        const words = description.split(" ");
        const lines = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, FONT_VALUE);

          if (testWidth > availableWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        page.drawText(labelText, {
          x: labelX,
          y: currentY,
          size: FONT_LABEL,
          font: boldFont,
        });
        page.drawText(colon, {
          x: colonX,
          y: currentY,
          size: FONT_LABEL,
          font: font,
        });

        if (lines.length > 0 && lines[0]) {
          const firstLineWidth = font.widthOfTextAtSize(lines[0], FONT_VALUE);
          const firstLineX = colonX - spacing - firstLineWidth;
          page.drawText(lines[0], {
            x: firstLineX,
            y: currentY,
            size: FONT_VALUE,
            font: font,
          });
          currentY -= LINE_HEIGHT;

          for (let i = 1; i < lines.length; i++) {
            const lineWidth = font.widthOfTextAtSize(lines[i], FONT_VALUE);
            const lineX = pageWidth - margin - lineWidth;
            page.drawText(lines[i], {
              x: lineX,
              y: currentY,
              size: FONT_VALUE,
              font: font,
            });
            currentY -= LINE_HEIGHT;
          }
        } else {
          currentY -= LINE_HEIGHT;
        }
      } else {
        const labelText = `${descriptionLabel}: `;
        const labelWidth = boldFont.widthOfTextAtSize(labelText, FONT_LABEL);

        page.drawText(labelText, {
          x: margin,
          y: currentY,
          size: FONT_LABEL,
          font: boldFont,
        });

        const descriptionStartX = margin + labelWidth;
        const availableWidth = maxWidth - labelWidth;

        const words = description.split(" ");
        const lines = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, FONT_VALUE);

          if (testWidth > availableWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        if (lines.length > 0 && lines[0]) {
          page.drawText(lines[0], {
            x: descriptionStartX,
            y: currentY,
            size: FONT_VALUE,
            font: font,
          });
          currentY -= LINE_HEIGHT;

          for (let i = 1; i < lines.length; i++) {
            page.drawText(lines[i], {
              x: margin,
              y: currentY,
              size: FONT_VALUE,
              font: font,
            });
            currentY -= LINE_HEIGHT;
          }
        } else {
          currentY -= LINE_HEIGHT;
        }
      }
    }

    if (surveyInfo.totalResponses !== undefined && surveyInfo.totalResponses !== null) {
      const totalResponsesValue = surveyInfo.totalResponsesFormatted !== undefined
        ? surveyInfo.totalResponsesFormatted
        : String(surveyInfo.totalResponses);
      renderLabelValue(page, totalResponsesLabel, totalResponsesValue, margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
      currentY -= LINE_HEIGHT;
    }
  }

  // Timezone
  if (timezone) {
    const tzLabel = getTimezoneLabel(timezone);
    const timezoneKey = translations.timezone || "Timezone";
    renderLabelValue(page, timezoneKey, tzLabel, margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }

  // Separator line
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  return currentY - 8.5;
};

const drawPrintStatsKpiCards = (page, eventInfo, yPosition, pageWidth, margin, font, boldFont, translations, isRTL = false) => {
  // pdf-lib has no bidi support — parentheses get visually mirrored in RTL rendering.
  const fixParens = (text) =>
    isRTL ? text.replace(/\(/g, "\x00").replace(/\)/g, "(").replace(/\x00/g, ")") : text;
  const cardCount = 5;
  const gap = 10;
  const cardWidth = (pageWidth - margin * 2 - (cardCount - 1) * gap) / cardCount;
  const cardHeight = 68;
  const valueSize = 20;  // matches MUI h4 bold
  const labelSize = 9;   // matches MUI body2
  const labelLineHeight = 11;

  const cards = [
    { label: fixParens(translations.totalBadgePrints || "Total Badge Prints"),     value: String(eventInfo.totalPrints    ?? 0), color: rgb(0,      0.467, 0.714) },
    { label: fixParens(translations.noPrints        || "0 Prints (Never Printed)"), value: String(eventInfo.noPrintCount   ?? 0), color: rgb(0.937, 0.267, 0.267) },
    { label: fixParens(translations.onePrint        || "1 Print"),                  value: String(eventInfo.onePrintCount  ?? 0), color: rgb(0.961, 0.620, 0.043) },
    { label: fixParens(translations.multiPrint      || "Multi-Print (2+)"),         value: String(eventInfo.multiPrintCount ?? 0), color: rgb(0.063, 0.725, 0.506) },
    { label: fixParens(translations.multiPrintRate  || "Multi-Print Rate"),         value: `${eventInfo.multiPrintRate ?? "0.00"}%`, color: rgb(0.545, 0.361, 0.965) },
  ];

  cards.forEach((card, i) => {
    const cardX = margin + i * (cardWidth + gap);
    const cardY = yPosition - cardHeight;

    // White card background with light border
    page.drawRectangle({
      x: cardX, y: cardY,
      width: cardWidth, height: cardHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.878, 0.878, 0.878),
      borderWidth: 0.75,
    });

    // Value — large bold colored 
    const valueWidth = boldFont.widthOfTextAtSize(card.value, valueSize);
    page.drawText(card.value, {
      x: Math.max(cardX + 2, cardX + (cardWidth - valueWidth) / 2),
      y: cardY + 40,
      size: valueSize,
      font: boldFont,
      color: card.color,
    });

    // Label — word-wrapped, centered, gray (matches Typography variant="body2" color="text.secondary")
    const maxLabelWidth = cardWidth - 8;
    const words = card.label.split(" ");
    const lines = [];
    let cur = "";
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(test, labelSize) > maxLabelWidth && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);

    const labelStartY = lines.length === 1 ? cardY + 16 : cardY + 24;
    lines.forEach((line, li) => {
      const lw = font.widthOfTextAtSize(line, labelSize);
      page.drawText(line, {
        x: Math.max(cardX + 2, cardX + (cardWidth - lw) / 2),
        y: labelStartY - li * labelLineHeight,
        size: labelSize,
        font,
        color: rgb(0.459, 0.459, 0.459), // MUI text.secondary
      });
    });
  });

  return yPosition - cardHeight;
};

export const exportChartsToPDF = async (
  chartRefs,
  fieldLabels,
  chartDataArray,
  eventInfo,
  surveyInfo = null,
  language = "en",
  dir = "ltr",
  translations = {},
  timezone = null
) => {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const isRTL = dir === "rtl";
  const pageWidth = PAGE_WIDTH;
  const pageHeight = PAGE_HEIGHT;
  const margin = LEFT_MARGIN;
  const chartWidth = pageWidth - margin * 2;
  const maxChartHeight = CHART_MAX_HEIGHT;
  const spacing = SPACING;

  let font, boldFont;
  const fonts = await loadCairoFonts(pdf);
  if (fonts) {
    font = fonts.font;
    boldFont = fonts.bold;
  } else {
    font = await pdf.embedFont("Helvetica");
    boldFont = await pdf.embedFont("Helvetica-Bold");
  }

  let page = pdf.addPage([pageWidth, pageHeight]);
  let yPosition;
  try {
    yPosition = await addEventHeader(
      pdf,
      page,
      eventInfo,
      pageWidth,
      margin,
      surveyInfo,
      language,
      isRTL,
      translations,
      font,
      boldFont,
      timezone
    );
  } catch (err) {
    console.warn("Error rendering PDF header:", err.message);
    yPosition = PAGE_HEIGHT - margin;
  }
  yPosition -= spacing;

  if (eventInfo?.totalPrints !== undefined) {
    const kpiSectionHeight = 20 + 65;
    if (yPosition < kpiSectionHeight + margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }

    const sectionLabel = translations.badgePrintStats || "Badge Print Stats";
    const sectionLabelX = getTextX(sectionLabel, margin, pageWidth, margin, isRTL, "left", boldFont, FONT_SECTION);
    page.drawText(sectionLabel, {
      x: sectionLabelX,
      y: yPosition,
      size: FONT_SECTION,
      font: boldFont,
      color: rgb(0.12, 0.16, 0.22),
    });
    yPosition -= 20;

    yPosition = drawPrintStatsKpiCards(page, eventInfo, yPosition, pageWidth, margin, font, boldFont, translations, isRTL);
    yPosition -= spacing;
  }

  let isFirstChart = true;

  const ensureSpace = async (needed) => {
    if (yPosition < needed + margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }
  };

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
      const imgBytes = await fetch(imgData).then((res) => res.arrayBuffer());
      const chartImage = await pdf.embedPng(imgBytes);

      const imgAspectRatio = canvas.width / canvas.height;
      const chartHeight = Math.min(chartWidth / imgAspectRatio, maxChartHeight);

      const titleHeight = 14;
      const metadataHeight = chartData.chartType === "line" ? 45 : chartData.questionType || chartData.type === "multi" || chartData.type === "rating" || chartData.type === "nps" ? 14 : chartData.chartType === "pie" && (chartData.type === "text" || chartData.type === "number" || chartData.type === "multi" || chartData.questionType === "multi") && !surveyInfo ? 14 : 0;
      const totalHeight = titleHeight + spacing + metadataHeight + spacing + chartHeight + spacing;

      await ensureSpace(totalHeight);

      if (yPosition - totalHeight < margin && !isFirstChart) {
        page = pdf.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      const fieldLabelX = getTextX(fieldLabel, margin, pageWidth, margin, isRTL, "left", boldFont, FONT_SECTION);
      page.drawText(fieldLabel, {
        x: fieldLabelX,
        y: yPosition,
        size: FONT_SECTION,
        font: boldFont,
        color: rgb(0.12, 0.16, 0.22), // #1f2937
      });
      yPosition -= 20;

      const typeLabel = translations.type || "Type";
      const topNLabel = translations.topN || "Top N";
      const intervalLabel = translations.intervalMinutes || "Interval (min)";

      if (surveyInfo && chartData) {
        const fieldType = chartData.questionType || chartData.type;
        let typeValue = "";
        if (fieldType === "time") {
          typeValue = "";
        } else if (fieldType === "multi") {
          typeValue = "MCQ";
        } else if (fieldType === "rating") {
          typeValue = "Rating";
        } else if (fieldType === "nps") {
          typeValue = "NPS";
        }

        if (typeValue) {
          renderLabelValue(page, typeLabel, typeValue, margin, yPosition, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
          yPosition -= LINE_HEIGHT;
        }
      }

      if (
        chartData.chartType === "pie" &&
        (chartData.type === "text" ||
          chartData.type === "number" ||
          chartData.type === "categorical" ||
          chartData.type === "multi" ||
          chartData.questionType === "multi") &&
        !surveyInfo
      ) {
        renderLabelValue(page, topNLabel, String(chartData.topN || 10), margin, yPosition, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
        yPosition -= LINE_HEIGHT;
      } else if (chartData.chartType === "line" && chartData.type === "time") {
        const startDate = chartData.startDateTimeFormatted || formatDateTimeWithLocale(chartData.startDateTime);
        const endDate = chartData.endDateTimeFormatted || formatDateTimeWithLocale(chartData.endDateTime);
        const intervalValue = chartData.intervalMinutesFormatted || `${chartData.intervalMinutes || 60} min`;

        renderLabelValue(page, translations.from || "From", startDate, margin, yPosition, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
        yPosition -= LINE_HEIGHT;
        renderLabelValue(page, translations.to || "To", endDate, margin, yPosition, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
        yPosition -= LINE_HEIGHT;

        const intervalBase = intervalLabel.replace(/\s*\(.*?\)\s*/, "").trim();
        if (chartData.intervalMinutesFormatted && chartData.intervalMinutesSuffix) {
          const intervalNumber = chartData.intervalMinutesFormatted;
          const intervalSuffix = chartData.intervalMinutesSuffix;
          const spacing = 2.8;
          const colon = ":";

          if (isRTL) {
            const labelText = String(intervalBase);
            const labelWidth = boldFont.widthOfTextAtSize(labelText, FONT_LABEL);
            const colonWidth = font.widthOfTextAtSize(colon, FONT_LABEL);
            const numberWidth = font.widthOfTextAtSize(intervalNumber, FONT_LABEL);
            const minWidth = font.widthOfTextAtSize(intervalSuffix, FONT_LABEL);
            const spaceWidth = font.widthOfTextAtSize(" ", FONT_LABEL);

            const labelX = pageWidth - margin - labelWidth;
            const colonX = labelX - spacing - colonWidth;
            const valueTotalWidth = numberWidth + spaceWidth + minWidth;
            const valueX = colonX - spacing - valueTotalWidth;
            const numberX = valueX;
            const minX = numberX + numberWidth + spaceWidth;

            page.drawText(labelText, {
              x: labelX,
              y: yPosition,
              size: FONT_LABEL,
              font: boldFont,
            });
            page.drawText(colon, {
              x: colonX,
              y: yPosition,
              size: FONT_LABEL,
              font: font,
            });
            page.drawText(intervalNumber, {
              x: numberX,
              y: yPosition,
              size: FONT_LABEL,
              font: font,
            });
            page.drawText(intervalSuffix, {
              x: minX,
              y: yPosition,
              size: FONT_LABEL,
              font: font,
            });
          } else {
            const labelText = `${intervalBase}${colon} `;
            const labelWidth = boldFont.widthOfTextAtSize(labelText, FONT_LABEL);
            const numberWidth = font.widthOfTextAtSize(intervalNumber, FONT_LABEL);
            const spaceWidth = font.widthOfTextAtSize(" ", FONT_LABEL);

            page.drawText(labelText, {
              x: margin,
              y: yPosition,
              size: FONT_LABEL,
              font: boldFont,
            });
            page.drawText(intervalNumber, {
              x: margin + labelWidth,
              y: yPosition,
              size: FONT_LABEL,
              font: font,
            });
            page.drawText(` ${intervalSuffix}`, {
              x: margin + labelWidth + numberWidth,
              y: yPosition,
              size: FONT_LABEL,
              font: font,
            });
          }
        } else {
          renderLabelValue(page, intervalBase, intervalValue, margin, yPosition, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
        }
        yPosition -= LINE_HEIGHT;
      }

      yPosition -= spacing + 8.5;

      const chartX = isRTL ? pageWidth - margin - chartWidth : margin;
      page.drawImage(chartImage, {
        x: chartX,
        y: yPosition - chartHeight,
        width: chartWidth,
        height: chartHeight,
      });
      yPosition -= chartHeight + spacing;

      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 0.3,
        color: rgb(0.6, 0.6, 0.6),
      });
      yPosition -= spacing;

      isFirstChart = false;
    } catch (error) {
      console.error(`Error capturing chart ${i}:`, error);
    }
  }

  // Add page numbers
  const pages = pdf.getPages();
  const totalPages = pages.length;
  const pageLabel = translations.page || "Page";
  const ofLabel = translations.of || "of";

  for (let i = 0; i < totalPages; i++) {
    const pg = pages[i];
    const pageText = language === "ar"
      ? `الصفحة ${i + 1} من ${totalPages}`
      : `${pageLabel} ${i + 1} ${ofLabel} ${totalPages}`;

    const textWidth = font.widthOfTextAtSize(pageText, FONT_PAGENUM);
    const centeredX = (pageWidth - textWidth) / 2;

    pg.drawText(pageText, {
      x: centeredX,
      y: 20,
      size: FONT_PAGENUM,
      font: font,
      color: rgb(0.47, 0.47, 0.47), // #787878
    });
  }

  // Save PDF
  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const name = surveyInfo?.title || eventInfo?.name || "insights";
  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").trim();
  link.download = `${sanitizedName}_insights.pdf`;

  link.click();
  URL.revokeObjectURL(url);
};
