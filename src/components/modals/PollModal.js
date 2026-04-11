"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import DownloadingIcon from "@mui/icons-material/Downloading";
import { useState, useEffect } from "react";
import slugify from "@/utils/slugify";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { getEventsByBusinessSlug } from "@/services/eventreg/eventService";
import RichTextEditor from "@/components/RichTextEditor";

const translations = {
  en: {
    createTitle: "Create Poll",
    editTitle: "Edit Poll",
    title: "Poll Title",
    slug: "Slug",
    description: "Description",
    pollType: "Poll Type",
    optionsType: "Options (Standard)",
    sliderType: "Slider",
    linkedEvent: "Select Event *",
    verificationField: "Verification Field",
    selectPrimaryField: "Select Primary Field",
    cancel: "Cancel",
    create: "Create Poll",
    update: "Save Changes",
    creating: "Creating...",
    updating: "Saving...",
    required: "Poll title is required.",
    requiredEvent: "Please select an event.",
    requiredType: "Please select a poll type.",
    slugInUse: "Slug already in use.",
    loadFields: "Load Input Fields",
    loading: "Loading...",
    requiredPrimaryField: "Please select a primary field.",
  },
  ar: {
    createTitle: "إنشاء استطلاع",
    editTitle: "تعديل الاستطلاع",
    title: "عنوان الاستطلاع",
    slug: "المعرف",
    description: "الوصف",
    pollType: "نوع الاستطلاع",
    optionsType: "خيارات (قياسي)",
    sliderType: "شريط التمرير",
    linkedEvent: "اختر الفعالية *",
    verificationField: "حقل التحقق",
    selectPrimaryField: "اختر الحقل الأساسي",
    cancel: "إلغاء",
    create: "إنشاء الاستطلاع",
    update: "حفظ التغييرات",
    creating: "جارٍ الإنشاء...",
    updating: "جارٍ الحفظ...",
    required: "عنوان الاستطلاع مطلوب.",
    requiredEvent: "يرجى اختيار فعالية.",
    requiredType: "يرجى اختيار نوع الاستطلاع.",
    slugInUse: "المعرف مستخدم بالفعل.",
    loadFields: "تحميل حقول الإدخال",
    loading: "جارٍ التحميل...",
    requiredPrimaryField: "يرجى اختيار حقل أساسي.",
  },
};

const STANDARD_FIELDS = [
  { name: "fullName", label: "Full Name" },
  { name: "email", label: "Email" },
  { name: "phone", label: "Phone" },
  { name: "company", label: "Company" },
];

export default function PollModal({ open, onClose, onSubmit, initialValues, selectedBusiness }) {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const isEdit = !!(initialValues && initialValues._id);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [eventRegEvents, setEventRegEvents] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadedFields, setLoadedFields] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    type: "options",
    linkedEventRegId: "",
    primaryField: "",
  });

  useEffect(() => {
    if (open) {
      const linkedId = initialValues?.linkedEventRegId?._id || initialValues?.linkedEventRegId || "";
      setFormData({
        title: initialValues?.title || "",
        slug: initialValues?.slug || "",
        description: initialValues?.description || "",
        type: initialValues?.type || "options",
        linkedEventRegId: linkedId,
        primaryField: initialValues?.primaryField || "",
      });
      if (!isEdit) setLoadedFields(null);
      setErrors({});
    }
  }, [open, initialValues]);

  useEffect(() => {
    if (!open || !selectedBusiness) return;
    getEventsByBusinessSlug(selectedBusiness)
      .then(result => setEventRegEvents(Array.isArray(result) ? result : []))
      .catch(() => setEventRegEvents([]));
  }, [open, selectedBusiness]);

  // Auto-load fields when editing with a linked event
  useEffect(() => {
    if (open && isEdit) {
      const linkedId = initialValues?.linkedEventRegId?._id || initialValues?.linkedEventRegId || "";
      if (linkedId) fetchFields(linkedId);
    }
  }, [open, initialValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFields = async (eventId) => {
    if (!eventId) return;
    setLoadingFields(true);
    setLoadedFields(null);
    try {
      const { getPublicEventById } = await import("@/services/eventreg/eventService");
      const freshEvent = await getPublicEventById(eventId);
      const formFields = Array.isArray(freshEvent?.formFields) ? freshEvent.formFields : [];
      if (formFields.length > 0) {
        setLoadedFields(formFields.map(f => ({ name: f.inputName, label: f.inputName })));
      } else {
        setLoadedFields(STANDARD_FIELDS);
      }
    } catch {
      setLoadedFields(STANDARD_FIELDS);
    }
    setLoadingFields(false);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({ ...prev, title, slug: isEdit ? prev.slug : slugify(title) }));
  };

  const handleEventChange = (e) => {
    setFormData(prev => ({ ...prev, linkedEventRegId: e.target.value, primaryField: "" }));
    setLoadedFields(null);
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = t.required;
    if (!formData.type) newErrors.type = t.requiredType;
    if (!formData.linkedEventRegId) newErrors.linkedEventRegId = t.requiredEvent;
    if (loadedFields && loadedFields.length > 0 && !formData.primaryField) newErrors.primaryField = t.requiredPrimaryField;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug || slugify(formData.title),
        description: formData.description || "",
        type: formData.type,
        linkedEventRegId: formData.linkedEventRegId || null,
        primaryField: formData.linkedEventRegId ? (formData.primaryField || null) : null,
        businessSlug: selectedBusiness,
      };
      await onSubmit(payload, isEdit ? initialValues._id : null);
      setLoading(false);
    } catch (err) {
      showMessage(err.message || "Failed to save poll", "error");
      setLoading(false);
    }
  };

  const linkedEventObj = eventRegEvents.find(e => e._id === formData.linkedEventRegId) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir={dir}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", px: 3, pt: 3 }}>
        <Typography fontWeight="bold" fontSize="1.25rem">
          {isEdit ? t.editTitle : t.createTitle}
        </Typography>
        <IconButton onClick={onClose} sx={{ ml: 2, alignSelf: "flex-start" }}>
          <ICONS.close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Title */}
          <TextField
            label={`${t.title} *`}
            value={formData.title}
            onChange={e => { handleTitleChange(e); setErrors(prev => ({ ...prev, title: undefined })); }}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
          />

          {/* Slug */}
          <TextField
            label={t.slug}
            value={formData.slug}
            onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            fullWidth
          />

          {/* Description */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {t.description}
            </Typography>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
              placeholder={t.description}
              dir={dir}
            />
          </Box>

          {/* Poll Type */}
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel>{t.pollType} *</InputLabel>
            <Select
              value={formData.type}
              label={`${t.pollType} *`}
              onChange={e => { setFormData(prev => ({ ...prev, type: e.target.value })); setErrors(prev => ({ ...prev, type: undefined })); }}
            >
              <MenuItem value="options">{t.optionsType}</MenuItem>
              <MenuItem value="slider">{t.sliderType}</MenuItem>
            </Select>
            {errors.type && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{errors.type}</Typography>}
          </FormControl>

          {/* Event Select */}
          <FormControl fullWidth error={!!errors.linkedEventRegId}>
            <InputLabel>{t.linkedEvent}</InputLabel>
            <Select
              value={formData.linkedEventRegId}
              label={t.linkedEvent}
              onChange={e => { handleEventChange(e); setErrors(prev => ({ ...prev, linkedEventRegId: undefined })); }}
            >
              {eventRegEvents.map(ev => (
                <MenuItem key={ev._id} value={ev._id}>{ev.name}</MenuItem>
              ))}
            </Select>
            {errors.linkedEventRegId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{errors.linkedEventRegId}</Typography>}
          </FormControl>

          {/* Load Fields Button */}
          {formData.linkedEventRegId && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => fetchFields(formData.linkedEventRegId)}
              disabled={loadingFields}
              startIcon={loadingFields ? <CircularProgress size={16} color="inherit" /> : <DownloadingIcon />}
            >
              {loadingFields ? t.loading : t.loadFields}
            </Button>
          )}

          {/* Verification Field */}
          {formData.linkedEventRegId && loadedFields && loadedFields.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={600} color={errors.primaryField ? "error" : "text.secondary"}>
                {t.selectPrimaryField} *
              </Typography>
              <FormGroup sx={{ mt: 0.5 }}>
                {loadedFields.map(f => (
                  <FormControlLabel
                    key={f.name}
                    control={
                      <Checkbox
                        size="small"
                        checked={formData.primaryField === f.name}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            primaryField: prev.primaryField === f.name ? "" : f.name,
                          }));
                          setErrors(prev => ({ ...prev, primaryField: undefined }));
                        }}
                      />
                    }
                    label={<Typography variant="body2">{f.label}</Typography>}
                  />
                ))}
              </FormGroup>
              {errors.primaryField && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                  {errors.primaryField}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1, justifyContent: "flex-end" }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ICONS.save />}
        >
          {loading ? (isEdit ? t.updating : t.creating) : (isEdit ? t.update : t.create)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
