"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AppCard from "@/components/cards/AppCard";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import LoadingState from "@/components/LoadingState";
import NoDataAvailable from "@/components/NoDataAvailable";
import RecordMetadata from "@/components/RecordMetadata";
import TemplateBody from "@/components/whatsapp/TemplateBody";
import WhatsAppMessageEditor from "@/components/whatsapp/WhatsAppMessageEditor";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import useWhatsAppCatalog from "@/hooks/useWhatsAppCatalog";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import {
  WHATSAPP_APPROVED,
  WHATSAPP_EVENT_TYPES,
  createEmptyMessage,
  matchesSearch,
  templateLabel,
  toEditableMessages,
  WHATSAPP_MESSAGE_LIMITS,
  toMessagesPayload,
  validateWhatsAppMessage,
} from "@/utils/whatsappMessages";
import {
  createWhatsAppDefaultMessage,
  deleteWhatsAppDefaultMessage,
  deleteWhatsAppTemplate,
  getTwilioWhatsAppTemplates,
  getWhatsAppDefaultMessages,
  getWhatsAppTemplates,
  importWhatsAppTemplate,
  renameWhatsAppTemplate,
  syncWhatsAppTemplate,
  updateWhatsAppDefaultMessage,
} from "@/services/notifications/whatsAppTemplateService";

const translations = {
  en: {
    title: "WhatsApp Templates",
    subtitle:
      "Import approved Twilio templates into the library and choose the default messages events use when they have none of their own.",
    adminsOnly: "Only admins can view WhatsApp templates.",
    readOnly: "View only. A superadmin manages templates and default messages.",
    library: "Template library",
    searchTemplates: "Search templates",
    searchDefaults: "Search default messages",
    importFromTwilio: "Import from Twilio",
    emptyLibrary: "No templates imported yet. Use Import from Twilio to add approved templates.",
    variables: "variables",
    media: "Media",
    refresh: "Refresh from Twilio",
    setAsDefault: "Set as default",
    rename: "Rename",
    renameTitle: "Rename template",
    nameInEventPass: "Name in EventPass",
    nameHelp: "Shown across EventPass. Leave empty to use the Twilio name.",
    twilioName: "Twilio name",
    defaultFor: "Default for",
    remove: "Remove from library",
    removeTitle: "Remove template?",
    removeMessage: "It will no longer be offered for events. Templates still used by an event or default cannot be removed.",
    twilioTitle: "Templates on the Twilio account",
    loadingTwilio: "Loading templates from Twilio...",
    searchTwilio: "Search Twilio templates",
    imported: "Imported",
    import: "Import",
    rejected: "Rejected",
    rejectedHelp: "WhatsApp rejected this template, so it cannot be imported.",
    close: "Close",
    defaults: "Default messages",
    defaultsHint: "Used by events that have custom WhatsApp messages switched off, per event type.",
    addDefault: "Add default message",
    emptyDefaults: "No default messages yet.",
    editDefault: "Edit default message",
    newDefault: "New default message",
    appliesTo: "Used by",
    chooseEventType: "Choose at least one event type.",
    save: "Save",
    cancel: "Cancel",
    removeDefaultTitle: "Remove default message?",
    removeDefaultMessage: "Events of these types will no longer be able to send it.",
    missingTemplate: "Template removed",
    eventTypes: { closed: "CheckIn", public: "EventReg", checkout: "Checkout" },
  },
  ar: {
    title: "قوالب واتساب",
    subtitle:
      "استورد قوالب Twilio المعتمدة إلى المكتبة واختر الرسائل الافتراضية التي تستخدمها الفعاليات التي ليس لها رسائل خاصة.",
    adminsOnly: "يمكن للمشرفين فقط عرض قوالب واتساب.",
    readOnly: "للعرض فقط. يدير المشرف العام القوالب والرسائل الافتراضية.",
    library: "مكتبة القوالب",
    searchTemplates: "البحث في القوالب",
    searchDefaults: "البحث في الرسائل الافتراضية",
    importFromTwilio: "استيراد من Twilio",
    emptyLibrary: "لم يتم استيراد أي قوالب بعد. استخدم الاستيراد من Twilio لإضافة القوالب المعتمدة.",
    variables: "متغيرات",
    media: "وسائط",
    refresh: "تحديث من Twilio",
    setAsDefault: "تعيين كافتراضي",
    rename: "إعادة تسمية",
    renameTitle: "إعادة تسمية القالب",
    nameInEventPass: "الاسم في EventPass",
    nameHelp: "يظهر في جميع أنحاء EventPass. اتركه فارغا لاستخدام اسم Twilio.",
    twilioName: "اسم Twilio",
    defaultFor: "افتراضي لـ",
    remove: "إزالة من المكتبة",
    removeTitle: "إزالة القالب؟",
    removeMessage: "لن يتم عرضه للفعاليات بعد الآن. لا يمكن إزالة القوالب المستخدمة في فعالية أو رسالة افتراضية.",
    twilioTitle: "القوالب في حساب Twilio",
    loadingTwilio: "جار تحميل القوالب من Twilio...",
    searchTwilio: "البحث في قوالب Twilio",
    imported: "تم الاستيراد",
    import: "استيراد",
    rejected: "مرفوض",
    rejectedHelp: "رفض واتساب هذا القالب، لذلك لا يمكن استيراده.",
    close: "إغلاق",
    defaults: "الرسائل الافتراضية",
    defaultsHint: "تستخدمها الفعاليات التي أوقفت رسائل واتساب المخصصة، حسب نوع الفعالية.",
    addDefault: "إضافة رسالة افتراضية",
    emptyDefaults: "لا توجد رسائل افتراضية بعد.",
    editDefault: "تعديل الرسالة الافتراضية",
    newDefault: "رسالة افتراضية جديدة",
    appliesTo: "تستخدم في",
    chooseEventType: "اختر نوع فعالية واحدا على الأقل.",
    save: "حفظ",
    cancel: "إلغاء",
    removeDefaultTitle: "إزالة الرسالة الافتراضية؟",
    removeDefaultMessage: "لن تتمكن فعاليات هذه الأنواع من إرسالها بعد الآن.",
    missingTemplate: "تمت إزالة القالب",
    eventTypes: { closed: "CheckIn", public: "EventReg", checkout: "Checkout" },
  },
};

const TAB_LIBRARY = 0;
const TAB_DEFAULTS = 1;

// Card grid shared by the library and the defaults.
const CARD_GRID_SX = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fill, minmax(420px, 1fr))" },
  alignItems: "start",
};

/**
 * Chip showing a Twilio approval status.
 *
 * @param {{status: string}} props
 * @returns {JSX.Element}
 */
function ApprovalChip({ status }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={status}
      color={status === WHATSAPP_APPROVED ? "success" : status === "rejected" ? "error" : "warning"}
    />
  );
}

/**
 * A search box with a leading search icon, as used across the CMS list pages.
 */
function SearchField({ value, onChange, placeholder, name, sx }) {
  return (
    <TextField
      size="small"
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={sx}
      slotProps={{
        htmlInput: { name, autoComplete: "off" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <ICONS.search sx={{ opacity: 0.7 }} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

/**
 * Dialog listing the Twilio account's templates, each importable once.
 */
function TwilioImportDialog({ open, onClose, onImported, t, dir }) {
  const [templates, setTemplates] = useState(null);
  const [busySid, setBusySid] = useState(null);
  const [search, setSearch] = useState("");
  // EventPass name per template, defaulting to the Twilio name.
  const [names, setNames] = useState({});

  useEffect(() => {
    if (!open) return;
    setTemplates(null);
    setSearch("");
    setNames({});
    getTwilioWhatsAppTemplates().then((list) => setTemplates(Array.isArray(list) ? list : []));
  }, [open]);

  const visible = (templates || []).filter((template) =>
    matchesSearch([template.name, names[template.contentSid], template.body, template.category], search)
  );

  const handleImport = async (contentSid) => {
    setBusySid(contentSid);
    const template = templates.find((item) => item.contentSid === contentSid);
    const result = await importWhatsAppTemplate(contentSid, (names[contentSid] ?? template?.name ?? "").trim());
    setBusySid(null);
    if (result?.error) return;
    setTemplates((list) => list.map((item) => (item.contentSid === contentSid ? { ...item, imported: true } : item)));
    onImported();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1 }}>{t.twilioTitle}</Box>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={t.searchTwilio}
          name="twilio-templates-search"
          sx={{ minWidth: { sm: 240 } }}
        />
      </DialogTitle>
      <DialogContent dividers>
        {templates === null ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", py: 2 }}>
            <CircularProgress size={22} />
            <Typography>{t.loadingTwilio}</Typography>
          </Stack>
        ) : visible.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Stack spacing={1.5}>
            {visible.map((template) => (
              <Paper key={template.contentSid} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1, flexWrap: "wrap", rowGap: 1 }}>
                  <Typography sx={{ fontWeight: 600, flex: 1, wordBreak: "break-word" }}>{template.name}</Typography>
                  <ApprovalChip status={template.approvalStatus} />
                  {template.category && <Chip size="small" label={template.category} />}
                  {template.imported ? (
                    <Chip size="small" color="primary" icon={<ICONS.check fontSize="small" />} label={t.imported} />
                  ) : template.approvalStatus === "rejected" ? (
                    <Tooltip title={t.rejectedHelp}>
                      <span>
                        <Button
                          size="small"
                          variant="contained"
                          disabled
                          startIcon={<ICONS.cancel fontSize="small" />}
                          sx={getStartIconSpacing(dir)}
                        >
                          {t.rejected}
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        busySid === template.contentSid ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <ICONS.download fontSize="small" />
                        )
                      }
                      disabled={busySid === template.contentSid}
                      onClick={() => handleImport(template.contentSid)}
                      sx={getStartIconSpacing(dir)}
                    >
                      {t.import}
                    </Button>
                  )}
                </Stack>
                {!template.imported && template.approvalStatus !== "rejected" && (
                  <TextField
                    size="small"
                    fullWidth
                    label={t.nameInEventPass}
                    value={names[template.contentSid] ?? template.name}
                    onChange={(e) => setNames((prev) => ({ ...prev, [template.contentSid]: e.target.value }))}
                    helperText={t.nameHelp}
                    sx={{ mb: 1 }}
                    slotProps={{ htmlInput: { maxLength: WHATSAPP_MESSAGE_LIMITS.MAX_TEMPLATE_NAME_LENGTH } }}
                  />
                )}
                <TemplateBody body={template.body} lines={3} />
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<ICONS.close />} sx={getStartIconSpacing(dir)}>
          {t.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Create or edit one platform default message.
 */
function DefaultMessageDialog({ open, initial, presetTemplateId, onClose, onSaved, t, dir }) {
  const [message, setMessage] = useState(createEmptyMessage());
  const [eventTypes, setEventTypes] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const catalog = useWhatsAppCatalog(eventTypes.length ? eventTypes : WHATSAPP_EVENT_TYPES, open);

  useEffect(() => {
    if (!open) return;
    setMessage(
      initial
        ? toEditableMessages([initial])[0]
        : { ...createEmptyMessage(), template: presetTemplateId || "" }
    );
    setEventTypes(initial?.eventTypes || []);
    setError("");
  }, [open, initial, presetTemplateId]);

  const toggleType = (type) =>
    setEventTypes((current) => (current.includes(type) ? current.filter((x) => x !== type) : [...current, type]));

  const handleSave = async () => {
    if (!eventTypes.length) return setError(t.chooseEventType);
    const problem = validateWhatsAppMessage(message, {
      templatesById: catalog.templatesById,
      placeholders: catalog.placeholders,
      fieldNames: null,
    });
    if (problem) return setError(problem);

    const [payload] = toMessagesPayload([message], catalog.templatesById);
    const body = { label: payload.label, template: payload.template, variables: payload.variables, eventTypes };
    setSaving(true);
    const result = initial?._id
      ? await updateWhatsAppDefaultMessage(initial._id, body)
      : await createWhatsAppDefaultMessage(body);
    setSaving(false);
    if (!result?.error) onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initial ? t.editDefault : t.newDefault}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2">{t.appliesTo}</Typography>
            <FormGroup row>
              {WHATSAPP_EVENT_TYPES.map((type) => (
                <FormControlLabel
                  key={type}
                  control={<Checkbox checked={eventTypes.includes(type)} onChange={() => toggleType(type)} />}
                  label={t.eventTypes[type]}
                />
              ))}
            </FormGroup>
          </Box>
          {catalog.loading ? (
            <CircularProgress size={24} />
          ) : (
            <WhatsAppMessageEditor
              message={message}
              onChange={setMessage}
              templates={catalog.templates}
              placeholders={catalog.placeholders}
              fieldNames={null}
            />
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<ICONS.cancel />} sx={getStartIconSpacing(dir)}>
          {t.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || catalog.loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ICONS.save />}
          sx={getStartIconSpacing(dir)}
        >
          {t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Rename a library template in EventPass. The Twilio name is shown for reference
 * and is what an empty name falls back to.
 */
function RenameTemplateDialog({ template, onClose, onSaved, t, dir }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) setValue(templateLabel(template));
  }, [template]);

  const handleSave = async () => {
    setSaving(true);
    const result = await renameWhatsAppTemplate(template._id, value.trim());
    setSaving(false);
    if (!result?.error) onSaved();
  };

  return (
    <Dialog open={!!template} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t.renameTitle}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            autoFocus
            size="small"
            label={t.nameInEventPass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            helperText={t.nameHelp}
            slotProps={{ htmlInput: { maxLength: WHATSAPP_MESSAGE_LIMITS.MAX_TEMPLATE_NAME_LENGTH } }}
          />
          <Typography variant="body2" color="text.secondary">
            {t.twilioName}: {template?.name}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<ICONS.cancel />} sx={getStartIconSpacing(dir)}>
          {t.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ICONS.save />}
          sx={getStartIconSpacing(dir)}
        >
          {t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * One icon action in a card's footer, styled like the Users page cards.
 */
function CardActionIcon({ title, color = "primary", onClick, disabled = false, children }) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton color={color} onClick={onClick} disabled={disabled} aria-label={title}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/**
 * Footer row of card actions below the audit details, aligned to the end like
 * the Users page cards.
 */
function CardFooterActions({ children }) {
  return (
    <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end", mt: "auto" }}>
      {children}
    </CardActions>
  );
}

/**
 * One library template: name, status chips, the highlighted body, audit details
 * and (for superadmin) the actions.
 */
function TemplateCard({ template, t, locale, defaultTypes, syncing, onSync, onRename, onSetDefault, onRemove }) {
  return (
    <AppCard sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <ICONS.whatsapp color="success" sx={{ mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, wordBreak: "break-word" }}>{templateLabel(template)}</Typography>
            {template.displayName && (
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                {t.twilioName}: {template.name}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
          <ApprovalChip status={template.approvalStatus} />
          {template.category && <Chip size="small" label={template.category} />}
          <Chip size="small" variant="outlined" label={`${template.variables.length} ${t.variables}`} />
          {template.hasMedia && <Chip size="small" variant="outlined" label={t.media} />}
          {defaultTypes.map((type) => (
            <Chip
              key={type}
              size="small"
              color="primary"
              icon={<ICONS.star fontSize="small" />}
              label={`${t.defaultFor} ${t.eventTypes[type]}`}
            />
          ))}
        </Stack>
        <Divider />
        <TemplateBody body={template.body} />
      </CardContent>
      <RecordMetadata
        createdByName={template.createdBy}
        updatedByName={template.updatedBy}
        createdAt={template.createdAt}
        updatedAt={template.updatedAt}
        locale={locale}
      />
      {onRename && (
        <CardFooterActions>
          <CardActionIcon title={t.rename} onClick={onRename}>
            <ICONS.edit />
          </CardActionIcon>
          <CardActionIcon title={t.setAsDefault} onClick={onSetDefault}>
            {defaultTypes.length ? <ICONS.star /> : <ICONS.starBorder />}
          </CardActionIcon>
          <CardActionIcon title={t.refresh} color="secondary" onClick={onSync} disabled={syncing}>
            {syncing ? <CircularProgress size={20} /> : <ICONS.refresh />}
          </CardActionIcon>
          <CardActionIcon title={t.remove} color="error" onClick={onRemove}>
            <ICONS.delete />
          </CardActionIcon>
        </CardFooterActions>
      )}
    </AppCard>
  );
}

/**
 * One platform default message: name, template, event types, audit details
 * and (for superadmin) the actions.
 */
function DefaultMessageCard({ message, t, locale, onEdit, onRemove }) {
  return (
    <AppCard sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, flexGrow: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }}>{message.label}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
            {templateLabel(message.template) || t.missingTemplate}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
          {message.template && <ApprovalChip status={message.template.approvalStatus} />}
          {message.eventTypes.map((type) => (
            <Chip key={type} size="small" variant="outlined" label={t.eventTypes[type]} />
          ))}
        </Stack>
        {message.template && (
          <>
            <Divider />
            <TemplateBody body={message.template.body} lines={3} />
          </>
        )}
      </CardContent>
      <RecordMetadata
        createdByName={message.createdBy}
        updatedByName={message.updatedBy}
        createdAt={message.createdAt}
        updatedAt={message.updatedAt}
        locale={locale}
      />
      {onEdit && (
        <CardFooterActions>
          <CardActionIcon title={t.editDefault} onClick={onEdit}>
            <ICONS.edit />
          </CardActionIcon>
          <CardActionIcon title={t.removeDefaultTitle} color="error" onClick={onRemove}>
            <ICONS.delete />
          </CardActionIcon>
        </CardFooterActions>
      )}
    </AppCard>
  );
}

export default function WhatsAppTemplatesPage() {
  const { user } = useAuth();
  const { t, dir, align, language } = useI18nLayout(translations);
  const locale = language === "ar" ? "ar-SA" : "en-GB";
  const isSuperadmin = user?.role === "superadmin";
  // Admins can view the library and defaults; only superadmin changes them.
  const canView = isSuperadmin || user?.role === "admin";

  const [templates, setTemplates] = useState(null);
  const [defaults, setDefaults] = useState([]);
  const [activeTab, setActiveTab] = useState(TAB_LIBRARY);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState({ open: false, initial: null, presetTemplateId: "" });
  const [confirm, setConfirm] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const searchParams = useSearchParams();

  // Links from other pages (e.g. Activity Logs) open a filtered record: ?search=<name>&tab=defaults
  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch) setSearch(initialSearch.trim());
    if (searchParams.get("tab") === "defaults") setActiveTab(TAB_DEFAULTS);
  }, [searchParams]);

  const load = useCallback(async () => {
    const [templateList, defaultList] = await Promise.all([getWhatsAppTemplates(), getWhatsAppDefaultMessages()]);
    setTemplates(Array.isArray(templateList) ? templateList : []);
    setDefaults(Array.isArray(defaultList) ? defaultList : []);
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const visibleTemplates = useMemo(
    () =>
      (templates || []).filter((template) =>
        matchesSearch(
          [template.displayName, template.name, template.body, template.category, template.approvalStatus],
          search
        )
      ),
    [templates, search]
  );

  const defaultGroups = useMemo(() => {
    const visible = defaults.filter((message) =>
      matchesSearch(
        [
          message.label,
          message.template?.displayName,
          message.template?.name,
          message.template?.body,
          ...message.eventTypes.map((type) => t.eventTypes[type]),
        ],
        search
      )
    );
    return WHATSAPP_EVENT_TYPES.map((type) => ({
      type,
      messages: visible.filter((message) => message.eventTypes.includes(type)),
    })).filter((group) => group.messages.length);
  }, [defaults, search, t]);

  // Event types each template is already a platform default for, for the card badges.
  const defaultTypesByTemplate = useMemo(() => {
    const map = new Map();
    for (const message of defaults) {
      const id = String(message.template?._id || "");
      if (!id) continue;
      map.set(id, [...new Set([...(map.get(id) || []), ...message.eventTypes])]);
    }
    return map;
  }, [defaults]);

  const closeEditor = () => setEditing({ open: false, initial: null, presetTemplateId: "" });

  const handleSync = async (id) => {
    setSyncingId(id);
    await syncWhatsAppTemplate(id);
    setSyncingId(null);
    load();
  };

  const handleConfirm = async () => {
    const action = confirm.kind === "template" ? deleteWhatsAppTemplate : deleteWhatsAppDefaultMessage;
    await action(confirm.id);
    setConfirm(null);
    load();
  };

  if (!canView) {
    return (
      <Container dir={dir} maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
        <BreadcrumbsNav />
        <Alert severity="info" sx={{ mt: 2 }}>
          {t.adminsOnly}
        </Alert>
      </Container>
    );
  }

  const isLibrary = activeTab === TAB_LIBRARY;
  const listIsEmpty = isLibrary ? !templates?.length : !defaults.length;
  const nothingMatches = !listIsEmpty && (isLibrary ? !visibleTemplates.length : !defaultGroups.length);

  return (
    <Container dir={dir} maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
      <BreadcrumbsNav />

      {/* Header: title on the start side, search and the tab's action on the end side */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
          width: "100%",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", textAlign: align }}>
            {t.title}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", textAlign: align }}>
            {t.subtitle}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexShrink: 0, alignItems: { xs: "stretch", sm: "center" } }}
        >
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={isLibrary ? t.searchTemplates : t.searchDefaults}
            name="whatsapp-templates-search"
            sx={{ minWidth: { sm: 240, md: 280 } }}
          />
          {!isSuperadmin ? null : isLibrary ? (
            <Button
              variant="contained"
              startIcon={<ICONS.download />}
              onClick={() => setImportOpen(true)}
              sx={{ whiteSpace: "nowrap", ...getStartIconSpacing(dir) }}
            >
              {t.importFromTwilio}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<ICONS.add />}
              onClick={() => setEditing({ open: true, initial: null, presetTemplateId: "" })}
              disabled={!templates?.length}
              sx={{ whiteSpace: "nowrap", ...getStartIconSpacing(dir) }}
            >
              {t.addDefault}
            </Button>
          )}
        </Stack>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab value={TAB_LIBRARY} label={`${t.library} (${templates?.length ?? 0})`} />
        <Tab value={TAB_DEFAULTS} label={`${t.defaults} (${defaults.length})`} />
      </Tabs>

      {!isSuperadmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t.readOnly}
        </Alert>
      )}

      {templates === null ? (
        <LoadingState />
      ) : (
        <>
          {!isLibrary && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: align }}>
              {t.defaultsHint}
            </Typography>
          )}

          {listIsEmpty && <Alert severity="info">{isLibrary ? t.emptyLibrary : t.emptyDefaults}</Alert>}
          {nothingMatches && <NoDataAvailable />}

          {isLibrary ? (
            <Box sx={CARD_GRID_SX}>
              {visibleTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  t={t}
                  locale={locale}
                  syncing={syncingId === template._id}
                  onSync={isSuperadmin ? () => handleSync(template._id) : undefined}
                  defaultTypes={defaultTypesByTemplate.get(String(template._id)) || []}
                  onRename={isSuperadmin ? () => setRenaming(template) : undefined}
                  onSetDefault={() =>
                    setEditing({ open: true, initial: null, presetTemplateId: String(template._id) })
                  }
                  onRemove={() => setConfirm({ kind: "template", id: template._id })}
                />
              ))}
            </Box>
          ) : (
            <Stack spacing={3}>
              {defaultGroups.map((group) => (
                <Box key={group.type}>
                  <Typography variant="h6" sx={{ mb: 1.5, textAlign: align }}>
                    {t.eventTypes[group.type]}
                  </Typography>
                  <Box sx={CARD_GRID_SX}>
                    {group.messages.map((message) => (
                      <DefaultMessageCard
                        key={`${group.type}-${message._id}`}
                        message={message}
                        t={t}
                        locale={locale}
                        onEdit={
                          isSuperadmin ? () => setEditing({ open: true, initial: message, presetTemplateId: "" }) : undefined
                        }
                        onRemove={() => setConfirm({ kind: "default", id: message._id })}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </>
      )}

      <TwilioImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={load} t={t} dir={dir} />
      <RenameTemplateDialog
        template={renaming}
        onClose={() => setRenaming(null)}
        onSaved={() => {
          setRenaming(null);
          load();
        }}
        t={t}
        dir={dir}
      />
      <DefaultMessageDialog
        dir={dir}
        open={editing.open}
        initial={editing.initial}
        presetTemplateId={editing.presetTemplateId}
        onClose={closeEditor}
        onSaved={() => {
          closeEditor();
          setActiveTab(TAB_DEFAULTS);
          load();
        }}
        t={t}
      />
      <ConfirmationDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        title={confirm?.kind === "template" ? t.removeTitle : t.removeDefaultTitle}
        message={confirm?.kind === "template" ? t.removeMessage : t.removeDefaultMessage}
        confirmButtonText={t.remove}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
