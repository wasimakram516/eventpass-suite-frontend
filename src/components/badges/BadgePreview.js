import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateTexts } from "@/services/translationService";
import ICONS from "@/utils/iconUtil";
import { COUNTRY_CODES, getFlagImageUrl, formatPhoneNumberForDisplay } from "@/utils/countryCodes";

const BADGE_WIDTH = 380;
const BADGE_HEIGHT = 480;

const BadgePreview = ({
  registration = {},
  event = {},
  preview = false,
  badgeFields = null,
  phoneIsoCodes = {},
  filePreviews = {},
}) => {
  const { dir, language, t } = useI18nLayout({
    en: {
      noData: "No data available",
      preview: "PREVIEW"
    },
    ar: {
      noData: "لا توجد بيانات متاحة",
      preview: "معاينة"
    }
  });

  const [translatedLabels, setTranslatedLabels] = useState({});
  const [translatedCountries, setTranslatedCountries] = useState({});

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

    // Pre-normalize badgeFields keys once (handles "Full Name" matching "fullName", etc.)
    const allowedNorms = Array.isArray(badgeFields)
      ? new Set(badgeFields.map(f => f.toLowerCase().replace(/[^a-z0-9]/g, "")))
      : null;

    const addField = (label, value) => {
      if (value === null || value === undefined || typeof value === 'object') return;
      const stringVal = String(value).trim();
      if (!stringVal) return;

      const lowerLabel = label.toLowerCase();
      if (ignored.has(lowerLabel)) return;

      const norm = lowerLabel.replace(/[^a-z0-9]/g, "");
      if (allowedNorms && !allowedNorms.has(norm)) return;

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

      fields.push({ label: displayLabel, value: stringVal, key: label });
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

  const displayFields = useMemo(() => getDisplayFields(), [registration, badgeFields]);

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
      setTranslatedCountries({});
      return;
    }

    const labels = displayFields.map(f => f.label);
    // Collect country names from display fields where label is Country
    const countryNames = displayFields
      .filter(f => f.label.toLowerCase() === "country")
      .map(f => {
        const country = COUNTRY_CODES.find(c => c.isoCode === f.value.toLowerCase());
        return country ? country.country : null;
      })
      .filter(Boolean);

    const toTranslate = Array.from(new Set([...labels, ...countryNames, category]));

    translateTexts(toTranslate, language)
      .then(results => {
        const labelMap = {};
        const countryMap = {};
        toTranslate.forEach((text, i) => {
          const translated = results[i] || text;
          labelMap[text] = translated;
          if (countryNames.includes(text)) {
            countryMap[text] = translated;
          }
        });
        setTranslatedLabels(labelMap);
        setTranslatedCountries(countryMap);
      })
      .catch(err => {
        console.error("Translation failed:", err);
      });
  }, [displayFields, language, category]);

  // QR Visibility: Always show if preview=true (UI mockup), otherwise check toggle.
  const shouldShowQr = preview || (event?.showQrAfterRegistration !== false && !!token);

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
                        textAlign: language === "ar" ? "right" : "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      {(() => {
                        const lowerLabel = f.label.toLowerCase();
                        if (lowerLabel === "country") {
                          const country = COUNTRY_CODES.find(c => c.isoCode === f.value.toLowerCase());
                          if (country) {
                            const countryName = translatedCountries[country.country] || country.country;
                            return (
                              <>
                                <Box component="img" src={getFlagImageUrl(country.isoCode)} alt={country.country} sx={{ width: 20, height: 14, objectFit: "cover", borderRadius: 0.5, flexShrink: 0 }} />
                                <span>{countryName}</span>
                              </>
                            );
                          }
                        }
                        if (lowerLabel === "phone") {
                          const iso = phoneIsoCodes?.[f.key] || Object.keys(phoneIsoCodes || {}).find(k => phoneIsoCodes[k] && f.value.startsWith(k.replace(/[^0-9]/g, '')));
                          if (iso) {
                            return formatPhoneNumberForDisplay(f.value, iso);
                          }
                          if (f.value.startsWith("+")) {
                            const cc = COUNTRY_CODES.find(c => f.value.startsWith(c.code));
                            if (cc) return formatPhoneNumberForDisplay(f.value, cc.isoCode);
                          }
                        }
                        // File type: show thumbnail from filePreviews or uploaded URL
                        if (filePreviews[f.key]) {
                          const fp = filePreviews[f.key];
                          const previewUrl = fp.preview || fp;
                          const fileType = fp.fileType || "";
                          const isImage = fileType.startsWith("image/") || previewUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i);
                          const isVideo = fileType.startsWith("video/") || previewUrl.match(/\.(mp4|webm|mov)(\?|$)/i);
                          if (isImage) {
                            return <Box component="img" src={previewUrl} alt="" sx={{ width: 28, height: 28, objectFit: "contain", borderRadius: 1, bgcolor: "grey.100" }} />;
                          }
                          if (isVideo) {
                            return <ICONS.play sx={{ fontSize: 20, color: "text.secondary" }} />;
                          }
                          return <ICONS.files sx={{ fontSize: 18, color: "text.secondary" }} />;
                        }
                        return f.value;
                      })()}
                    </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontStyle: "italic"
                  }}>{t.noData}</Typography>
              </Box>
            )}
          </Box>

          {/* Footer Area */}
          <Box
            sx={{
              display: "flex",
              justifyContent: shouldShowQr ? "space-between" : "flex-start",
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
                <Box sx={{ p: 0.5, bgcolor: "#fff", border: "1px solid #f1f5f9", borderRadius: "8px", position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <QRCodeCanvas id="qr-code-preview" value={token} size={80} level="M" fgColor="#cbd5e0" />
                  <Box
                    sx={{
                      position: "absolute",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                      transform: "rotate(-45deg)",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#cbd5e0",
                        fontWeight: 900,
                        fontSize: "15px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                      }}
                    >
                      {t.preview}
                    </Typography>
                  </Box>
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

