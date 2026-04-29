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
const FONT_PAGENUM = 9;

const LEFT_MARGIN = 42.52;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
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

// pdf-lib has no bidi support — parentheses get visually mirrored in RTL rendering.
const fixParens = (text, isRTL) =>
  isRTL
    ? String(text).replace(/\(/g, "\x00").replace(/\)/g, "(").replace(/\x00/g, ")")
    : String(text);

const getTextX = (text, x, pageWidth, margin, isRTL, align = "left", font, fontSize) => {
  if (isRTL && align === "left") {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    return pageWidth - margin - textWidth;
  }
  return x;
};

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

    page.drawText(valueText, { x: valueX, y, size: fontSize, font });
    page.drawText(colon, { x: colonX, y, size: fontSize, font });
    page.drawText(labelText, { x: labelX, y, size: fontSize, font: boldFont });
  } else {
    const labelText = `${label}${colon} `;
    const labelWidth = boldFont.widthOfTextAtSize(labelText, fontSize);
    page.drawText(labelText, { x, y, size: fontSize, font: boldFont });
    page.drawText(String(value), { x: x + labelWidth, y, size: fontSize, font });
  }
};

const addEventHeader = async (
  pdf,
  page,
  eventInfo,
  pageWidth,
  margin,
  surveyInfo = null,
  _language = "en",
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
    color: rgb(0.12, 0.16, 0.22),
  });
  currentY -= 14.17;

  if (eventInfo.subtitle) {
    renderLabelValue(page, eventInfo.subtitleLabel || "Event Name", String(eventInfo.subtitle), margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }

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
  if (eventInfo.venue && eventInfo.venue !== "N/A") {
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
          if (font.widthOfTextAtSize(testLine, FONT_VALUE) > availableWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        page.drawText(labelText, { x: labelX, y: currentY, size: FONT_LABEL, font: boldFont });
        page.drawText(colon, { x: colonX, y: currentY, size: FONT_LABEL, font });

        if (lines.length > 0 && lines[0]) {
          const firstLineWidth = font.widthOfTextAtSize(lines[0], FONT_VALUE);
          page.drawText(lines[0], { x: colonX - spacing - firstLineWidth, y: currentY, size: FONT_VALUE, font });
          currentY -= LINE_HEIGHT;
          for (let i = 1; i < lines.length; i++) {
            const lineWidth = font.widthOfTextAtSize(lines[i], FONT_VALUE);
            page.drawText(lines[i], { x: pageWidth - margin - lineWidth, y: currentY, size: FONT_VALUE, font });
            currentY -= LINE_HEIGHT;
          }
        } else {
          currentY -= LINE_HEIGHT;
        }
      } else {
        const labelText = `${descriptionLabel}: `;
        const labelWidth = boldFont.widthOfTextAtSize(labelText, FONT_LABEL);
        page.drawText(labelText, { x: margin, y: currentY, size: FONT_LABEL, font: boldFont });

        const descriptionStartX = margin + labelWidth;
        const availableWidth = maxWidth - labelWidth;
        const words = description.split(" ");
        const lines = [];
        let currentLine = "";
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (font.widthOfTextAtSize(testLine, FONT_VALUE) > availableWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        if (lines.length > 0 && lines[0]) {
          page.drawText(lines[0], { x: descriptionStartX, y: currentY, size: FONT_VALUE, font });
          currentY -= LINE_HEIGHT;
          for (let i = 1; i < lines.length; i++) {
            page.drawText(lines[i], { x: margin, y: currentY, size: FONT_VALUE, font });
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

  if (timezone) {
    const tzLabel = getTimezoneLabel(timezone);
    const timezoneKey = translations.timezone || "Timezone";
    renderLabelValue(page, timezoneKey, tzLabel, margin, currentY, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
    currentY -= LINE_HEIGHT;
  }

  // Branding line: "Presented by WhiteWall  |  Powered by EventPass"
  {
    const BRAND_SIZE = 8;
    const presentedBy = translations.presentedBy || "Presented by";
    const poweredBy = translations.poweredBy || "Powered by";
    const grayColor = rgb(0.55, 0.55, 0.55);
    const darkColor = rgb(0.12, 0.16, 0.22);
    const blueColor = rgb(0, 0.467, 0.714);

    // Build pieces: ["Presented by ", "WhiteWall", "   |   ", "Powered by ", "EventPass"]
    const pieces = isRTL
      ? [
          { text: "EventPass", font: boldFont, color: blueColor },
          { text: ` ${poweredBy}   |   `, font, color: grayColor },
          { text: "WhiteWall", font: boldFont, color: darkColor },
          { text: ` ${presentedBy}`, font, color: grayColor },
        ]
      : [
          { text: `${presentedBy} `, font, color: grayColor },
          { text: "WhiteWall", font: boldFont, color: darkColor },
          { text: "   |   ", font, color: grayColor },
          { text: `${poweredBy} `, font, color: grayColor },
          { text: "EventPass", font: boldFont, color: blueColor },
        ];

    const totalW = pieces.reduce((sum, p) => sum + p.font.widthOfTextAtSize(p.text, BRAND_SIZE), 0);
    let drawX = (pageWidth - totalW) / 2;

    pieces.forEach((p) => {
      page.drawText(p.text, { x: drawX, y: currentY, size: BRAND_SIZE, font: p.font, color: p.color });
      drawX += p.font.widthOfTextAtSize(p.text, BRAND_SIZE);
    });

    currentY -= LINE_HEIGHT;
  }

  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  return currentY - 8.5;
};

// Generic KPI card row — takes array of { label, value, rgbColor }
const drawKpiCards = (page, cards, yPosition, pageWidth, margin, font, boldFont, isRTL = false) => {
  if (!cards.length) return yPosition;
  const count = cards.length;
  const gap = 10;
  const cardWidth = (pageWidth - margin * 2 - (count - 1) * gap) / count;
  const cardHeight = 68;
  const valueSize = 20;
  const labelSize = 9;
  const labelLineHeight = 11;

  const ordered = isRTL ? [...cards].reverse() : cards;
  ordered.forEach((card, i) => {
    const cardX = margin + i * (cardWidth + gap);
    const cardY = yPosition - cardHeight;

    page.drawRectangle({
      x: cardX, y: cardY, width: cardWidth, height: cardHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.878, 0.878, 0.878),
      borderWidth: 0.75,
    });

    // Colored top stripe on card
    page.drawRectangle({
      x: cardX, y: cardY + cardHeight - 4, width: cardWidth, height: 4,
      color: card.rgbColor,
    });

    const valueText = String(card.value);
    const valueWidth = boldFont.widthOfTextAtSize(valueText, valueSize);
    page.drawText(valueText, {
      x: Math.max(cardX + 2, cardX + (cardWidth - valueWidth) / 2),
      y: cardY + 38,
      size: valueSize, font: boldFont, color: card.rgbColor,
    });

    const labelText = String(card.label);
    const maxLabelWidth = cardWidth - 8;
    const words = labelText.split(" ");
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

    const labelStartY = lines.length === 1 ? cardY + 16 : cardY + 22;
    lines.forEach((line, li) => {
      const lw = font.widthOfTextAtSize(line, labelSize);
      page.drawText(line, {
        x: Math.max(cardX + 2, cardX + (cardWidth - lw) / 2),
        y: labelStartY - li * labelLineHeight,
        size: labelSize, font, color: rgb(0.459, 0.459, 0.459),
      });
    });
  });

  return yPosition - cardHeight;
};

const drawPrintStatsKpiCards = (page, eventInfo, yPosition, pageWidth, margin, font, boldFont, translations, isRTL = false) => {
  const cards = [
    { label: fixParens(translations.totalBadgePrints || "Total Badge Prints", isRTL),     value: String(eventInfo.totalPrints    ?? 0), rgbColor: rgb(0,      0.467, 0.714) },
    { label: fixParens(translations.noPrints        || "0 Prints (Never Printed)", isRTL), value: String(eventInfo.noPrintCount   ?? 0), rgbColor: rgb(0.937, 0.267, 0.267) },
    { label: fixParens(translations.onePrint        || "1 Print", isRTL),                  value: String(eventInfo.onePrintCount  ?? 0), rgbColor: rgb(0.961, 0.620, 0.043) },
    { label: fixParens(translations.multiPrint      || "Multi-Print (2+)", isRTL),         value: String(eventInfo.multiPrintCount ?? 0), rgbColor: rgb(0.063, 0.725, 0.506) },
    { label: fixParens(translations.multiPrintRate  || "Multi-Print Rate", isRTL),         value: `${eventInfo.multiPrintRate ?? "0.00"}%`, rgbColor: rgb(0.545, 0.361, 0.965) },
  ];
  return drawKpiCards(page, cards, yPosition, pageWidth, margin, font, boldFont, isRTL);
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

  // First content page
  let page = pdf.addPage([pageWidth, pageHeight]);
  let yPosition;
  try {
    yPosition = await addEventHeader(
      pdf, page, eventInfo, pageWidth, margin,
      surveyInfo, language, isRTL, translations, font, boldFont, timezone
    );
  } catch (err) {
    console.warn("Error rendering PDF header:", err.message);
    yPosition = PAGE_HEIGHT - margin;
  }
  yPosition -= spacing;

  // Top-level KPI summary cards
  if (eventInfo?.uniqueScanned !== undefined && eventInfo?.totalRegistrations !== undefined) {
    // EventReg / CheckIn
    const secLabel = translations.registrationAttendance || "Registration & Attendance";
    const secX = getTextX(secLabel, margin, pageWidth, margin, isRTL, "left", boldFont, FONT_SECTION);
    page.drawText(secLabel, { x: secX, y: yPosition, size: FONT_SECTION, font: boldFont, color: rgb(0.12, 0.16, 0.22) });
    yPosition -= 20;

    const regCards = [
      { label: fixParens(translations.totalRegistrations || "Total Registrations", isRTL), value: String(eventInfo.totalRegistrations ?? 0), rgbColor: rgb(0, 0.467, 0.714) },
      { label: fixParens(translations.totalScanned || "Total Scanned", isRTL),             value: String(eventInfo.uniqueScanned ?? 0),       rgbColor: rgb(0.008, 0.518, 0.780) },
      { label: fixParens(translations.scanRate || "Scan Rate", isRTL),                     value: `${eventInfo.scanRate ?? "0.00"}%`,          rgbColor: rgb(0.024, 0.714, 0.831) },
    ];
    yPosition = drawKpiCards(page, regCards, yPosition, pageWidth, margin, font, boldFont, isRTL);
    yPosition -= spacing;

  } else if (eventInfo?.uniqueVoters !== undefined) {
    // VoteCast
    const secLabel = translations.pollOverview || "Poll Overview";
    const secX = getTextX(secLabel, margin, pageWidth, margin, isRTL, "left", boldFont, FONT_SECTION);
    page.drawText(secLabel, { x: secX, y: yPosition, size: FONT_SECTION, font: boldFont, color: rgb(0.12, 0.16, 0.22) });
    yPosition -= 20;

    const hasParticipationRate = eventInfo.participationRate !== undefined && eventInfo.participationRate !== null;
    const voteCards = [
      { label: fixParens(translations.totalVotes || "Total Votes Cast", isRTL),         value: String(eventInfo.totalVotes ?? 0),    rgbColor: rgb(0, 0.467, 0.714) },
      ...(hasParticipationRate ? [{ label: fixParens(translations.participationRate || "Participation Rate", isRTL), value: `${eventInfo.participationRate}%`, rgbColor: rgb(0.008, 0.518, 0.780) }] : []),
      { label: fixParens(translations.questionCount || "Question Count", isRTL),        value: String(eventInfo.questionCount ?? 0), rgbColor: rgb(0.024, 0.714, 0.831) },
    ];
    yPosition = drawKpiCards(page, voteCards, yPosition, pageWidth, margin, font, boldFont, isRTL);
    yPosition -= spacing;
  }

  // Badge Print Stats (EventReg / CheckIn)
  if (eventInfo?.totalPrints !== undefined) {
    const kpiSectionHeight = 20 + 68;
    if (yPosition < kpiSectionHeight + margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }

    const sectionLabel = translations.badgePrintStats || "Badge Print Stats";
    const sectionLabelX = getTextX(sectionLabel, margin, pageWidth, margin, isRTL, "left", boldFont, FONT_SECTION);
    page.drawText(sectionLabel, { x: sectionLabelX, y: yPosition, size: FONT_SECTION, font: boldFont, color: rgb(0.12, 0.16, 0.22) });
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

  // Chart sections
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
        allowTaint: true,
        onclone: (_document, element) => {
          // Ensure SVG elements have explicit dimensions so html2canvas renders them
          element.querySelectorAll("svg").forEach((svg) => {
            const rect = svg.getBoundingClientRect();
            if (!svg.getAttribute("width") && rect.width > 0) {
              svg.setAttribute("width", String(Math.ceil(rect.width)));
            }
            if (!svg.getAttribute("height") && rect.height > 0) {
              svg.setAttribute("height", String(Math.ceil(rect.height)));
            }
          });
        },
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
        color: rgb(0.12, 0.16, 0.22),
      });
      yPosition -= 20;

      const typeLabel = translations.type || "Type";
      const topNLabel = translations.topN || "Top N";
      const intervalLabel = translations.intervalMinutes || "Interval (min)";

      if (surveyInfo && chartData) {
        const fieldType = chartData.questionType || chartData.type;
        let typeValue = "";
        if (fieldType === "multi") typeValue = "MCQ";
        else if (fieldType === "rating") typeValue = "Rating";
        else if (fieldType === "nps") typeValue = "NPS";

        if (typeValue) {
          renderLabelValue(page, typeLabel, typeValue, margin, yPosition, pageWidth, margin, isRTL, font, boldFont, FONT_LABEL);
          yPosition -= LINE_HEIGHT;
        }
      }

      if (
        chartData.chartType === "pie" &&
        (chartData.type === "text" || chartData.type === "number" || chartData.type === "categorical" || chartData.type === "multi" || chartData.questionType === "multi") &&
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
          const sp = 2.8;
          const colon = ":";

          if (isRTL) {
            const labelText = String(intervalBase);
            const labelWidth = boldFont.widthOfTextAtSize(labelText, FONT_LABEL);
            const colonWidth = font.widthOfTextAtSize(colon, FONT_LABEL);
            const numberWidth = font.widthOfTextAtSize(intervalNumber, FONT_LABEL);
            const minWidth = font.widthOfTextAtSize(intervalSuffix, FONT_LABEL);
            const spaceWidth = font.widthOfTextAtSize(" ", FONT_LABEL);
            const labelX = pageWidth - margin - labelWidth;
            const colonX = labelX - sp - colonWidth;
            const valueX = colonX - sp - numberWidth - spaceWidth - minWidth;

            page.drawText(labelText, { x: labelX, y: yPosition, size: FONT_LABEL, font: boldFont });
            page.drawText(colon, { x: colonX, y: yPosition, size: FONT_LABEL, font });
            page.drawText(intervalNumber, { x: valueX, y: yPosition, size: FONT_LABEL, font });
            page.drawText(intervalSuffix, { x: valueX + numberWidth + spaceWidth, y: yPosition, size: FONT_LABEL, font });
          } else {
            const labelText = `${intervalBase}${colon} `;
            const labelWidth = boldFont.widthOfTextAtSize(labelText, FONT_LABEL);
            const numberWidth = font.widthOfTextAtSize(intervalNumber, FONT_LABEL);
            page.drawText(labelText, { x: margin, y: yPosition, size: FONT_LABEL, font: boldFont });
            page.drawText(intervalNumber, { x: margin + labelWidth, y: yPosition, size: FONT_LABEL, font });
            page.drawText(` ${intervalSuffix}`, { x: margin + labelWidth + numberWidth, y: yPosition, size: FONT_LABEL, font });
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

  // Response Pattern section (unlinked VoteCast polls only)
  if (Array.isArray(eventInfo?.responsePatternQuestions) && eventInfo.responsePatternQuestions.length > 0) {
    const rpLabel = translations.responsePattern || "Response Pattern";
    const Q_SIZE = 9;
    const OPT_SIZE = 8;
    const LINE_H = 13;
    const maxW = pageWidth - margin * 2;

    await ensureSpace(60);

    const rpLabelX = getTextX(rpLabel, margin, pageWidth, margin, isRTL, "left", boldFont, FONT_SECTION);
    page.drawText(rpLabel, { x: rpLabelX, y: yPosition, size: FONT_SECTION, font: boldFont, color: rgb(0.12, 0.16, 0.22) });
    yPosition -= spacing;

    const truncate = (text, f, size, maxPx) => {
      let t = String(text || "");
      while (t.length > 4 && f.widthOfTextAtSize(t, size) > maxPx) t = t.slice(0, -4) + "...";
      return t;
    };

    for (const q of eventInfo.responsePatternQuestions) {
      const options = q.options || [];
      const total = options.reduce((sum, o) => sum + (o.votes || 0), 0);
      const blockH = LINE_H + options.length * LINE_H + spacing;
      await ensureSpace(blockH);

      const qText = truncate(q.question, boldFont, Q_SIZE, maxW);
      const qX = getTextX(qText, margin, pageWidth, margin, isRTL, "left", boldFont, Q_SIZE);
      page.drawText(qText, { x: qX, y: yPosition, size: Q_SIZE, font: boldFont, color: rgb(0.12, 0.16, 0.22) });
      yPosition -= LINE_H;

      for (const opt of options) {
        const pct = total > 0 ? ((opt.votes || 0) / total * 100).toFixed(1) : "0.0";
        const countText = String(opt.votes || 0);
        const pctText = `${pct}%`;
        const countW = font.widthOfTextAtSize(countText, OPT_SIZE);
        const pctW = font.widthOfTextAtSize(pctText, OPT_SIZE);
        const gap = font.widthOfTextAtSize("   ", OPT_SIZE);
        const maxOptW = maxW - countW - gap - pctW - gap - 8;
        const optText = truncate(opt.text, font, OPT_SIZE, maxOptW);

        if (isRTL) {
          page.drawText(pctText,   { x: margin,                                                          y: yPosition, size: OPT_SIZE, font, color: rgb(0.5, 0.5, 0.5) });
          page.drawText(countText, { x: margin + pctW + gap,                                             y: yPosition, size: OPT_SIZE, font, color: rgb(0.5, 0.5, 0.5) });
          page.drawText(optText,   { x: pageWidth - margin - font.widthOfTextAtSize(optText, OPT_SIZE),  y: yPosition, size: OPT_SIZE, font, color: rgb(0.22, 0.22, 0.22) });
        } else {
          page.drawText(optText,   { x: margin + 8,                                y: yPosition, size: OPT_SIZE, font, color: rgb(0.22, 0.22, 0.22) });
          page.drawText(countText, { x: pageWidth - margin - pctW - gap - countW, y: yPosition, size: OPT_SIZE, font, color: rgb(0.5, 0.5, 0.5) });
          page.drawText(pctText,   { x: pageWidth - margin - pctW,                y: yPosition, size: OPT_SIZE, font, color: rgb(0.5, 0.5, 0.5) });
        }
        yPosition -= LINE_H;
      }
      yPosition -= spacing / 2;
    }

    page.drawLine({
      start: { x: margin, y: yPosition },
      end:   { x: pageWidth - margin, y: yPosition },
      thickness: 0.3,
      color: rgb(0.6, 0.6, 0.6),
    });
    yPosition -= spacing;
  }

  // Footer: confidential text + page numbers on every page
  const pages = pdf.getPages();
  const totalPages = pages.length;
  const pageLabel = translations.page || "Page";
  const ofLabel = translations.of || "of";
  const confText = translations.confidential || "Confidential — For Internal Use Only";

  for (let i = 0; i < totalPages; i++) {
    const pg = pages[i];
    const pageNum = i + 1;
    const pageText = language === "ar"
      ? `الصفحة ${pageNum} من ${totalPages}`
      : `${pageLabel} ${pageNum} ${ofLabel} ${totalPages}`;

    const confSize = 8;
    const pgW = font.widthOfTextAtSize(pageText, FONT_PAGENUM);

    if (isRTL) {
      pg.drawText(confText, {
        x: pageWidth - margin - font.widthOfTextAtSize(confText, confSize),
        y: 20, size: confSize, font, color: rgb(0.47, 0.47, 0.47),
      });
      pg.drawText(pageText, {
        x: margin, y: 20, size: FONT_PAGENUM, font, color: rgb(0.47, 0.47, 0.47),
      });
    } else {
      pg.drawText(confText, {
        x: margin, y: 20, size: confSize, font, color: rgb(0.47, 0.47, 0.47),
      });
      pg.drawText(pageText, {
        x: pageWidth - margin - pgW, y: 20, size: FONT_PAGENUM, font, color: rgb(0.47, 0.47, 0.47),
      });
    }
  }

  // Save & download
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
