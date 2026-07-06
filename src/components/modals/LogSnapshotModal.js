"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import { getLogSnapshot } from "@/services/logService";

const translations = {
  en: {
    title: "Record Snapshot",
    context: "Context",
    loading: "Loading record…",
    noSnapshot: "No detailed record available — this item was permanently deleted before snapshot tracking was added.",
    noSnapshotLogin: "No additional details were recorded for this login.",
    liveNotice: "Showing the record's current state — no historical snapshot was recorded for this older entry.",
    loadError: "Unable to load this record's details.",
    empty: "—",
    more: "more",
    created: "Created",
    updated: "Updated",
    records: "records",
    technicalDetails: "Technical details",
    noFields: "No additional details recorded.",
  },
  ar: {
    title: "لقطة السجل",
    context: "السياق",
    loading: "جارٍ تحميل السجل…",
    noSnapshot: "لا تتوفر بيانات تفصيلية لهذا العنصر — تم حذفه نهائيًا قبل إضافة تتبع اللقطات.",
    noSnapshotLogin: "لم يتم تسجيل تفاصيل إضافية لعملية تسجيل الدخول هذه.",
    liveNotice: "يعرض هذا الحالة الحالية للسجل — لم يتم تسجيل لقطة تاريخية لهذا الإدخال القديم.",
    loadError: "تعذر تحميل تفاصيل هذا السجل.",
    empty: "—",
    more: "أكثر",
    created: "تاريخ الإنشاء",
    updated: "آخر تحديث",
    records: "سجلات",
    technicalDetails: "تفاصيل تقنية",
    noFields: "لا توجد تفاصيل إضافية مسجلة.",
  },
};

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;
const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 50;
const MAX_INLINE_ITEMS = 8;

// Bookkeeping fields that aren't meaningful to a reviewer — tucked into a
// collapsed "Technical details" section instead of cluttering the main view.
const NOISE_KEYS = new Set(["_id", "__v", "isDeleted", "deletedAt", "isoCode"]);
// Reference id fields the backend already resolves to a display name
// (see resolveReferenceNames in the backend) — never treat these as raw ids.
const RESOLVED_REFERENCE_KEYS = new Set(["businessId", "business", "createdBy", "updatedBy", "deletedBy"]);

// True for a cross-reference id field (e.g. "ticketTypeId", "eventId") that
// isn't one of the ones already resolved to a name server-side.
function isRawIdKey(key) {
  return /Id$/.test(key) && key !== "_id" && !RESOLVED_REFERENCE_KEYS.has(key);
}

// A raw id field is redundant once its matching "...Name" sibling is present
// (e.g. ticketTypeId next to ticketTypeName) — the id adds nothing to a
// reviewer once the friendly name is already shown.
function hasNameSibling(key, obj) {
  const nameKey = key.slice(0, -2) + "Name";
  const value = obj?.[nameKey];
  return typeof value === "string" && value.trim() !== "";
}
// Internal bookkeeping flags on `meta` — not meant to be shown to a reviewer
// (e.g. hardDelete already drives the chip color/label in the list).
const META_NOISE_KEYS = new Set(["hardDelete", "truncated", "snapshotOmitted"]);
const TIMESTAMP_KEYS = new Set(["createdAt", "updatedAt"]);
// Checked in priority order to guess a human-friendly title for the record.
const TITLE_KEYS = ["fullName", "name", "title", "question", "text", "email", "slug"];

function humanizeKey(key) {
  const withSpaces = String(key)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function guessTitle(obj) {
  if (!obj || typeof obj !== "object") return null;
  for (const key of TITLE_KEYS) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function sectionCardSx(depth) {
  return {
    borderRadius: 2.5,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: depth % 2 === 0 ? "background.paper" : "action.hover",
    p: 1.75,
    mt: 1,
  };
}

export default function LogSnapshotModal({ open, onClose, log }) {
  const { t, dir, language } = useI18nLayout(translations);
  const [snapshot, setSnapshot] = useState(null);
  const [meta, setMeta] = useState(null);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    if (!open || !log) return;

    setError("");
    setShowTechnical(false);

    // Always resolve through the backend (even when the list payload already
    // has a `snapshot`) — it resolves business/user id fields to display
    // names, which the raw list payload doesn't.
    let mounted = true;
    setLoading(true);
    setSnapshot(null);
    setMeta(log.meta || null);
    setSource(null);

    getLogSnapshot(log._id)
      .then((res) => {
        if (!mounted) return;
        if (res?.error) {
          setError(t.loadError);
          return;
        }
        setSnapshot(res?.snapshot ?? null);
        setMeta(res?.meta ?? null);
        setSource(res?.source ?? "unavailable");
      })
      .catch(() => {
        if (mounted) setError(t.loadError);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, log]);

  const formatPrimitive = (value) => {
    if (typeof value === "string") {
      if (OBJECT_ID_RE.test(value)) {
        return <Typography component="span" sx={{ fontFamily: "monospace", fontSize: "0.85em" }}>{value}</Typography>;
      }
      if (ISO_DATE_RE.test(value)) {
        return formatDateTimeWithLocale(value, language === "ar" ? "ar-SA" : "en-GB");
      }
      return value;
    }
    if (typeof value === "boolean") return value ? "True" : "False";
    return String(value);
  };

  const row = (label, valueNode) => (
    <Stack
      key={label}
      direction="row"
      spacing={2}
      sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, py: 0.65 }}
    >
      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ minWidth: 0 }}>
        {humanizeKey(label)}
      </Typography>
      <Box sx={{ textAlign: dir === "rtl" ? "left" : "right", minWidth: 0, flex: 1 }}>
        {typeof valueNode === "string" || typeof valueNode === "number" ? (
          <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>
            {valueNode}
          </Typography>
        ) : (
          valueNode
        )}
      </Box>
    </Stack>
  );

  // Renders one key/value pair, or null to skip it entirely (empty values,
  // noise fields, timestamps handled separately in the header).
  const renderValue = (key, rawValue, depth) => {
    if (NOISE_KEYS.has(key) || TIMESTAMP_KEYS.has(key)) return null;
    if (isEmptyValue(rawValue)) return null;

    // Some fields (e.g. dynamic form-field config) are stored as a raw JSON
    // string rather than a real object/array — parse it so it renders as
    // structured data instead of a dumped blob of text.
    let value = rawValue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      const looksLikeJson =
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"));
      if (looksLikeJson) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === "object") value = parsed;
        } catch {
          // not actually JSON — fall through and render as plain text
        }
      }
    }

    if (depth > MAX_DEPTH) return row(key, "…");

    if (Array.isArray(value)) {
      const visible = value.slice(0, MAX_ARRAY_ITEMS);
      const allPrimitive = value.every((item) => typeof item !== "object" || item === null);

      // Short lists of plain values read better as one line than as boxes.
      if (allPrimitive && value.length <= MAX_INLINE_ITEMS) {
        return row(key, value.map((v) => (v == null ? t.empty : String(v))).join(", "));
      }

      return (
        <Box key={key} sx={{ py: 0.65 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {humanizeKey(key)} ({value.length})
          </Typography>
          {visible.map((item, idx) => (
            <Box key={idx} sx={sectionCardSx(depth + 1)}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                #{idx + 1}
              </Typography>
              {typeof item === "object" && item !== null
                ? Object.entries(item).map(([k, v]) => renderValue(k, v, depth + 2))
                : row(String(idx + 1), formatPrimitive(item))}
            </Box>
          ))}
          {value.length > MAX_ARRAY_ITEMS && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              +{value.length - MAX_ARRAY_ITEMS} {t.more}
            </Typography>
          )}
        </Box>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value).filter(
        ([k, v]) =>
          !NOISE_KEYS.has(k) &&
          !isEmptyValue(v) &&
          !(isRawIdKey(k) && hasNameSibling(k, value))
      );
      if (entries.length === 0) return null;
      return (
        <Box key={key} sx={sectionCardSx(depth)}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            {humanizeKey(key)}
          </Typography>
          {entries.map(([k, v]) => renderValue(k, v, depth + 1))}
        </Box>
      );
    }

    return row(key, formatPrimitive(value));
  };

  // Renders a single record: an identity header (item type + best-guess title
  // + created/updated captions), the meaningful fields, then a collapsed
  // "Technical details" section for the noisy bookkeeping fields.
  const renderRecord = (obj, keyPrefix) => {
    const entries = Object.entries(obj || {}).filter(([k, v]) => !isEmptyValue(v));
    // A raw id with a friendly "...Name" sibling is pure noise once that
    // sibling is shown — drop it everywhere rather than showing both.
    const visibleEntries = entries.filter(([k]) => !(isRawIdKey(k) && hasNameSibling(k, obj)));
    const mainEntries = visibleEntries.filter(([k]) => !NOISE_KEYS.has(k) && !TIMESTAMP_KEYS.has(k) && !isRawIdKey(k));
    // Raw ids without a friendly name (event/ticket/session/etc. cross-reference
    // ids) are tucked away with the other bookkeeping fields, not hidden — still
    // useful for support/debugging, just not part of the primary read.
    const technicalEntries = visibleEntries.filter(([k]) => NOISE_KEYS.has(k) || isRawIdKey(k));
    const title = guessTitle(obj);
    const createdAt = obj?.createdAt;
    const updatedAt = obj?.updatedAt;

    const rendered = mainEntries
      .map(([k, v]) => renderValue(k, v, 1))
      .filter(Boolean);

    return (
      <Box key={keyPrefix}>
        {(title || createdAt) && (
          <Stack spacing={0.25} sx={{ mb: 1 }}>
            {title && (
              <Typography variant="subtitle1" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                {title}
              </Typography>
            )}
            {(createdAt || updatedAt) && (
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
                {createdAt && (
                  <Typography variant="caption" color="text.secondary">
                    {t.created}: {formatDateTimeWithLocale(createdAt, language === "ar" ? "ar-SA" : "en-GB")}
                  </Typography>
                )}
                {updatedAt && (
                  <Typography variant="caption" color="text.secondary">
                    {t.updated}: {formatDateTimeWithLocale(updatedAt, language === "ar" ? "ar-SA" : "en-GB")}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        )}

        {rendered.length > 0 ? rendered : (
          <Typography variant="body2" color="text.secondary">{t.noFields}</Typography>
        )}

        {technicalEntries.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              onClick={() => setShowTechnical((prev) => !prev)}
              endIcon={showTechnical ? <ICONS.expandLess fontSize="small" /> : <ICONS.expandMore fontSize="small" />}
              sx={{ textTransform: "none", color: "text.secondary", px: 0.5 }}
            >
              {t.technicalDetails}
            </Button>
            {showTechnical && (
              <Box sx={sectionCardSx(1)}>
                {technicalEntries.map(([k, v]) => renderValue(k, v, 2) || row(k, formatPrimitive(v)))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm" dir={dir}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <span>{t.title}</span>
          {log?.itemType && <Chip label={log.itemType} size="small" variant="outlined" />}
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <ICONS.close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2.5 }}>
        {loading ? (
          <Stack sx={{ alignItems: "center", py: 4 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {t.loading}
            </Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !snapshot || isEmptyValue(snapshot) ? (
          <Alert severity="info">
            {log?.logType === "login" ? t.noSnapshotLogin : t.noSnapshot}
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {source === "live" && <Alert severity="info">{t.liveNotice}</Alert>}
            {(() => {
              const metaRows = meta
                ? Object.entries(meta)
                    .filter(([k]) => !META_NOISE_KEYS.has(k))
                    .map(([k, v]) => renderValue(k, v, 1))
                    .filter(Boolean)
                : [];
              if (!metaRows.length) return null;
              return (
                <Box sx={sectionCardSx(0)}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                    {t.context}
                  </Typography>
                  {metaRows}
                </Box>
              );
            })()}
            {Array.isArray(snapshot) ? (
              <Stack spacing={1.5}>
                <Chip label={`${snapshot.length} ${t.records}`} size="small" sx={{ alignSelf: "flex-start" }} />
                {snapshot.map((item, idx) => (
                  <Box key={idx} sx={sectionCardSx(0)}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      #{idx + 1}
                    </Typography>
                    {renderRecord(item, idx)}
                  </Box>
                ))}
              </Stack>
            ) : (
              renderRecord(snapshot, "root")
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
