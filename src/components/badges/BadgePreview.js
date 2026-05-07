import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateTexts } from "@/services/translationService";

const BADGE_WIDTH = 380;
const BADGE_HEIGHT = 480;

const BadgePreview = ({
  registration = {},
  event = {},
}) => {
  const { dir, language, t } = useI18nLayout({
    en: {
        noData: "No data available"
    },
    ar: {
        noData: "لا توجد بيانات متاحة"
    }
  });

  const [translatedLabels, setTranslatedLabels] = useState({});

  // Helper to get all relevant fields from registration dynamically
  const getDisplayFields = () => {
    let sourceData = registration;
    
    if (registration.registration) {
        sourceData = registration.registration;
    } else if (registration.data) {
        sourceData = registration.data.data || registration.data;
    }
    
    if (!sourceData || typeof sourceData !== "object") return [];
    
    const fields = [];
    const processedKeys = new Set();
    const ignored = new Set([
        "_id", "id", "token", "eventid", "slug", "createdat", 
        "updatedat", "isdeleted", "customfields", "emailsent", 
        "whatsappsent", "__v", "pushedtounity", "unitystatus"
    ]);

    const addField = (label, value) => {
        if (value === null || value === undefined || typeof value === 'object') return;
        const stringVal = String(value).trim();
        if (!stringVal) return;

        const lowerLabel = label.toLowerCase();
        if (ignored.has(lowerLabel)) return;

        const norm = lowerLabel.replace(/[^a-z0-9]/g, "");
        if (processedKeys.has(norm)) return;
        
        // Clean up common technical keys to readable labels
        let displayLabel = label;
        if (lowerLabel === "fullname") displayLabel = "Full Name";
        else if (lowerLabel === "email") displayLabel = "Email";
        else if (lowerLabel === "company") displayLabel = "Company";
        else if (lowerLabel === "phone") displayLabel = "Phone";
        else if (lowerLabel === "position") displayLabel = "Position";
        else if (lowerLabel === "country") displayLabel = "Country";
        else {
            // Convert camelCase or snake_case to Space Case
            displayLabel = label
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        }

        fields.push({ label: displayLabel, value: stringVal });
        processedKeys.add(norm);
    };

    // Process customFields first (if they exist)
    const cf = sourceData.customFields || {};
    if (cf && typeof cf === 'object') {
        const cfEntries = (cf instanceof Map) ? Array.from(cf.entries()) : Object.entries(cf);
        cfEntries.forEach(([k, v]) => addField(k, v));
    }

    // Process all top-level fields
    Object.entries(sourceData).forEach(([k, v]) => addField(k, v));
    
    return fields;
  };

  const displayFields = useMemo(() => getDisplayFields(), [registration]);

  // Extract metadata for the badge body
  let sourceData = registration;
  if (typeof registration === "string") {
    try { sourceData = JSON.parse(registration); } catch (e) { sourceData = {}; }
  }

  const rawData = sourceData?.registration || sourceData?.data?.data || sourceData?.data || sourceData;
  const category = rawData?.badgeIdentifier || rawData?.registrationType || rawData?.category || "VISITOR";
  const token = String(rawData?.token || rawData?._id || "PREVIEW");
  const logoUrl = event.logoUrl || "";

  useEffect(() => {
    if (language === "en" || (!displayFields.length && !category)) {
        setTranslatedLabels({});
        return;
    }

    const labels = displayFields.map(f => f.label);
    // Include category in translation if it exists
    const toTranslate = Array.from(new Set([...labels, category]));

    translateTexts(toTranslate, language)
        .then(results => {
            const map = {};
            toTranslate.forEach((text, i) => {
                map[text] = results[i] || text;
            });
            setTranslatedLabels(map);
        })
        .catch(err => {
            console.error("Translation failed:", err);
        });
  }, [displayFields, language, category]);

  // QR Visibility: Only hide if showQrAfterRegistration is explicitly false.
  const shouldShowQr = event?.showQrAfterRegistration !== false && !!token;

  return (
    <Box
      dir={dir}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        p: 1,
      }}
    >
      {/* Scaled Container */}
      <Box
        sx={{
          transform: "scale(0.9)",
          transformOrigin: "top center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          mb: -4,
          pt: 4,
        }}
      >
        {/* Badge Clip Mockup */}
        <Box sx={{ position: "relative", mb: -2, zIndex: 2 }}>
          <Box
            sx={{
              width: 130,
              height: 45,
              bgcolor: "#f8fafc",
              borderRadius: "16px 16px 4px 4px",
              border: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box sx={{ width: 44, height: 14, bgcolor: "#cbd5e0", borderRadius: 7 }} />
          </Box>
          <Box
            sx={{
              width: 36,
              height: 54,
              bgcolor: "#64748b",
              position: "absolute",
              top: -28,
              left: "50%",
              transform: "translateX(-50%)",
              borderRadius: "8px 8px 3px 3px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "center",
              pt: 1.5,
              "&::after": { content: '""', width: 14, height: 14, bgcolor: "#475569", borderRadius: "50%" }
            }}
          />
        </Box>

        {/* Main Badge Body */}
        <Paper
          elevation={0}
          sx={{
            width: BADGE_WIDTH,
            minHeight: BADGE_HEIGHT,
            bgcolor: "#fff",
            borderRadius: "32px",
            position: "relative",
            p: 4,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Logo Section */}
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center", height: 70 }}>
            {logoUrl ? (
              <Box component="img" src={logoUrl} sx={{ maxHeight: "100%", maxWidth: "80%", objectFit: "contain" }} />
            ) : (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: "#1e293b",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  lineHeight: 1.2,
                  maxWidth: "90%",
                }}
              >
                {event?.name || "EVENT"}
              </Typography>
            )}
          </Box>

          {/* Dynamic Content Area (The Summary) */}
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
            {displayFields.length > 0 ? (
                displayFields.map((f, i) => (
                    <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: 0.1, borderBottom: "1px dotted #e2e8f0", pb: 0.5 }}>
                        <Typography 
                            sx={{ 
                                fontSize: "11px", 
                                fontWeight: 800, 
                                color: "#64748b", 
                                textTransform: "uppercase", 
                                letterSpacing: "0.5px",
                                textAlign: language === "ar" ? "right" : "left"
                            }}
                        >
                            {translatedLabels[f.label] || f.label}
                        </Typography>
                        <Typography 
                            sx={{ 
                                fontSize: "15px", 
                                fontWeight: 700, 
                                color: "#1e293b", 
                                wordBreak: "break-word", 
                                lineHeight: 1.1,
                                textAlign: language === "ar" ? "right" : "left"
                            }}
                        >
                            {f.value}
                        </Typography>
                    </Box>
                ))
            ) : (
                <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" color="text.secondary" italic>{t.noData}</Typography>
                </Box>
            )}
          </Box>

          {/* Footer Area */}
          <Box 
            sx={{ 
                display: "flex", 
                justifyContent: shouldShowQr ? "space-between" : "center", 
                alignItems: "center", 
                pt: 1, 
                mt: shouldShowQr ? "auto" : 2 
            }}
          >
            {/* Category Tag */}
            <Box 
                sx={{ 
                    border: "2.5px solid #0f172a", 
                    borderRadius: "8px", 
                    px: 3, 
                    py: 0.8, 
                    bgcolor: "#fff",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
                }}
            >
              <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", letterSpacing: "1.5px" }}>
                {(translatedLabels[category] || category).toUpperCase()}
              </Typography>
            </Box>

            {/* QR Code */}
            {shouldShowQr && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Box sx={{ p: 0.5, bgcolor: "#fff", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                    <QRCodeCanvas id="qr-code-preview" value={token} size={80} level="M" fgColor="#000" />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default BadgePreview;

