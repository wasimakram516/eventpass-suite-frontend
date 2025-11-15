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
    bottom: 35,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    maxWidth: "80%",
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
  },
  company: {
    fontSize: 14,
    color: "#000",
    marginTop: 1,
    maxWidth: "80%",
    lineHeight: 1.2,
    textAlign: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 11,
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

/**
 * Reusable Badge PDF component
 * - When `single` = true → wraps with <Document> (for one-off print/download)
 * - When `single` = false → returns only <Page> (for batch export)
 */
export default function BadgePDF({ data, qrCodeDataUrl, single = true }) {
  const content = (
    <Page size={[A6_WIDTH, A6_HEIGHT]} style={styles.page}>
      <View style={styles.contentArea}>
        {data.fullName && <Text style={styles.name}>{data.fullName}</Text>}
        {data.company && <Text style={styles.company}>{data.company}</Text>}
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
