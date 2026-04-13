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
  Divider,
} from "@mui/material";
import DownloadingIcon from "@mui/icons-material/Downloading";
import { useState, useEffect } from "react";
import slugify from "@/utils/slugify";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { getEventsByBusinessSlug } from "@/services/eventreg/eventService";
import RichTextEditor from "@/components/RichTextEditor";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { deleteMedia } from "@/services/deleteMediaService";

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
    linkedEvent: "Select Event (Optional)",
    selectPrimaryField: "Select Primary Field",
    cancel: "Cancel",
    create: "Create Poll",
    update: "Save Changes",
    creating: "Creating...",
    updating: "Saving...",
    required: "Poll title is required.",
    requiredType: "Please select a poll type.",
    loadFields: "Load Input Fields",
    loading: "Loading...",
    requiredPrimaryField: "Please select a primary field.",
    branding: "Branding",
    logo: "Upload Logo",
    backgroundEn: "Upload Background (EN)",
    backgroundAr: "Upload Background (AR)",
    uploadBackground: "Upload Background",
    uploading: "Uploading...",
    nonRequiredDisabled: "(not required in event)",
    deleteMediaTitle: "Delete Media",
    deleteMediaMessage: "Are you sure you want to delete this media? This action cannot be undone.",
    deleteConfirmBtn: "Delete",
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
    linkedEvent: "اختر الفعالية (اختياري)",
    selectPrimaryField: "اختر الحقل الأساسي",
    cancel: "إلغاء",
    create: "إنشاء الاستطلاع",
    update: "حفظ التغييرات",
    creating: "جارٍ الإنشاء...",
    updating: "جارٍ الحفظ...",
    required: "عنوان الاستطلاع مطلوب.",
    requiredType: "يرجى اختيار نوع الاستطلاع.",
    loadFields: "تحميل حقول الإدخال",
    loading: "جارٍ التحميل...",
    requiredPrimaryField: "يرجى اختيار حقل أساسي.",
    branding: "العلامة التجارية",
    logo: "رفع الشعار",
    backgroundEn: "رفع الخلفية (EN)",
    backgroundAr: "رفع الخلفية (AR)",
    uploadBackground: "رفع الخلفية",
    uploading: "جارٍ الرفع...",
    nonRequiredDisabled: "(غير مطلوب في الفعالية)",
    deleteMediaTitle: "حذف الوسائط",
    deleteMediaMessage: "هل أنت متأكد من حذف هذه الوسائط؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteConfirmBtn: "حذف",
  },
};

const STANDARD_FIELDS = [
  { name: "fullName", label: "Full Name", required: true },
  { name: "email", label: "Email", required: true },
  { name: "phone", label: "Phone", required: false },
  { name: "company", label: "Company", required: false },
];

function MediaUploadField({ label, preview, fileType, onFileSelect, onRemove, accept = "image/*,video/*" }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <Button component="label" variant="outlined" size="small">
        {label}
        <input hidden type="file" accept={accept} onChange={e => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]); e.target.value = ""; }} />
      </Button>
      {preview && (
        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            {fileType === "video" ? (
              <video src={preview} controls style={{ maxWidth: 280, maxHeight: 120, height: "auto", borderRadius: 6, objectFit: "cover" }} />
            ) : (
              <Box component="img" src={preview} alt={label} sx={{ maxWidth: 280, maxHeight: 100, height: "auto", borderRadius: "6px", objectFit: "cover", display: "block" }} />
            )}
            <IconButton size="small" onClick={onRemove} sx={{ position: "absolute", top: -18, right: 6, bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" } }}>
              <ICONS.delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}

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

  // Media state
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [backgroundEn, setBackgroundEn] = useState(null);
  const [backgroundEnPreview, setBackgroundEnPreview] = useState("");
  const [backgroundEnFileType, setBackgroundEnFileType] = useState(null);
  const [backgroundAr, setBackgroundAr] = useState(null);
  const [backgroundArPreview, setBackgroundArPreview] = useState("");
  const [backgroundArFileType, setBackgroundArFileType] = useState(null);
  const [deleteConfirmState, setDeleteConfirmState] = useState({ open: false, type: null, fileUrl: null });

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
      // Restore existing media previews
      setLogo(null);
      setLogoPreview(initialValues?.logoUrl || "");
      setBackgroundEn(null);
      setBackgroundEnPreview(initialValues?.background?.en?.url || "");
      setBackgroundEnFileType(initialValues?.background?.en?.fileType || null);
      setBackgroundAr(null);
      setBackgroundArPreview(initialValues?.background?.ar?.url || "");
      setBackgroundArFileType(initialValues?.background?.ar?.fileType || null);
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
        setLoadedFields(formFields.map(f => ({ name: f.inputName, label: f.inputName, required: !!f.required })));
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

  const handleMediaSelect = (type, file) => {
    const preview = URL.createObjectURL(file);
    const fileType = file.type.startsWith("video/") ? "video" : "image";
    if (type === "logo") { setLogo(file); setLogoPreview(preview); }
    else if (type === "backgroundEn") { setBackgroundEn(file); setBackgroundEnPreview(preview); setBackgroundEnFileType(fileType); }
    else if (type === "backgroundAr") { setBackgroundAr(file); setBackgroundArPreview(preview); setBackgroundArFileType(fileType); }
  };

  const clearMediaState = (type) => {
    if (type === "logo") { setLogo(null); setLogoPreview(""); }
    else if (type === "backgroundEn") { setBackgroundEn(null); setBackgroundEnPreview(""); setBackgroundEnFileType(null); }
    else if (type === "backgroundAr") { setBackgroundAr(null); setBackgroundArPreview(""); setBackgroundArFileType(null); }
  };

  const handleMediaRemove = (type) => {
    const currentUrl = type === "logo" ? logoPreview : type === "backgroundEn" ? backgroundEnPreview : backgroundArPreview;
    if (currentUrl && currentUrl.startsWith("blob:")) {
      clearMediaState(type);
    } else if (currentUrl) {
      setDeleteConfirmState({ open: true, type, fileUrl: currentUrl });
    }
  };

  const confirmDeleteMedia = async () => {
    try {
      const payload = { fileUrl: deleteConfirmState.fileUrl, storageType: "s3" };
      if (isEdit && initialValues?._id) {
        payload.pollId = initialValues._id;
        payload.mediaType = deleteConfirmState.type;
      }
      await deleteMedia(payload);
      clearMediaState(deleteConfirmState.type);
      if (initialValues?._id) {
        if (deleteConfirmState.type === "logo") {
          initialValues.logoUrl = null;
        } else if (deleteConfirmState.type === "backgroundEn") {
          if (!initialValues.background) initialValues.background = {};
          initialValues.background.en = null;
        } else if (deleteConfirmState.type === "backgroundAr") {
          if (!initialValues.background) initialValues.background = {};
          initialValues.background.ar = null;
        }
      }
    } catch (err) {
      showMessage(err.message || "Failed to delete media", "error");
    } finally {
      setDeleteConfirmState({ open: false, type: null, fileUrl: null });
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = t.required;
    if (!formData.type) newErrors.type = t.requiredType;
    if (formData.linkedEventRegId && loadedFields && loadedFields.length > 0 && !formData.primaryField) newErrors.primaryField = t.requiredPrimaryField;
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      // Upload new media files
      const filesToUpload = [];
      if (logo) filesToUpload.push({ file: logo, type: "logo" });
      if (backgroundEn) filesToUpload.push({ file: backgroundEn, type: "backgroundEn", fileType: backgroundEnFileType });
      if (backgroundAr) filesToUpload.push({ file: backgroundAr, type: "backgroundAr", fileType: backgroundArFileType });

      let finalLogoUrl = logo ? null : (logoPreview || null);
      let finalBgEn = backgroundEn ? null : (backgroundEnPreview ? { url: backgroundEnPreview, fileType: backgroundEnFileType || "image" } : null);
      let finalBgAr = backgroundAr ? null : (backgroundArPreview ? { url: backgroundArPreview, fileType: backgroundArFileType || "image" } : null);

      if (filesToUpload.length > 0) {
        const urls = await uploadMediaFiles({
          files: filesToUpload.map(f => f.file),
          businessSlug: selectedBusiness,
          moduleName: "votecast",
        });
        urls.forEach((url, i) => {
          const item = filesToUpload[i];
          if (item.type === "logo") finalLogoUrl = url;
          else if (item.type === "backgroundEn") finalBgEn = { url, fileType: item.fileType || "image" };
          else if (item.type === "backgroundAr") finalBgAr = { url, fileType: item.fileType || "image" };
        });
      }

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug || slugify(formData.title),
        description: formData.description || "",
        type: formData.type,
        linkedEventRegId: formData.linkedEventRegId || null,
        primaryField: formData.linkedEventRegId ? (formData.primaryField || null) : null,
        logoUrl: finalLogoUrl,
        background: { en: finalBgEn || null, ar: finalBgAr || null },
        businessSlug: selectedBusiness,
      };
      await onSubmit(payload, isEdit ? initialValues._id : null);
      setLoading(false);
    } catch (err) {
      showMessage(err.message || "Failed to save poll", "error");
      setLoading(false);
    }
  };

  return (
    <>
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
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{t.description}</Typography>
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

          {/* Branding */}
          <Divider />
          <MediaUploadField
            label={t.logo}
            preview={logoPreview}
            fileType="image"
            accept="image/*"
            onFileSelect={f => handleMediaSelect("logo", f)}
            onRemove={() => handleMediaRemove("logo")}
          />
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, width: "100%" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{t.uploadBackground}</Typography>
            <MediaUploadField
              label={t.backgroundEn}
              preview={backgroundEnPreview}
              fileType={backgroundEnFileType}
              onFileSelect={f => handleMediaSelect("backgroundEn", f)}
              onRemove={() => handleMediaRemove("backgroundEn")}
            />
            <MediaUploadField
              label={t.backgroundAr}
              preview={backgroundArPreview}
              fileType={backgroundArFileType}
              onFileSelect={f => handleMediaSelect("backgroundAr", f)}
              onRemove={() => handleMediaRemove("backgroundAr")}
            />
          </Box>
          <Divider />

          {/* Event Select */}
          <FormControl fullWidth>
            <InputLabel>{t.linkedEvent}</InputLabel>
            <Select
              value={formData.linkedEventRegId}
              label={t.linkedEvent}
              onChange={e => handleEventChange(e)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {eventRegEvents.map(ev => (
                <MenuItem key={ev._id} value={ev._id}>{ev.name}</MenuItem>
              ))}
            </Select>
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
                        disabled={!f.required}
                        checked={formData.primaryField === f.name}
                        onChange={() => {
                          if (!f.required) return;
                          setFormData(prev => ({
                            ...prev,
                            primaryField: prev.primaryField === f.name ? "" : f.name,
                          }));
                          setErrors(prev => ({ ...prev, primaryField: undefined }));
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" color={f.required ? "text.primary" : "text.disabled"}>
                        {f.label}
                      </Typography>
                    }
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

    <ConfirmationDialog
      open={deleteConfirmState.open}
      onClose={() => setDeleteConfirmState({ open: false, type: null, fileUrl: null })}
      onConfirm={confirmDeleteMedia}
      title={t.deleteMediaTitle}
      message={t.deleteMediaMessage}
      confirmButtonText={t.deleteConfirmBtn}
      confirmButtonIcon={<ICONS.delete />}
      confirmButtonColor="error"
    />
    </>
  );
}
