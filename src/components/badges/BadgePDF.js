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
  if (!name) return 32;

  const length = name.length;
  const avgCharWidthRatio = 0.6;

  const maxFontSize = AVAILABLE_NAME_WIDTH / (length * avgCharWidthRatio);

  const minFontSize = 18;
  const maxAllowedFontSize = 42;

  if (length <= 10) {
    return Math.min(maxAllowedFontSize, Math.max(minFontSize, maxFontSize));
  }

  return Math.min(maxAllowedFontSize, Math.max(minFontSize, maxFontSize));
}

function calculateCompanyFontSize(company) {
  if (!company) return 24;

  const length = company.length;
  const avgCharWidthRatio = 0.55;
  const safetyMargin = 0.9;

  const maxFontSize = (AVAILABLE_COMPANY_WIDTH * safetyMargin) / (length * avgCharWidthRatio);

  const minFontSize = 14;
  const maxAllowedFontSize = 30;

  if (length <= 10) {
    return Math.min(maxAllowedFontSize, Math.max(minFontSize, maxFontSize));
  }

  return Math.min(maxAllowedFontSize, Math.max(minFontSize, maxFontSize));
}

export default function BadgePDF({ data, qrCodeDataUrl, single = true }) {
  const nameFontSize = calculateNameFontSize(data?.fullName);
  const nameStyle = {
    fontWeight: "bold",
    color: "#000",
    width: `${NAME_WIDTH_PERCENT * 100}%`,
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
    fontSize: nameFontSize,
  };

  let companyFontSize = calculateCompanyFontSize(data?.company);
  const maxCompanyFontSize = nameFontSize * 0.75;
  companyFontSize = Math.min(companyFontSize, maxCompanyFontSize);
  const companyStyle = {
    color: "#000",
    marginTop: 1,
    width: `${COMPANY_WIDTH_PERCENT * 100}%`,
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
    fontSize: companyFontSize,
  };

  const content = (
    <Page size={[A6_WIDTH, A6_HEIGHT]} style={styles.page}>
      <View style={styles.contentArea}>
        {data.fullName && <Text style={nameStyle}>{data.fullName}</Text>}
        {data.company && <Text style={companyStyle}>{data.company}</Text>}
        {data.title && <Text style={styles.title}>{data.title}</Text>}
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
