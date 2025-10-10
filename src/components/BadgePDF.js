import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const A6_WIDTH = 297.6;
const A6_HEIGHT = 419.5;

const styles = StyleSheet.create({
  page: {
    width: A6_WIDTH,
    height: A6_HEIGHT,
    padding: 18,
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  eventHeader: {
    textAlign: "center",
    paddingBottom: 6,
    borderBottom: "1.5pt solid #0077b6",
  },
  eventName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0077b6",
  },
  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  qrImage: {
    width: 110,
    height: 110,
    marginBottom: 6,
  },
  token: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0077b6",
    letterSpacing: 2,
    textAlign: "center",
  },
  divider: {
    borderBottom: "1pt solid #ccc",
    marginVertical: 8,
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  infoRow: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 2,
  },
  label: {
    fontSize: 8,
    color: "#666",
    marginBottom: 1,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#222",
  },
  footer: {
    borderTop: "1pt solid #eee",
    marginTop: 10,
    paddingTop: 6,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#999",
  },
});

export default function BadgePDF({ data, qrCodeDataUrl }) {
  return (
    <Document>
      <Page size={[A6_WIDTH, A6_HEIGHT]} style={styles.page}>
        {/* Event Name */}
        <View style={styles.eventHeader}>
          <Text style={styles.eventName}>{data.eventName || "Event"}</Text>
        </View>

        {/* QR + Token */}
        <View style={styles.qrSection}>
          <Image src={qrCodeDataUrl} style={styles.qrImage} />
          <Text style={styles.token}>{data.token}</Text>
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{data.fullName || "—"}</Text>
          </View>

          {data.email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{data.email}</Text>
            </View>
          )}

          {data.company && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Company</Text>
              <Text style={styles.value}>{data.company}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by EventPass</Text>
        </View>
      </Page>
    </Document>
  );
}
