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

// ---- FUTURA ----
import Futura_Bold from "../../fonts/futura/FuturaStdBold.otf";
import Futura_Book from "../../fonts/futura/FuturaStdBook.otf";
import Futura_Medium from "../../fonts/futura/FuturaStdMedium.otf";

// ---- IBM PLEX ----
import IBM_Regular from "../../fonts/IBMPlexSansArabic/IBMPlexSansArabic-Regular.ttf";
import IBM_Medium from "../../fonts/IBMPlexSansArabic/IBMPlexSansArabic-Medium.ttf";
import IBM_Bold from "../../fonts/IBMPlexSansArabic/IBMPlexSansArabic-Bold.ttf";

// ---- Arial -----
import Arial_Regular from "../../fonts/arial/ArialRegular.ttf";
import Arial_Bold from "../../fonts/arial/ArialBold.ttf";

// --------------------------------------------------------------
// STATIC FONT REGISTRATION (DONE ONCE, GLOBALLY)
// --------------------------------------------------------------
Font.register({
  family: "Futura",
  fonts: [
    { src: Futura_Book, fontWeight: 400 },
    { src: Futura_Medium, fontWeight: 500 },
    { src: Futura_Bold, fontWeight: 700 },
  ],
});

Font.register({
  family: "IBM Plex Sans Arabic",
  fonts: [
    { src: IBM_Regular, fontWeight: 400 },
    { src: IBM_Medium, fontWeight: 500 },
    { src: IBM_Bold, fontWeight: 700 },
  ],
});

Font.register({
  family: "Arial",
  fonts: [
    { src: Arial_Regular, fontWeight: 400 },
    { src: Arial_Bold, fontWeight: 700 },
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

export default function BadgePDF({ data, qrCodeDataUrl, single = true }) {
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
