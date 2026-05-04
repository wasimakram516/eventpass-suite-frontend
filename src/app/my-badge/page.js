"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  Box,
  Button,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import AppCard from "@/components/cards/AppCard";
import Background from "@/components/Background";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import InitialsPlaceholder from "@/components/InitialsPlaceholder";
import useI18nLayout from "@/hooks/useI18nLayout";
import {
  getUpcomingCheckInEvents,
  getUpcomingEventRegEvents,
  lookupCheckInRegistration,
  lookupEventRegRegistration,
} from "@/services/badgeService";
import { DEFAULT_ISO_CODE } from "@/utils/countryCodes";
import { formatDate, formatDateWithTime } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";
import { validatePhoneNumber } from "@/utils/phoneValidation";

const translations = {
  en: {
    title: "View Your Badge",
    subtitle: "Find your registration badge for any event.",
    allFilter: "All",
    eventRegFilter: "Event Reg",
    checkInFilter: "Check-In",
    noEvents: "No upcoming events found.",
    step1Title: "Select an Event",
    step2Title: "Enter Your Registration Details",
    step2Subtitle:
      "Enter the same details you used when registering for this event.",
    findBadge: "Find My Badge",
    back: "Back",
    loading: "Searching...",
    badgeTitle: "Your Badge",
    saveBadge: "Save Badge",
    searchAnother: "Search Another",
    event: "Event",
    attendee: "Attendee",
    ticket: "Ticket",
    date: "Date",
    venue: "Venue",
    token: "Token",
    noName: "Attendee",
    noTicket: "Attendee",
    poweredBy: "Powered by",
  },
  ar: {
    title: "عرض بطاقتك",
    subtitle: "ابحث عن بطاقة تسجيلك لأي فعالية.",
    allFilter: "الكل",
    eventRegFilter: "التسجيل",
    checkInFilter: "تسجيل الدخول",
    noEvents: "لا توجد فعاليات قادمة.",
    step1Title: "اختر فعالية",
    step2Title: "أدخل بيانات تسجيلك",
    step2Subtitle: "أدخل نفس البيانات التي استخدمتها عند التسجيل.",
    findBadge: "ابحث عن بطاقتي",
    back: "رجوع",
    loading: "جارٍ البحث...",
    badgeTitle: "بطاقتك",
    saveBadge: "حفظ البطاقة",
    searchAnother: "بحث آخر",
    event: "الفعالية",
    attendee: "المشارك",
    ticket: "النوع",
    date: "التاريخ",
    venue: "المكان",
    token: "الرمز",
    noName: "مشارك",
    noTicket: "مشارك",
    poweredBy: "مشغّل بواسطة",
  },
};

const MODULE_EVENTREG = "eventreg";
const MODULE_CHECKIN = "checkin";

const BADGE_COLORS = {
  primary: "#128199",
  primaryDark: "#0a5e71",
  primaryDeep: "#083b4f",
  accent: "#ffcc00",
  ink: "#073642",
  inkSoft: "#58707a",
  line: "#dbe8ec",
  surface: "#f7fbfc",
  white: "#ffffff",
};

function pickFullName(registration) {
  if (registration?.fullName) return registration.fullName;

  if (registration?.customFields) {
    const fields =
      registration.customFields instanceof Map
        ? Object.fromEntries(registration.customFields)
        : registration.customFields;

    for (const [key, value] of Object.entries(fields)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
      if (["fullname", "name"].includes(normalizedKey) && value) {
        return String(value);
      }
    }

    const firstName = Object.entries(fields).find(([key]) =>
      key.toLowerCase().includes("first")
    );
    const lastName = Object.entries(fields).find(([key]) =>
      key.toLowerCase().includes("last")
    );

    if (firstName || lastName) {
      return [firstName?.[1], lastName?.[1]].filter(Boolean).join(" ");
    }
  }

  return null;
}

function pickRegistrationType(registration) {
  if (!registration?.customFields) return null;

  const fields =
    registration.customFields instanceof Map
      ? Object.fromEntries(registration.customFields)
      : registration.customFields;

  for (const [key, value] of Object.entries(fields)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (
      ["registrationtype", "tickettype", "passtype", "attendeetype"].includes(
        normalizedKey
      ) &&
      value
    ) {
      return String(value);
    }
  }

  return null;
}

function getEventDateLabel(event) {
  if (!event?.startDate) return "";

  return `${formatDate(event.startDate)}${
    event.endDate && event.endDate !== event.startDate
      ? ` - ${formatDate(event.endDate)}`
      : ""
  }`;
}

function getModuleLabel(module, t) {
  if (module === MODULE_CHECKIN) return t.checkInFilter;
  if (module === MODULE_EVENTREG) return t.eventRegFilter;
  return t.badgeTitle;
}

function getBadgeDetailRows(event, registration, t) {
  const ticketType = pickRegistrationType(registration) || t.noTicket;
  const dateLabel = getEventDateLabel(event);

  return [
    { label: t.ticket, value: ticketType },
    ...(dateLabel ? [{ label: t.date, value: dateLabel }] : []),
    ...(event?.venue ? [{ label: t.venue, value: event.venue }] : []),
  ];
}

export default function MyBadgePage() {
  const { t, dir } = useI18nLayout(translations);
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState({ eventreg: [], checkin: [] });
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [countryIsoCodes, setCountryIsoCodes] = useState({});
  const [errors, setErrors] = useState({});
  const [lookupLoading, setLookupLoading] = useState(false);
  const [registration, setRegistration] = useState(null);

  const qrRef = useRef(null);
  const badgePreviewRef = useRef(null);
  const selectedEventDateLabel = getEventDateLabel(selectedEvent);

  useEffect(() => {
    Promise.all([getUpcomingEventRegEvents(), getUpcomingCheckInEvents()])
      .then(([eventRegEvents, checkInEvents]) => {
        setEvents({
          eventreg: Array.isArray(eventRegEvents) ? eventRegEvents : [],
          checkin: Array.isArray(checkInEvents) ? checkInEvents : [],
        });
      })
      .catch(() => {
        setEvents({ eventreg: [], checkin: [] });
      })
      .finally(() => setEventsLoading(false));
  }, []);

  const filteredEvents = [
    ...events.eventreg.map((event) => ({ ...event, module: MODULE_EVENTREG })),
    ...events.checkin.map((event) => ({ ...event, module: MODULE_CHECKIN })),
  ].sort((left, right) => new Date(left.startDate) - new Date(right.startDate));

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setFormValues({});
    setCountryIsoCodes({});
    setErrors({});
    setRegistration(null);
    setStep(1);
  };

  const handleFieldChange = (name, value) => {
    setFormValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleCountryCodeChange = (name, isoCode) => {
    setCountryIsoCodes((previous) => ({ ...previous, [name]: isoCode }));
  };

  const validate = () => {
    const formFields = selectedEvent?.formFields || [];
    const hasCustomFields = formFields.length > 0;
    const nextErrors = {};

    if (hasCustomFields) {
      for (const field of formFields) {
        if (!field.visible) continue;

        const value = formValues[field.inputName] || "";
        if (field.required && !String(value).trim()) {
          nextErrors[field.inputName] = "Required";
          continue;
        }

        if (field.inputType === "phone" && value) {
          const isoCode =
            countryIsoCodes[field.inputName] || DEFAULT_ISO_CODE;
          const validationError = validatePhoneNumber(value, isoCode);
          if (validationError) nextErrors[field.inputName] = validationError;
        }
      }
    } else {
      if (!formValues.fullName?.trim()) nextErrors.fullName = "Required";
      if (!formValues.email?.trim()) nextErrors.email = "Required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLookup = async () => {
    if (!validate()) return;

    const formFields = selectedEvent?.formFields || [];
    const hasCustomFields = formFields.length > 0;

    let fields = {};
    let isoCode = DEFAULT_ISO_CODE;

    if (hasCustomFields) {
      for (const field of formFields) {
        if (!field.visible) continue;

        const value = formValues[field.inputName];
        if (!value) continue;

        fields[field.inputName] = value;
        if (field.inputType === "phone") {
          isoCode = countryIsoCodes[field.inputName] || DEFAULT_ISO_CODE;
        }
      }
    } else {
      fields = {
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        company: formValues.company,
      };
      isoCode = countryIsoCodes.phone || DEFAULT_ISO_CODE;
    }

    const lookupHandler =
      selectedEvent?.module === MODULE_CHECKIN
        ? lookupCheckInRegistration
        : lookupEventRegRegistration;

    setLookupLoading(true);

    try {
      const result = await lookupHandler(selectedEvent.slug, fields, isoCode);

      if (result && !result.error) {
        setRegistration(result);
        setStep(2);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveBadge = async () => {
    const badgeElement = badgePreviewRef.current;
    if (!badgeElement) return;

    const canvas = await html2canvas(badgeElement, {
      backgroundColor: null,
      useCORS: true,
      scale: Math.max(window.devicePixelRatio || 1, 2),
      logging: false,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `badge-${registration?.token || "download"}.png`;
    link.click();
  };

  const handleReset = () => {
    setStep(0);
    setSelectedEvent(null);
    setRegistration(null);
    setFormValues({});
    setCountryIsoCodes({});
    setErrors({});
  };

  return (
    <>
      <Background />
      <Box
        dir={dir}
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          pb: 8,
        }}
      >
        <Container maxWidth={false} sx={{ pt: 5 }}>
          <Stack spacing={1} alignItems="center" textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight={800}>
              {t.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t.subtitle}
            </Typography>
          </Stack>

          {step === 0 && (
            <>
              {eventsLoading ? (
                <Box sx={{ textAlign: "center", mt: 8 }}>
                  <CircularProgress />
                </Box>
              ) : filteredEvents.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" mt={6}>
                  {t.noEvents}
                </Typography>
              ) : (
                <Grid container spacing={3} justifyContent="center" alignItems="stretch">
                  {filteredEvents.map((event) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={event._id || event.slug}
                      sx={{ display: "flex", justifyContent: "center" }}
                    >
                      <BadgeEventCard
                        event={event}
                        t={t}
                        onSelect={() => handleSelectEvent(event)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {step === 1 && selectedEvent && (
            <Box maxWidth={520} mx="auto">
              <Button
                startIcon={<ICONS.back />}
                onClick={() => setStep(0)}
                sx={{ mb: 2 }}
              >
                {t.back}
              </Button>

              <AppCard
                sx={{
                  borderRadius: 5,
                  boxShadow: `0 20px 46px ${alpha(BADGE_COLORS.primaryDeep, 0.12)}`,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    px: { xs: 2.25, sm: 3 },
                    py: { xs: 2.25, sm: 2.75 },
                    overflow: "hidden",
                    background: `linear-gradient(135deg, ${BADGE_COLORS.primaryDeep} 0%, ${BADGE_COLORS.primary} 58%, #40c0d5 100%)`,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      width: 180,
                      height: 180,
                      borderRadius: "50%",
                      top: -88,
                      right: -54,
                      bgcolor: alpha(BADGE_COLORS.white, 0.08),
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      bottom: -54,
                      left: -22,
                      bgcolor: alpha(BADGE_COLORS.white, 0.06),
                    }}
                  />

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ position: "relative", zIndex: 1 }}
                  >
                    <Box
                      sx={{
                        width: { xs: "100%", sm: 120 },
                        height: { xs: 148, sm: 120 },
                        borderRadius: 4,
                        overflow: "hidden",
                        flexShrink: 0,
                        border: `1px solid ${alpha(BADGE_COLORS.white, 0.16)}`,
                        bgcolor: alpha(BADGE_COLORS.white, 0.14),
                        boxShadow: `0 16px 30px ${alpha(BADGE_COLORS.primaryDeep, 0.18)}`,
                      }}
                    >
                      {selectedEvent.logoUrl ? (
                        <Box
                          component="img"
                          src={selectedEvent.logoUrl}
                          alt={selectedEvent.name}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: BADGE_COLORS.white,
                            fontSize: "2rem",
                            fontWeight: 800,
                            letterSpacing: 1,
                            background: alpha(BADGE_COLORS.white, 0.08),
                          }}
                        >
                          {selectedEvent.name?.slice(0, 2)?.toUpperCase() || "EP"}
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="overline"
                        sx={{
                          display: "block",
                          color: alpha(BADGE_COLORS.white, 0.75),
                          letterSpacing: 1.4,
                          mb: 0.75,
                        }}
                      >
                        {t.step2Title}
                      </Typography>

                      <Chip
                        size="small"
                        label={getModuleLabel(selectedEvent.module, t)}
                        sx={{
                          mb: 1.25,
                          bgcolor: alpha(BADGE_COLORS.white, 0.18),
                          color: BADGE_COLORS.white,
                          borderRadius: 999,
                          fontWeight: 700,
                          backdropFilter: "blur(10px)",
                        }}
                      />

                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{
                          color: BADGE_COLORS.white,
                          lineHeight: 1.15,
                          mb: 1.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {selectedEvent.name}
                      </Typography>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {selectedEvent.venue && (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.8,
                              px: 1.15,
                              py: 0.75,
                              borderRadius: 999,
                              bgcolor: alpha(BADGE_COLORS.white, 0.12),
                              color: BADGE_COLORS.white,
                              fontSize: "0.875rem",
                            }}
                          >
                            <ICONS.location sx={{ fontSize: 18 }} />
                            <Box component="span">{selectedEvent.venue}</Box>
                          </Box>
                        )}

                        {selectedEventDateLabel && (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.8,
                              px: 1.15,
                              py: 0.75,
                              borderRadius: 999,
                              bgcolor: alpha(BADGE_COLORS.white, 0.12),
                              color: BADGE_COLORS.white,
                              fontSize: "0.875rem",
                            }}
                          >
                            <ICONS.event sx={{ fontSize: 18 }} />
                            <Box component="span">{selectedEventDateLabel}</Box>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ px: { xs: 2.25, sm: 3 }, py: { xs: 2.25, sm: 3 } }}>
                  <Box
                    sx={{
                      mb: 2.5,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 3,
                      bgcolor: alpha(BADGE_COLORS.primary, 0.05),
                      border: `1px solid ${alpha(BADGE_COLORS.primary, 0.12)}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t.step2Subtitle}
                    </Typography>
                  </Box>

                  <Stack spacing={2.5}>
                    {selectedEvent.formFields?.length > 0 ? (
                      selectedEvent.formFields
                        .filter((field) => field.visible !== false)
                        .map((field) => (
                          <FormField
                            key={field.inputName}
                            field={field}
                            value={formValues[field.inputName] || ""}
                            isoCode={
                              countryIsoCodes[field.inputName] || DEFAULT_ISO_CODE
                            }
                            error={errors[field.inputName]}
                            onChange={(value) =>
                              handleFieldChange(field.inputName, value)
                            }
                            onIsoChange={(isoCode) =>
                              handleCountryCodeChange(field.inputName, isoCode)
                            }
                          />
                        ))
                    ) : (
                      <>
                        <TextField
                          label="Full Name"
                          fullWidth
                          required
                          value={formValues.fullName || ""}
                          onChange={(event) =>
                            handleFieldChange("fullName", event.target.value)
                          }
                          error={!!errors.fullName}
                          helperText={errors.fullName}
                        />
                        <TextField
                          label="Email"
                          type="email"
                          fullWidth
                          required
                          value={formValues.email || ""}
                          onChange={(event) =>
                            handleFieldChange("email", event.target.value)
                          }
                          error={!!errors.email}
                          helperText={errors.email}
                        />
                        <PhoneClassicField
                          value={formValues.phone || ""}
                          isoCode={countryIsoCodes.phone || DEFAULT_ISO_CODE}
                          onChange={(value) => handleFieldChange("phone", value)}
                          onIsoChange={(isoCode) =>
                            handleCountryCodeChange("phone", isoCode)
                          }
                        />
                        <TextField
                          label="Company"
                          fullWidth
                          value={formValues.company || ""}
                          onChange={(event) =>
                            handleFieldChange("company", event.target.value)
                          }
                        />
                      </>
                    )}
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{
                      mt: 3,
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                    onClick={handleLookup}
                    disabled={lookupLoading}
                    startIcon={
                      lookupLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <ICONS.badge />
                      )
                    }
                  >
                    {lookupLoading ? t.loading : t.findBadge}
                  </Button>
                </Box>
              </AppCard>
            </Box>
          )}

          {step === 2 && registration && (
            <Box maxWidth={480} mx="auto">
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" fontWeight={700}>
                  {t.badgeTitle}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ICONS.back />}
                  onClick={handleReset}
                >
                  {t.searchAnother}
                </Button>
              </Stack>

              <Box ref={badgePreviewRef} sx={{ width: "fit-content", mx: "auto" }}>
                <BadgeCard
                  event={registration.eventId || selectedEvent}
                  module={selectedEvent?.module || registration?.eventId?.module}
                  registration={registration}
                  qrRef={qrRef}
                  t={t}
                />
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<ICONS.download />}
                onClick={handleSaveBadge}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                {t.saveBadge}
              </Button>
            </Box>
          )}

        </Container>
      </Box>
    </>
  );
}

function BadgeEventCard({ event, t, onSelect }) {
  const timezone = event.timezone || null;
  const dateLabel = event.startDate
    ? (() => {
        if (event.endDate && event.endDate !== event.startDate) {
          const start = event.startTime
            ? formatDateWithTime(
                event.startDate,
                event.startTime,
                "en-GB",
                timezone
              )
            : formatDate(event.startDate);
          const end = event.endTime
            ? formatDateWithTime(
                event.endDate,
                event.endTime,
                "en-GB",
                timezone
              )
            : formatDate(event.endDate);
          return `${start} - ${end}`;
        }

        return event.startTime
          ? formatDateWithTime(
              event.startDate,
              event.startTime,
              "en-GB",
              timezone
            )
          : formatDate(event.startDate);
      })()
    : null;

  return (
    <AppCard
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: 360 },
        height: "100%",
        mx: "auto",
      }}
    >
      <Box sx={{ position: "relative", height: 200 }}>
        {event.logoUrl ? (
          <Box
            component="img"
            src={event.logoUrl}
            alt={event.name}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <InitialsPlaceholder name={event.name} size={200} variant="rounded" />
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0) 90%)",
            p: 2,
            color: "white",
          }}
        >
          <Chip
            size="small"
            label={
              event.module === MODULE_EVENTREG ? t.eventRegFilter : t.checkInFilter
            }
            sx={{
              mb: 0.75,
              bgcolor:
                event.module === MODULE_EVENTREG ? "primary.main" : "secondary.main",
              color: "white",
              fontWeight: 700,
              fontSize: "0.7rem",
              height: 22,
              borderRadius: 1,
              "& .MuiChip-label": { px: 1 },
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.name}
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ px: 2, py: 1.5, flexGrow: 1 }}>
        {event.venue && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.6 }}
          >
            <ICONS.location fontSize="small" sx={{ opacity: 0.7 }} />
            {event.venue}
          </Typography>
        )}

        {dateLabel && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
          >
            <ICONS.event fontSize="small" sx={{ opacity: 0.7 }} />
            {dateLabel}
          </Typography>
        )}
      </CardContent>

      <CardActions
        sx={{
          justifyContent: "center",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          p: 1,
          bgcolor: "rgba(0,0,0,0.02)",
        }}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<ICONS.badge />}
          onClick={onSelect}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {t.findBadge}
        </Button>
      </CardActions>
    </AppCard>
  );
}

function FormField({ field, value, isoCode, error, onChange, onIsoChange }) {
  const { inputName, inputType, placeholder, required, values = [] } = field;

  if (inputType === "radio") {
    return (
      <Box>
        <Typography variant="body2" fontWeight={600} mb={0.5}>
          {inputName}
          {required && " *"}
        </Typography>
        <RadioGroup
          value={value}
          onChange={(event) => onChange(event.target.value)}
          row
        >
          {values.map((itemValue) => (
            <FormControlLabel
              key={itemValue}
              value={itemValue}
              control={<Radio size="small" />}
              label={itemValue}
            />
          ))}
        </RadioGroup>
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  if (inputType === "list") {
    return (
      <TextField
        select
        label={inputName}
        required={required}
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={!!error}
        helperText={error}
      >
        {values.map((itemValue) => (
          <MenuItem key={itemValue} value={itemValue}>
            {itemValue}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (inputType === "phone") {
    return (
      <TextField
        label={inputName}
        required={required}
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={!!error}
        helperText={error}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CountryCodeSelector value={isoCode} onChange={onIsoChange} />
            </InputAdornment>
          ),
        }}
      />
    );
  }

  return (
    <TextField
      label={inputName}
      type={
        inputType === "number"
          ? "number"
          : inputType === "email"
            ? "email"
            : "text"
      }
      required={required}
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={!!error}
      helperText={error}
      placeholder={placeholder}
    />
  );
}

function PhoneClassicField({ value, isoCode, onChange, onIsoChange }) {
  return (
    <TextField
      label="Phone"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CountryCodeSelector value={isoCode} onChange={onIsoChange} />
          </InputAdornment>
        ),
      }}
    />
  );
}

function BadgeCard({ event, module, registration, qrRef, t }) {
  const attendeeName = pickFullName(registration) || t.noName;
  const detailRows = getBadgeDetailRows(event, registration, t);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        maxWidth: 430,
        mx: "auto",
        overflow: "hidden",
        borderRadius: "30px",
        background: `linear-gradient(180deg, ${BADGE_COLORS.white} 0%, ${BADGE_COLORS.surface} 100%)`,
        border: `1px solid ${alpha(BADGE_COLORS.primary, 0.14)}`,
        boxShadow: `0 28px 70px ${alpha(BADGE_COLORS.primaryDeep, 0.24)}`,
      }}
    >
      <Box
        sx={{
          position: "relative",
          px: { xs: 2.5, sm: 3 },
          pt: 3,
          pb: 4.25,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${BADGE_COLORS.primaryDeep} 0%, ${BADGE_COLORS.primary} 56%, #40c0d5 100%)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            top: -72,
            right: -48,
            bgcolor: alpha(BADGE_COLORS.white, 0.08),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            bottom: -60,
            left: -28,
            bgcolor: alpha(BADGE_COLORS.white, 0.05),
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Chip
              label={getModuleLabel(module, t)}
              sx={{
                mb: 1.5,
                bgcolor:
                  module === MODULE_CHECKIN
                    ? alpha(BADGE_COLORS.accent, 0.92)
                    : alpha(BADGE_COLORS.white, 0.16),
                color:
                  module === MODULE_CHECKIN
                    ? BADGE_COLORS.ink
                    : BADGE_COLORS.white,
                borderRadius: 999,
                fontWeight: 700,
                backdropFilter: "blur(10px)",
              }}
            />

            <Typography
              variant="body2"
              sx={{ color: alpha(BADGE_COLORS.white, 0.78), mb: 0.75 }}
            >
              {t.badgeTitle}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: BADGE_COLORS.white,
                lineHeight: 1.15,
                wordBreak: "break-word",
              }}
            >
              {event?.name}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
        <Typography
          variant="caption"
          sx={{
            color: BADGE_COLORS.inkSoft,
            textTransform: "uppercase",
            letterSpacing: 1.4,
          }}
        >
          {t.attendee}
        </Typography>

        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            color: BADGE_COLORS.ink,
            lineHeight: 1.05,
            mt: 0.5,
            mb: 2.25,
            wordBreak: "break-word",
          }}
        >
          {attendeeName}
        </Typography>

        <Box
          sx={{
            mb: 2.25,
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: alpha(BADGE_COLORS.white, 0.88),
            border: `1px solid ${alpha(BADGE_COLORS.primary, 0.12)}`,
          }}
        >
          {detailRows.map((row, index) => (
            <Box
              key={row.label}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom:
                  index < detailRows.length - 1
                    ? `1px solid ${alpha(BADGE_COLORS.primary, 0.1)}`
                    : "none",
                bgcolor:
                  index % 2 === 0
                    ? alpha(BADGE_COLORS.primary, 0.03)
                    : "transparent",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: BADGE_COLORS.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                }}
              >
                {row.label}
              </Typography>
              <Typography
                variant="body1"
                fontWeight={700}
                sx={{
                  color: BADGE_COLORS.ink,
                  lineHeight: 1.45,
                  mt: 0.45,
                  wordBreak: "break-word",
                }}
              >
                {row.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: "26px",
            background: alpha(BADGE_COLORS.white, 0.92),
            border: `1px solid ${alpha(BADGE_COLORS.primary, 0.12)}`,
            boxShadow: `0 14px 30px ${alpha(BADGE_COLORS.primaryDeep, 0.08)}`,
            mb: 1.5,
          }}
        >
          <Box
            ref={qrRef}
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: registration?.token ? 1.5 : 0,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: BADGE_COLORS.white,
                border: "1px solid #e4eef1",
              }}
            >
              <QRCodeCanvas
                value={registration?.token || registration?._id}
                size={170}
                bgColor={BADGE_COLORS.white}
                fgColor={BADGE_COLORS.primaryDark}
                includeMargin={false}
              />
            </Box>
          </Box>

          {registration?.token && (
            <Box
              sx={{
                px: 1.75,
                py: 0.85,
                borderRadius: 999,
                bgcolor: alpha(BADGE_COLORS.primary, 0.08),
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  color: BADGE_COLORS.primaryDark,
                  letterSpacing: 0.8,
                  wordBreak: "break-all",
                }}
              >
                {t.token}: {registration.token}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Typography
          variant="caption"
          display="block"
          textAlign="center"
          sx={{ color: BADGE_COLORS.inkSoft }}
        >
          {t.poweredBy} eventPass
        </Typography>
      </Box>
    </Paper>
  );
}
