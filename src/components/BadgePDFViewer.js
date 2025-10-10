import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFViewer,
    Image,
} from "@react-pdf/renderer";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import QRCode from "qrcode";

// A6 dimensions in points (1/72 inch)
// A6 = 105mm x 148mm = 297.6 x 419.5 points
const A6_WIDTH = 297.6;
const A6_HEIGHT = 419.5;

const styles = StyleSheet.create({
    page: {
        width: A6_WIDTH,
        height: A6_HEIGHT,
        padding: 15,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    header: {
        marginBottom: 10,
        borderBottom: "2px solid#0077b6",
        paddingBottom: 6,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0077b6",
        textAlign: "center",
        marginBottom: 5,
    },
    eventName: {
        fontSize: 10,
        color: "#666",
        textAlign: "center",
    },
    mainContent: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    qrSection: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 6,
    },
    qrImage: {
        width: 120,
        height: 120,
    },
    infoSection: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    infoRow: {
        display: "flex",
        flexDirection: "column",
        marginBottom: 4,
    },
    label: {
        fontSize: 8,
        color: "#666",
        textTransform: "uppercase",
        marginBottom: 2,
    },
    value: {
        fontSize: 12,
        color: "#333",
        fontWeight: "bold",
    },
    tokenSection: {
        backgroundColor: "#f5f5f5",
        padding: 6,
        borderRadius: 4,
        textAlign: "center",
        marginTop: 6,
    },
    token: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0077b6",
        letterSpacing: 2,
    },
    footer: {
        marginTop: 8,
        paddingTop: 6,
        borderTop: "1px solid #e0e0e0",
        textAlign: "center",
    },
    footerText: {
        fontSize: 7,
        color: "#999",
    },
});

// PDF Document Component
const BadgePDF = ({ data, qrCodeDataUrl }) => (
    <Document>
        <Page size={[A6_WIDTH, A6_HEIGHT]} style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>EVENT BADGE</Text>
                <Text style={styles.eventName}>{data.eventName}</Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* QR Code */}
                <View style={styles.qrSection}>
                    <Image src={qrCodeDataUrl} style={styles.qrImage} />
                </View>

                {/* Attendee Information */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{data.fullName || "—"}</Text>
                    </View>

                    {data.company && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Company</Text>
                            <Text style={styles.value}>{data.company}</Text>
                        </View>
                    )}

                    {data.title && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Title</Text>
                            <Text style={styles.value}>{data.title}</Text>
                        </View>
                    )}

                    {data.badgeIdentifier && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Badge ID</Text>
                            <Text style={styles.value}>{data.badgeIdentifier}</Text>
                        </View>
                    )}
                </View>

                {/* Token */}
                <View style={styles.tokenSection}>
                    <Text style={styles.token}>{data.token}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    This badge is valid for the duration of the event
                </Text>
            </View>
        </Page>
    </Document>
);

// Main Modal Component
export default function BadgePDFViewer({ open, onClose, badgeData }) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    // Generate QR code when modal opens
    useEffect(() => {
        if (open && badgeData?.token) {
            generateQRCode();
        }
    }, [open, badgeData?.token]);

    const generateQRCode = async () => {
        try {
            setLoading(true);
            // Generate QR code as data URL
            const dataUrl = await QRCode.toDataURL(badgeData.token, {
                width: 300,
                margin: 1,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
            });
            setQrCodeDataUrl(dataUrl);
        } catch (error) {
            console.error("QR Code generation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const iframe = document.querySelector('iframe');
        if (iframe?.contentWindow) {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (err) {
                console.error("Print failed:", err);
                showMessage?.("Print failed. Please try again.", "error");
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: "420px",
                    height: "595px",
                    maxWidth: "95vw",
                    maxHeight: "95vh",
                    m: 0,
                    p: 0,
                    overflow: "hidden",
                    backgroundColor: "#ffffff",
                },
            }}
        >
            {/* Header with Print and Close buttons */}
            <Box
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1000,
                    display: "flex",
                    gap: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: 1,
                    padding: 0.5,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
            >
                <Tooltip title="Print Badge">
                    <IconButton
                        onClick={handlePrint}
                        color="primary"
                        disabled={loading}
                        size="medium"
                    >
                        <PrintIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                    <IconButton onClick={onClose} size="medium">
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <DialogContent sx={{ p: 0, m: 0, overflow: "hidden", height: "100%", width: "100%" }}>
                {loading ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <PDFViewer
                        width="100%"
                        height="100%"
                        showToolbar={false}
                        style={{ border: "none", display: "block" }}
                    >
                        <BadgePDF data={badgeData} qrCodeDataUrl={qrCodeDataUrl} />
                    </PDFViewer>
                )}
            </DialogContent>
        </Dialog>
    );
}