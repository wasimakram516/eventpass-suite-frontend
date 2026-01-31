import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// --------------------------------------------------------------

// Auto-generated font imports
import arial_0 from "../../fonts/arial/ArialBold.ttf";
import arial_1 from "../../fonts/arial/ArialRegular.ttf";
import futura_0 from "../../fonts/futura/FuturaStdBold.otf";
import futura_1 from "../../fonts/futura/FuturaStdBoldOblique.otf";
import futura_2 from "../../fonts/futura/FuturaStdBook.otf";
import futura_3 from "../../fonts/futura/FuturaStdBookOblique.otf";
import futura_4 from "../../fonts/futura/FuturaStdCondensed.otf";
import futura_5 from "../../fonts/futura/FuturaStdCondensedBold.otf";
import futura_6 from "../../fonts/futura/FuturaStdCondensedBoldObl.otf";
import futura_7 from "../../fonts/futura/FuturaStdCondensedExtraBd.otf";
import futura_8 from "../../fonts/futura/FuturaStdCondensedLight.otf";
import futura_9 from "../../fonts/futura/FuturaStdCondensedLightObl.otf";
import futura_10 from "../../fonts/futura/FuturaStdCondensedOblique.otf";
import futura_11 from "../../fonts/futura/FuturaStdCondExtraBoldObl.otf";
import futura_12 from "../../fonts/futura/FuturaStdExtraBold.otf";
import futura_13 from "../../fonts/futura/FuturaStdExtraBoldOblique.otf";
import futura_14 from "../../fonts/futura/FuturaStdHeavy.otf";
import futura_15 from "../../fonts/futura/FuturaStdHeavyOblique.otf";
import futura_16 from "../../fonts/futura/FuturaStdLight.otf";
import futura_17 from "../../fonts/futura/FuturaStdLightOblique.otf";
import futura_18 from "../../fonts/futura/FuturaStdMedium.otf";
import futura_19 from "../../fonts/futura/FuturaStdMediumOblique.otf";
import IBMPlexSansArabic_0 from "../../fonts/IBMPlexSansArabic/IBMPlexSansArabic-Bold.ttf";
import IBMPlexSansArabic_1 from "../../fonts/IBMPlexSansArabic/IBMPlexSansArabic-Medium.ttf";
import IBMPlexSansArabic_2 from "../../fonts/IBMPlexSansArabic/IBMPlexSansArabic-Regular.ttf";
import love_0 from "../../fonts/love/LoveDays-2v7Oe.ttf";
import Midable_0 from "../../fonts/Midable/Midable.ttf";
import romeo_0 from "../../fonts/romeo/Pinky Peace.otf";
import welcome_0 from "../../fonts/welcome/Welcome September.ttf";

// --------------------------------------------------------------

// --------------------------------------------------------------
// STATIC FONT REGISTRATION (AUTO-GENERATED)
// --------------------------------------------------------------
Font.register({
  family: "Arial",
  fonts: [
    { src: arial_0, fontWeight: 700, fontStyle: 'normal' },
    { src: arial_1, fontWeight: 400, fontStyle: 'normal' }
  ],
});

Font.register({
  family: "Futura",
  fonts: [
    { src: futura_0, fontWeight: 700, fontStyle: 'normal' },
    { src: futura_1, fontWeight: 700, fontStyle: 'italic' },
    { src: futura_2, fontWeight: 400, fontStyle: 'normal' },
    { src: futura_3, fontWeight: 400, fontStyle: 'italic' },
    { src: futura_4, fontWeight: 400, fontStyle: 'normal' },
    { src: futura_5, fontWeight: 700, fontStyle: 'normal' },
    { src: futura_6, fontWeight: 700, fontStyle: 'italic' },
    { src: futura_7, fontWeight: 900, fontStyle: 'normal' },
    { src: futura_8, fontWeight: 300, fontStyle: 'normal' },
    { src: futura_9, fontWeight: 300, fontStyle: 'italic' },
    { src: futura_10, fontWeight: 400, fontStyle: 'italic' },
    { src: futura_11, fontWeight: 700, fontStyle: 'italic' },
    { src: futura_12, fontWeight: 700, fontStyle: 'normal' },
    { src: futura_13, fontWeight: 700, fontStyle: 'italic' },
    { src: futura_14, fontWeight: 800, fontStyle: 'normal' },
    { src: futura_15, fontWeight: 800, fontStyle: 'italic' },
    { src: futura_16, fontWeight: 300, fontStyle: 'normal' },
    { src: futura_17, fontWeight: 300, fontStyle: 'italic' },
    { src: futura_18, fontWeight: 500, fontStyle: 'normal' },
    { src: futura_19, fontWeight: 500, fontStyle: 'italic' }
  ],
});

Font.register({
  family: "IBM Plex Sans Arabic",
  fonts: [
    { src: IBMPlexSansArabic_0, fontWeight: 700, fontStyle: 'normal' },
    { src: IBMPlexSansArabic_1, fontWeight: 500, fontStyle: 'normal' },
    { src: IBMPlexSansArabic_2, fontWeight: 400, fontStyle: 'normal' }
  ],
});

Font.register({
  family: "Love",
  fonts: [
    { src: love_0, fontWeight: 400, fontStyle: 'normal' }
  ],
});

Font.register({
  family: "Midable",
  fonts: [
    { src: Midable_0, fontWeight: 400, fontStyle: 'normal' }
  ],
});

Font.register({
  family: "Romeo",
  fonts: [
    { src: romeo_0, fontWeight: 400, fontStyle: 'normal' }
  ],
});

Font.register({
  family: "Welcome",
  fonts: [
    { src: welcome_0, fontWeight: 400, fontStyle: 'normal' }
  ],
});

const A6_WIDTH = 297.6;
const A6_HEIGHT = 419.5;
const NAME_WIDTH_PERCENT = 0.9;
const AVAILABLE_NAME_WIDTH = A6_WIDTH * NAME_WIDTH_PERCENT;
const COMPANY_WIDTH_PERCENT = 0.7;
const AVAILABLE_COMPANY_WIDTH = A6_WIDTH * COMPANY_WIDTH_PERCENT;
const TITLE_WIDTH_PERCENT = 0.75;
const AVAILABLE_TITLE_WIDTH = A6_WIDTH * TITLE_WIDTH_PERCENT;

const styles = StyleSheet.create({
  page: {
    width: A6_WIDTH,
    height: A6_HEIGHT,
    backgroundColor: "#ffffff",
    position: "relative",
    paddingTop: 120,
    paddingBottom: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
  },
  pageCustomized: {
    width: A6_WIDTH,
    height: A6_HEIGHT,
    backgroundColor: "#ffffff",
    position: "relative",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial",
  },
  contentArea: {
    width: "100%",
    textAlign: "center",
  },
  qrWrapper: {
    position: "absolute",
    bottom: 20,
    left: 25,
    width: 90,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  qrImage: { width: 70, height: 70 },
  token: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0077b6",
    letterSpacing: 0.7,
    textAlign: "center",
  },
  name: {
    fontWeight: "bold",
    color: "#000",
    width: `${NAME_WIDTH_PERCENT * 100}%`,
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
  },
  company: {
    color: "#000",
    marginTop: 1,
    width: `${COMPANY_WIDTH_PERCENT * 100}%`,
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
    maxWidth: "80%",
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
  },
  badgeIdentifier: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#0077b6",
    marginTop: 10,
    maxWidth: "80%",
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
  },
});

function calculateNameFontSize(name) {
  if (!name) return 25;

  const length = name.length;
  const avgCharsPerLine = 25;
  const maxLines = 2;
  const maxChars = avgCharsPerLine * maxLines;

  if (length <= 15) {
    return 25;
  } else if (length <= avgCharsPerLine) {
    const fontSize = 25 - (length - 15) * 0.5;
    return Math.max(20, fontSize);
  } else if (length <= maxChars) {
    const fontSize = 20 - (length - avgCharsPerLine) * 0.35;
    return Math.max(15, fontSize);
  } else {
    const fontSize = 15 - (length - maxChars) * 0.25;
    return Math.max(12, fontSize);
  }
}

function calculateCompanyFontSize(company) {
  if (!company) return 20;

  const length = company.length;
  const avgCharsPerLine = 30;
  const maxLines = 2;
  const maxChars = avgCharsPerLine * maxLines;

  if (length <= 20) {
    return 20;
  } else if (length <= avgCharsPerLine) {
    const fontSize = 20 - (length - 20) * 0.4;
    return Math.max(16, fontSize);
  } else if (length <= maxChars) {
    const fontSize = 16 - (length - avgCharsPerLine) * 0.3;
    return Math.max(12, fontSize);
  } else {
    const fontSize = 12 - (length - maxChars) * 0.2;
    return Math.max(10, fontSize);
  }
}

// Commented out - Title/Designation not displayed on badge anymore (might be needed in future)
// function calculateTitleFontSize(title) {
//   if (!title) return 14;

//   const length = title.length;
//   const avgCharsPerLine = 35;
//   const maxLines = 2;
//   const maxChars = avgCharsPerLine * maxLines;

//   if (length <= 25) {
//     return 14;
//   } else if (length <= avgCharsPerLine) {
//     const fontSize = 14 - (length - 25) * 0.3;
//     return Math.max(12, fontSize);
//   } else if (length <= maxChars) {
//     const fontSize = 12 - (length - avgCharsPerLine) * 0.25;
//     return Math.max(10, fontSize);
//   } else {
//     const fontSize = 10 - (length - maxChars) * 0.15;
//     return Math.max(8, fontSize);
//   }
// }

function wrapTextAtWords(text, fontSize, availableWidth, isBold = false) {
  if (!text) return [text];

  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [text];

  const charWidthRatio = isBold ? 0.75 : 0.65;
  const estimatedCharWidth = fontSize * charWidthRatio;
  const safetyMargin = 0.85;
  const effectiveWidth = availableWidth * safetyMargin;

  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const estimatedWidth = testLine.length * estimatedCharWidth;

    if (estimatedWidth > effectiveWidth && currentLine && lines.length < 1) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 2);
}

function parseHTMLToText(html) {
  if (!html) return {
    text: "",
    isBold: false,
    isItalic: false,
    isUnderline: false,
    color: "#000000",
    fontSize: null
  };

  let text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

  const isBold = /<(strong|b)>/i.test(html) || /font-weight:\s*(bold|700|800|900)/i.test(html);

  const isItalic = /<(em|i)>/i.test(html) || /font-style:\s*italic/i.test(html);

  const isUnderline = /<u>/i.test(html) || /text-decoration:\s*underline/i.test(html);

  const colorMatch = html.match(/color:\s*([^;'"]+)/i) || html.match(/color="([^"]+)"/i);
  const color = colorMatch ? colorMatch[1].trim() : "#000000";

  let fontFamily = null;
  const fontFamilyMatch = html.match(/font-family:\s*([^;]+)/i);
  if (fontFamilyMatch) {
    let fontFamilyStr = fontFamilyMatch[1].trim();
    fontFamilyStr = fontFamilyStr
      .replace(/&quot;?/g, '')
      .replace(/&apos;?/g, '')
      .replace(/&amp;?/g, '&')
      .replace(/&lt;?/g, '')
      .replace(/&gt;?/g, '')
      .replace(/&[a-z0-9]+;?/gi, '')
      .replace(/&[^a-z0-9\s]/gi, '')
      .replace(/['"]/g, '')
      .trim();
    // Take the first font name if multiple are specified (e.g., "Arial, sans-serif" -> "Arial")
    fontFamily = fontFamilyStr.split(',')[0].trim();
    if (!fontFamily || fontFamily.length === 0 || fontFamily.startsWith('&')) {
      fontFamily = null;
    }
  }

  let fontSize = null;

  const sizeAttrMatch = html.match(/size="?(\d+)"?/i);
  if (sizeAttrMatch) {
    const sizeValue = parseInt(sizeAttrMatch[1]);
    const sizeMap = {
      1: 10,
      2: 13,
      3: 16,
      4: 18,
      5: 24,
      6: 32,
      7: 48
    };
    fontSize = sizeMap[sizeValue] || 16;
  }

  const fontSizeMatch = html.match(/font-size:\s*([^;'"]+)/i);
  if (fontSizeMatch) {
    const sizeStr = fontSizeMatch[1].trim();
    fontSize = parseFloat(sizeStr);
  }

  return {
    text,
    isBold: !!isBold,
    isItalic: !!isItalic,
    isUnderline: !!isUnderline,
    color,
    fontSize,
    fontFamily
  };
}

function getFieldValue(fieldName, data) {
  if (data.customFields && data.customFields[fieldName]) {
    return String(data.customFields[fieldName]);
  }

  const fieldMap = {
    "Full Name": data.fullName,
    "Name": data.fullName,
    "Company": data.company,
    "Email": data.email,
    "Phone": data.phone,
  };

  return fieldMap[fieldName] || "";
}

export default function BadgePDF({ data, qrCodeDataUrl, customizations, single = true }) {
  const hasCustomizations = customizations && Object.keys(customizations).length > 0;

  if (hasCustomizations) {
    const customFields = Object.keys(customizations).filter(key => key !== "_qrCode");

    const content = (
      <Page size={[A6_WIDTH, A6_HEIGHT]} style={styles.pageCustomized}>
        {customFields.map((fieldName) => {
          const customization = customizations[fieldName];
          if (!customization) return null;

          const fieldValue = getFieldValue(fieldName, data);
          if (!fieldValue) return null;

          let fontSize, color, isBold, isItalic, isUnderline, fontFamily;

          if (customization.content && typeof customization.content === 'string' && customization.content.includes('<')) {
            const parsed = parseHTMLToText(customization.content);
            fontSize = parsed.fontSize || 14;
            color = parsed.color || "#000000";
            isBold = parsed.isBold || false;
            isItalic = parsed.isItalic || false;
            isUnderline = parsed.isUnderline || false;
            let parsedFontFamily = parsed.fontFamily || "Arial";
            if (typeof parsedFontFamily === 'string') {
              parsedFontFamily = parsedFontFamily
                .replace(/&quot;?/g, '')
                .replace(/&apos;?/g, '')
                .replace(/&amp;?/g, '&')
                .replace(/&lt;?/g, '')
                .replace(/&gt;?/g, '')
                .replace(/&[a-z0-9]+;?/gi, '')
                .replace(/&[^a-z0-9\s]/gi, '')
                .replace(/['"]/g, '')
                .trim();
              parsedFontFamily = parsedFontFamily.split(',')[0].trim() || "Arial";
              if (!parsedFontFamily || parsedFontFamily.length === 0 || parsedFontFamily.startsWith('&')) {
                fontFamily = "Arial";
              } else {
                fontFamily = parsedFontFamily;
              }
            } else {
              fontFamily = "Arial";
            }
          } else {
            fontSize = customization.fontSize !== undefined ? customization.fontSize : 14;
            color = customization.color || "#000000";
            isBold = customization.isBold || false;
            isItalic = customization.isItalic || false;
            isUnderline = customization.isUnderline || false;
            let rawFontFamily = customization.fontFamily || "Arial";
            if (typeof rawFontFamily === 'string') {
              rawFontFamily = rawFontFamily
                .replace(/&quot;?/g, '')
                .replace(/&apos;?/g, '')
                .replace(/&amp;?/g, '&')
                .replace(/&lt;?/g, '')
                .replace(/&gt;?/g, '')
                .replace(/&[a-z0-9]+;?/gi, '')
                .replace(/&[^a-z0-9\s]/gi, '')
                .replace(/['"]/g, '')
                .trim();
              rawFontFamily = rawFontFamily.split(',')[0].trim() || "Arial";
              if (!rawFontFamily || rawFontFamily.length === 0 || rawFontFamily.startsWith('&')) {
                fontFamily = "Arial";
              } else {
                fontFamily = rawFontFamily;
              }
            } else {
              fontFamily = "Arial";
            }
          }


          const actualText = fieldValue;

          const yPercent = customization.y || 0;
          const alignment = customization.alignment || "left";

          const fontSizePt = fontSize * (72 / 96);
          const baselineAdjustmentPt = fontSizePt * 0.2;
          const baselineAdjustmentPercent = (baselineAdjustmentPt / A6_HEIGHT) * 100;
          const adjustedYPercent = Math.max(0, yPercent - baselineAdjustmentPercent);

          let finalFontFamily = fontFamily || "Arial";
          if (typeof finalFontFamily === 'string') {
            finalFontFamily = finalFontFamily
              .replace(/&quot;?/g, '')
              .replace(/&apos;?/g, '')
              .replace(/&amp;?/g, '&')
              .replace(/&lt;?/g, '')
              .replace(/&gt;?/g, '')
              .replace(/&[a-z0-9]+;?/gi, '')
              .replace(/&[^a-z0-9\s]/gi, '')
              .replace(/['"]/g, '')
              .trim();
            finalFontFamily = finalFontFamily.split(',')[0].trim() || "Arial";
            if (!finalFontFamily || finalFontFamily.length === 0 || /^[&;]+$/.test(finalFontFamily) || finalFontFamily.startsWith('&')) {
              finalFontFamily = "Arial";
            }
          } else {
            finalFontFamily = "Arial";
          }

          const textStyle = {
            fontSize: fontSizePt,
            color: color,
            textAlign: alignment,
            lineHeight: 1.0,
            fontFamily: finalFontFamily,
            margin: 0,
            padding: 0,
          };

          if (isBold && !isItalic) {
            textStyle.fontWeight = "bold";
          } else if (isBold && isItalic) {
            textStyle.fontWeight = "bold";
          }

          if (isItalic && !isBold) {
            textStyle.fontStyle = "italic";
          }

          if (isUnderline) {
            textStyle.textDecoration = "underline";
          }

          let viewStyle = {
            position: "absolute",
            top: `${adjustedYPercent}%`,
            margin: 0,
            padding: 0,
          };

          if (alignment === "center") {
            viewStyle.left = "5%";
            viewStyle.width = "90%";
            viewStyle.maxWidth = "90%";
          } else if (alignment === "right") {
            viewStyle.right = "0%";
            viewStyle.maxWidth = "90%";
          } else {
            const xPercent = customization.x || 0;
            viewStyle.left = `${xPercent}%`;
            viewStyle.maxWidth = "90%";
          }

          return (
            <View
              key={fieldName}
              style={viewStyle}
            >
              <Text style={textStyle}>
                {actualText}
              </Text>
            </View>
          );
        })}

        {data.showQrOnBadge && customizations._qrCode && qrCodeDataUrl && (
          <View
            style={{
              position: "absolute",
              left: `${customizations._qrCode.x || 5}%`,
              top: `${customizations._qrCode.y || 85}%`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image
              src={qrCodeDataUrl}
              style={{
                width: (customizations._qrCode.size || 70) * (72 / 96),
                height: (customizations._qrCode.size || 70) * (72 / 96),
              }}
            />
            <Text
              style={{
                fontSize: ((customizations._qrCode.size || 70) / 70) * 9 * (72 / 96),
                fontWeight: "bold",
                color: "#0077b6",
                letterSpacing: 0.7,
                marginTop: 2,
              }}
            >
              {data.token}
            </Text>
          </View>
        )}
      </Page>
    );

    return single ? <Document>{content}</Document> : content;
  }

  const nameFontSize = calculateNameFontSize(data?.fullName);
  const nameStyle = {
    fontWeight: "bold",
    color: "#000",
    lineHeight: 1.2,
    textAlign: "center",
    fontSize: nameFontSize,
  };

  let companyFontSize = calculateCompanyFontSize(data?.company);
  const maxCompanyFontSize = nameFontSize * 0.85;
  companyFontSize = Math.min(companyFontSize, maxCompanyFontSize);
  const companyStyle = {
    color: "#000",
    marginTop: 1,
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
    fontSize: companyFontSize,
  };

  // Commented out - Title/Designation not displayed on badge anymore (might be needed in future)
  // const targetTitleFontSize = Math.max(companyFontSize - 2, 8);
  // let titleFontSize = calculateTitleFontSize(data?.title);
  // titleFontSize = Math.max(titleFontSize, targetTitleFontSize);
  // const titleStyle = {
  //   fontSize: titleFontSize,
  //   color: "#444",
  //   marginTop: 4,
  //   width: `${TITLE_WIDTH_PERCENT * 100}%`,
  //   lineHeight: 1.2,
  //   textAlign: "center",
  //   alignSelf: "center",
  //   maxWidth: `${TITLE_WIDTH_PERCENT * 100}%`,
  // };

  const nameLines = data?.fullName ? wrapTextAtWords(data.fullName, nameFontSize, AVAILABLE_NAME_WIDTH, true) : [];
  const companyLines = data?.company ? wrapTextAtWords(data.company, companyFontSize, AVAILABLE_COMPANY_WIDTH, false) : [];
  // const titleLines = data?.title ? wrapTextAtWords(data.title, titleFontSize, AVAILABLE_TITLE_WIDTH, false) : [];

  const content = (
    <Page size={[A6_WIDTH, A6_HEIGHT]} style={styles.page}>
      <View style={styles.contentArea}>
        {nameLines.length > 0 && (
          <View style={{ width: `${NAME_WIDTH_PERCENT * 100}%`, alignSelf: "center" }}>
            {nameLines.map((line, index) => (
              <Text key={index} style={nameStyle}>{line}</Text>
            ))}
          </View>
        )}
        {companyLines.length > 0 && (
          <View style={{ width: `${COMPANY_WIDTH_PERCENT * 100}%`, alignSelf: "center" }}>
            {companyLines.map((line, index) => (
              <Text key={index} style={companyStyle}>{line}</Text>
            ))}
          </View>
        )}
        {/* Commented out - Title/Designation not displayed on badge anymore (might be needed in future) */}
        {/* {titleLines.length > 0 && (
          <View>
            {titleLines.map((line, index) => (
              <Text key={index} style={titleStyle}>{line}</Text>
            ))}
          </View>
        )} */}
        {data.badgeIdentifier && (
          <Text style={styles.badgeIdentifier}>{data.badgeIdentifier}</Text>
        )}
      </View>

      {data.showQrOnBadge && (
        <View style={styles.qrWrapper}>
          <Image src={qrCodeDataUrl} style={styles.qrImage} />
          <Text style={styles.token}>{data.token}</Text>
        </View>
      )}
    </Page>
  );

  // Wrap in <Document> only if rendering a single badge
  return single ? <Document>{content}</Document> : content;
}