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

import regularFont from "../fonts/IBMPlexSansArabic-Regular.ttf";
import mediumFont from "../fonts/IBMPlexSansArabic-Medium.ttf";
import boldFont from "../fonts/IBMPlexSansArabic-Bold.ttf";

Font.register({
  family: "IBM Plex Sans Arabic",
  fonts: [
    { src: regularFont, fontWeight: "normal" },
    { src: mediumFont, fontWeight: "500" },
    { src: boldFont, fontWeight: "bold" },
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
    fontFamily: "IBM Plex Sans Arabic",
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
    marginTop: 3,
    letterSpacing: 0.7,
    textAlign: "center",
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#000" },
  title: { fontSize: 11, color: "#444", marginTop: 4 },
  company: { fontSize: 14, color: "#000", marginTop: 3 },
  badgeIdentifier: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#0077b6",
    marginTop: 10,
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
        {data.title && <Text style={styles.title}>{data.title}</Text>}
        {data.company && <Text style={styles.company}>{data.company}</Text>}
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
