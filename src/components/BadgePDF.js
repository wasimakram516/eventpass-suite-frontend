import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const A6_WIDTH = 297.6;
const A6_HEIGHT = 419.5;

const styles = StyleSheet.create({
  page: {
    width: A6_WIDTH,
    height: A6_HEIGHT,
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 120, // space for top preprinted area
    paddingBottom: 60, // space for bottom preprinted area
  },

  contentArea: {
    flexGrow: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  qrWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  qrImage: {
    width: 110,
    height: 110,
  },
  token: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0077b6",
    marginTop: 4,
    letterSpacing: 1,
  },
  divider: {
    borderBottom: "1pt solid #ccc",
    width: "60%",
    marginTop: 8,
    marginBottom: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  title: {
    fontSize: 11,
    color: "#444",
    marginTop: 4,
    textAlign: "center",
  },
  company: {
    fontSize: 11,
    color: "#000",
    marginTop: 3,
    textAlign: "center",
  },
  badgeIdentifier: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#0077b6",
    marginTop: 10,
    textAlign: "center",
  },
});

export default function BadgePDF({ data, qrCodeDataUrl }) {
  return (
    <Document>
      <Page size={[A6_WIDTH, A6_HEIGHT]} style={styles.page}>
        <View style={styles.contentArea}>
          {/* QR section (reserved space, even if hidden) */}
          <View style={styles.qrWrapper}>
            {data.showQrOnBadge && (
              <>
                <Image src={qrCodeDataUrl} style={styles.qrImage} />
                <Text style={styles.token}>{data.token}</Text>
                <View style={styles.divider} />
              </>
            )}
          </View>

          {/* Attendee info */}
          {data.fullName && <Text style={styles.name}>{data.fullName}</Text>}
          {data.title && <Text style={styles.title}>{data.title}</Text>}
          {data.company && <Text style={styles.company}>{data.company}</Text>}

          {/* Badge identifier (e.g., Visitor, Sponsor, Exhibitor) */}
          {data.badgeIdentifier && (
            <Text style={styles.badgeIdentifier}>{data.badgeIdentifier}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
