"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ICONS from "@/utils/iconUtil";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import { deleteMedia } from "@/services/deleteMediaService";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    dialogTitleUpdate: "Update Wall Configuration",
    dialogTitleCreate: "Create Wall Configuration",
    name: "Name",
    slug: "Slug",
    mode: "Mode",
    mosaic: "mosaic",
    card: "card",
    bubble: "bubble",
    sequentialOrder: "Sequential Order",
    randomOrder: "Random Placement",
    cardOrder: "Card Order",
    inputType: "Input Type",
    textInput: "Text",
    signatureInput: "Signature",
    uploadBackground: "Upload Background",
    uploadLogo: "Upload Logo",
    enableRandomSizes: "Enable Random Sizes",
    mosaicRows: "Mosaic Rows",
    mosaicCols: "Mosaic Columns",
    minSize: "Min Size (px)",
    maxSize: "Max Size (px)",
    currentImage: "Current Image:",
    preview: "Preview:",
    cancel: "Cancel",
    update: "Update",
    create: "Create",
    updating: "Updating...",
    creating: "Creating...",
    errors: {
      nameRequired: "Name is required",
      slugRequired: "Slug is required",
      modeRequired: "Mode is required",
      invalidImage: "Please upload a valid image or video file",
      minSizeRequired: "Min size is required when random sizes enabled",
      maxSizeRequired: "Max size is required when random sizes enabled",
      minSizeInvalid: "Min size must be greater than 0",
      maxSizeInvalid: "Max size must be greater than min size",
      mosaicRowsRequired: "Mosaic rows is required",
      mosaicColsRequired: "Mosaic columns is required",
      mosaicRowsInvalid: "Mosaic rows must be a positive integer",
      mosaicColsInvalid: "Mosaic columns must be a positive integer",
    },
    deleteBackgroundTitle: "Delete Background",
    deleteBackgroundMessage: "Are you sure you want to delete this background? This action cannot be undone.",
    deleteLogoTitle: "Delete Logo",
    deleteLogoMessage: "Are you sure you want delete this logo? This action cannot be undone.",
    deleteConfirm: "Delete",
  },
  ar: {
    dialogTitleUpdate: "تحديث تكوين الجدار",
    dialogTitleCreate: "إنشاء تكوين جدار",
    name: "الاسم",
    slug: "الرمز",
    mode: "النمط",
    mosaic: "فسيفساء",
    card: "بطاقة",
    bubble: "فقاعة",
    sequentialOrder: "ترتيب تسلسلي",
    randomOrder: "مواضع عشوائية",
    cardOrder: "ترتيب البطاقات",
    inputType: "نوع الإدخال",
    textInput: "نص",
    signatureInput: "توقيع",
    uploadBackground: "رفع خلفية",
    uploadLogo: "رفع شعار",
    enableRandomSizes: "تفعيل الأحجام العشوائية",
    mosaicRows: "عدد صفوف الفسيفساء",
    mosaicCols: "عدد أعمدة الفسيفساء",
    minSize: "الحد الأدنى (بكسل)",
    maxSize: "الحد الأقصى (بكسل)",
    currentImage: ":الصورة الحالية",
    preview: ":معاينة",
    cancel: "إلغاء",
    update: "تحديث",
    create: "إنشاء",
    updating: "جارٍ التحديث...",
    creating: "جارٍ الإنشاء...",
    errors: {
      nameRequired: "الاسم مطلوب",
      slugRequired: "الرمز مطلوب",
      modeRequired: "النمط مطلوب",
      invalidImage: "الرجاء رفع صورة أو فيديو صالح",
      minSizeRequired: "الحد الأدنى مطلوب عند تفعيل الأحجام العشوائية",
      maxSizeRequired: "الحد الأقصى مطلوب عند تفعيل الأحجام العشوائية",
      minSizeInvalid: "الحد الأدنى يجب أن يكون أكبر من 0",
      maxSizeInvalid: "الحد الأقصى يجب أن يكون أكبر من الحد الأدنى",
      mosaicRowsRequired: "عدد الصفوف مطلوب",
      mosaicColsRequired: "عدد الأعمدة مطلوب",
      mosaicRowsInvalid: "عدد الصفوف يجب أن يكون رقمًا صحيحًا موجبًا",
      mosaicColsInvalid: "عدد الأعمدة يجب أن يكون رقمًا صحيحًا موجبًا",
    },
    deleteBackgroundTitle: "حذف الخلفية",
    deleteBackgroundMessage: "هل أنت متأكد من حذف هذه الخلفية؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteLogoTitle: "حذف الشعار",
    deleteLogoMessage: "هل أنت متأكد من حذف هذا الشعار؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteConfirm: "حذف",
  },
};

const WallConfigModal = ({
  open,
  onClose,
  editMode = false,
  initialValues = {},
  selectedWallConfig = null,
  onSubmit,
  selectedBusiness,
  wallConfigId,
}) => {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    mode: "mosaic",
    background: null,
    backgroundPreview: "",
    backgroundLogo: null,
    backgroundLogoPreview: "",
    randomSizes: false,
    minSize: 100,
    maxSize: 300,
    mosaicRows: 10,
    mosaicCols: 15,
    cardOrder: "sequential",
    cardInputType: "text",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    mediaType: null,
    mediaUrl: null,
  });
  const [buttonWidths, setButtonWidths] = useState({
    background: null,
    logo: null,
  });

  const backgroundButtonRef = useRef(null);
  const logoButtonRef = useRef(null);

  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const currentWallConfigId = wallConfigId || selectedWallConfig?._id || initialValues?._id;

  useEffect(() => {
    if (!open) {
      if (form.backgroundPreview && form.backgroundPreview.startsWith('blob:')) {
        URL.revokeObjectURL(form.backgroundPreview);
      }
      if (form.backgroundLogoPreview && form.backgroundLogoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(form.backgroundLogoPreview);
      }
      return;
    }

    if (!editMode) {
      setForm({
        name: "",
        slug: "",
        mode: "mosaic",
        background: null,
        backgroundPreview: "",
        backgroundLogo: null,
        backgroundLogoPreview: "",
        randomSizes: false,
        minSize: 100,
        maxSize: 300,
        mosaicRows: 10,
        mosaicCols: 15,
        cardOrder: "sequential",
        cardInputType: "text",
      });
    } else {
      const values = selectedWallConfig || initialValues;
      setForm({
        name: values.name || "",
        slug: values.slug || "",
        mode: values.mode || "mosaic",
        background: null,
        backgroundPreview: values.background?.url || "",
        backgroundLogo: null,
        backgroundLogoPreview: values.backgroundLogo?.url || "",
        randomSizes: values.randomSizes?.enabled || false,
        minSize: values.randomSizes?.min || 100,
        maxSize: values.randomSizes?.max || 300,
        mosaicRows: values.mosaicGrid?.rows || 10,
        mosaicCols: values.mosaicGrid?.cols || 15,
        cardOrder: values.cardSettings?.order || "sequential",
        cardInputType: values.cardSettings?.inputType || "text",
      });
    }
    setErrors({});
  }, [open, editMode, initialValues, selectedWallConfig]);

  useEffect(() => {
    const measureButtonWidths = () => {
      if (backgroundButtonRef.current) {
        setButtonWidths((prev) => ({
          ...prev,
          background: backgroundButtonRef.current.offsetWidth,
        }));
      }
      if (logoButtonRef.current) {
        setButtonWidths((prev) => ({
          ...prev,
          logo: logoButtonRef.current.offsetWidth,
        }));
      }
    };

    if (open) {
      const timer = setTimeout(measureButtonWidths, 100);
      return () => clearTimeout(timer);
    }
  }, [open, form]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === "name" && !editMode) {
      const newSlug = slugify(value);
      setForm((prev) => ({
        ...prev,
        slug: newSlug,
      }));
    }

    if (name === "mode" && value === "mosaic") {
      setForm((prev) => ({
        ...prev,
        randomSizes: false,
      }));
    }

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'
      ];

      if (validTypes.includes(file.type) || file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const previewKey = name === 'background' ? 'backgroundPreview' : 'backgroundLogoPreview';

        setForm((prev) => ({
          ...prev,
          [name]: file,
          [previewKey]: URL.createObjectURL(file),
        }));
        
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      } else {
        e.target.value = '';
        
        setErrors((prev) => ({
          ...prev,
          [name]: t.errors.invalidImage,
        }));
      }
    }
  };

  const handleRemoveMedia = (mediaType) => {
    const previewKey = mediaType === 'background' ? 'backgroundPreview' : 'backgroundLogoPreview';
    const currentMedia = form[previewKey];

    if (currentMedia && currentMedia.startsWith('blob:')) {
      URL.revokeObjectURL(currentMedia);
    }

    if (editMode && currentMedia && !currentMedia.startsWith('blob:')) {
      setDeleteConfirm({
        open: true,
        mediaType,
        mediaUrl: currentMedia,
      });
    } else {
      setForm((prev) => ({
        ...prev,
        [mediaType]: null,
        [previewKey]: "",
      }));

      const inputId = mediaType === 'background' ? 'background-upload' : 'logo-upload';
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.value = '';
      }
    }
  };

  const confirmDeleteMedia = async () => {
    const { mediaType, mediaUrl } = deleteConfirm;

    if (editMode && currentWallConfigId && mediaUrl && !mediaUrl.startsWith('blob:')) {
      try {
        await deleteMedia({
          fileUrl: mediaUrl,
          wallConfigId: currentWallConfigId,
          mediaType,
          storageType: "s3",
        });

        const previewKey = mediaType === 'background' ? 'backgroundPreview' : 'backgroundLogoPreview';

        setForm((prev) => ({
          ...prev,
          [mediaType]: null,
          [previewKey]: "",
        }));

        const inputId = mediaType === 'background' ? 'background-upload' : 'logo-upload';
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
          inputElement.value = '';
        }

        setDeleteConfirm({ open: false, mediaType: null, mediaUrl: null });
        showMessage(`${mediaType} deleted successfully`, "success");
      } catch (error) {
        showMessage(error.message || `Failed to delete ${mediaType}`, "error");
        setDeleteConfirm({ open: false, mediaType: null, mediaUrl: null });
      }
    } else {
      const previewKey = mediaType === 'background' ? 'backgroundPreview' : 'backgroundLogoPreview';
      const currentMedia = form[previewKey];

      if (currentMedia && currentMedia.startsWith('blob:')) {
        URL.revokeObjectURL(currentMedia);
      }

      setForm((prev) => ({
        ...prev,
        [mediaType]: null,
        [previewKey]: "",
      }));

      const inputId = mediaType === 'background' ? 'background-upload' : 'logo-upload';
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.value = '';
      }

      setDeleteConfirm({ open: false, mediaType: null, mediaUrl: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    const te = t.errors;

    if (!form.name.trim()) newErrors.name = te.nameRequired;
    if (!form.slug.trim()) newErrors.slug = te.slugRequired;
    if (!form.mode) newErrors.mode = te.modeRequired;

    if (form.mode !== "mosaic" && form.randomSizes) {
      const minSizeValue = Number(form.minSize);
      const maxSizeValue = Number(form.maxSize);

      if (form.minSize === "" || !Number.isFinite(minSizeValue) || minSizeValue <= 0) {
        newErrors.minSize = te.minSizeInvalid;
      }

      if (form.maxSize === "" || !Number.isFinite(maxSizeValue)) {
        newErrors.maxSize = te.maxSizeRequired;
      } else if (maxSizeValue <= minSizeValue) {
        newErrors.maxSize = te.maxSizeInvalid;
      }
    }

    if (form.mode === "mosaic") {
      if (form.mosaicRows === "" || form.mosaicRows == null) {
        newErrors.mosaicRows = te.mosaicRowsRequired;
      } else if (!Number.isInteger(Number(form.mosaicRows)) || Number(form.mosaicRows) <= 0) {
        newErrors.mosaicRows = te.mosaicRowsInvalid;
      }

      if (form.mosaicCols === "" || form.mosaicCols == null) {
        newErrors.mosaicCols = te.mosaicColsRequired;
      } else if (!Number.isInteger(Number(form.mosaicCols)) || Number(form.mosaicCols) <= 0) {
        newErrors.mosaicCols = te.mosaicColsInvalid;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const filesToUpload = [];
      const formDataToSend = {
        name: form.name,
        slug: form.slug,
        mode: form.mode,
        randomSizes: {
          enabled: form.mode !== "mosaic" ? form.randomSizes : false,
          min: form.randomSizes ? Number(form.minSize) : 150,
          max: form.randomSizes ? Number(form.maxSize) : 300,
        },
        mosaicGrid: {
          rows: form.mode === "mosaic" ? Number(form.mosaicRows) : 10,
          cols: form.mode === "mosaic" ? Number(form.mosaicCols) : 15,
        },
        cardSettings: {
          order: form.mode === "card" ? form.cardOrder : "sequential",
          inputType: form.mode === "card" ? form.cardInputType : "text",
        },
      };

      if (form.background) {
        filesToUpload.push(form.background);
      }

      if (form.backgroundLogo) {
        filesToUpload.push(form.backgroundLogo);
      }

      if (filesToUpload.length > 0) {
        const uploadResults = await uploadMediaFiles({
          files: filesToUpload,
          businessSlug: selectedBusiness,
          moduleName: 'memorywall',
        });

        uploadResults.forEach((url, index) => {
          const file = filesToUpload[index];
          
          if (url) {
            const key = url.split('/').pop();
            
            if (form.background && file === form.background) {
              formDataToSend.background = {
                key: key,
                url: url,
              };
            } else if (form.backgroundLogo && file === form.backgroundLogo) {
              formDataToSend.backgroundLogo = {
                key: key,
                url: url,
              };
            }
          } 
        });
      }

      if (!form.background && form.backgroundPreview && !form.backgroundPreview.startsWith('blob:')) {
        const values = selectedWallConfig || initialValues;
        formDataToSend.background = {
          key: values.background?.key || "",
          url: form.backgroundPreview,
        };
      }

      if (!form.backgroundLogo && form.backgroundLogoPreview && !form.backgroundLogoPreview.startsWith('blob:')) {
       const values = selectedWallConfig || initialValues;
        formDataToSend.backgroundLogo = {
          key: values.backgroundLogo?.key || "",
          url: form.backgroundLogoPreview,
        };
      }

      await onSubmit(formDataToSend, editMode);

      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      showMessage(error.message || "Failed to save wall configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderMediaPreview = (mediaType) => {
    const previewKey = mediaType === 'background' ? 'backgroundPreview' : 'backgroundLogoPreview';
    const preview = form[previewKey];
    const file = form[mediaType];

    if (!preview) return null;

    const isVideo = file?.type?.startsWith('video/') || preview.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i);

    return (
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isVideo ? (
          <video
            src={preview}
            style={{
              width: mediaType === 'background' ? "100px" : "80px",
              height: mediaType === 'background' ? "60px" : "80px",
              borderRadius: 4,
              objectFit: "cover",
            }}
            muted
            controls
          />
        ) : (
          <img
            src={preview}
            alt={`${mediaType} preview`}
            style={{
              width: mediaType === 'background' ? "100px" : "80px",
              height: mediaType === 'background' ? "60px" : "80px",
              borderRadius: 4,
              objectFit: "cover",
            }}
          />
        )}
        <IconButton
          size="small"
          color="error"
          onClick={() => handleRemoveMedia(mediaType)}
        >
          <ICONS.delete fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={loading}
      >
        <DialogTitle>
          {editMode ? t.dialogTitleUpdate : t.dialogTitleCreate}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              {/* Basic Fields */}
              <TextField
                label={t.name}
                name="name"
                value={form.name}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
              />

              <TextField
                label={t.slug}
                name="slug"
                value={form.slug}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.slug}
                helperText={errors.slug}
                disabled={loading}
              />

              <FormControl fullWidth error={!!errors.mode} disabled={loading}>
                <InputLabel>{t.mode}</InputLabel>
                <Select
                  name="mode"
                  value={form.mode}
                  label={t.mode}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="mosaic">{t.mosaic}</MenuItem>
                  <MenuItem value="card">{t.card}</MenuItem>
                  <MenuItem value="bubble">{t.bubble}</MenuItem>
                </Select>
              </FormControl>

              {/* Background Upload */}
              <Box>
                <input
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  id="background-upload"
                  type="file"
                  name="background"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <label htmlFor="background-upload">
                  <Button
                    ref={backgroundButtonRef}
                    variant="outlined"
                    component="span"
                    disabled={loading}
                    sx={getStartIconSpacing(dir)}
                  >
                    {t.uploadBackground}
                  </Button>
                </label>
                {errors.background && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                    {errors.background}
                  </Typography>
                )}
                {renderMediaPreview('background')}
              </Box>

              {/* Logo Upload */}
              <Box>
                <input
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  id="logo-upload"
                  type="file"
                  name="backgroundLogo"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <label htmlFor="logo-upload">
                  <Button
                    ref={logoButtonRef}
                    variant="outlined"
                    component="span"
                    disabled={loading}
                    sx={getStartIconSpacing(dir)}
                  >
                    {t.uploadLogo}
                  </Button>
                </label>
                {errors.backgroundLogo && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                    {errors.backgroundLogo}
                  </Typography>
                )}
                {renderMediaPreview('backgroundLogo')}
              </Box>

              {form.mode === "mosaic" ? (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label={t.mosaicRows}
                    name="mosaicRows"
                    type="number"
                    value={form.mosaicRows}
                    onChange={handleInputChange}
                    error={!!errors.mosaicRows}
                    helperText={errors.mosaicRows}
                    disabled={loading}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                  <TextField
                    label={t.mosaicCols}
                    name="mosaicCols"
                    type="number"
                    value={form.mosaicCols}
                    onChange={handleInputChange}
                    error={!!errors.mosaicCols}
                    helperText={errors.mosaicCols}
                    disabled={loading}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Box>
              ) : (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.randomSizes}
                        onChange={handleInputChange}
                        name="randomSizes"
                        disabled={loading}
                      />
                    }
                    label={t.enableRandomSizes}
                  />

                  {form.randomSizes && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label={t.minSize}
                        name="minSize"
                        type="number"
                        value={form.minSize}
                        onChange={handleInputChange}
                        error={!!errors.minSize}
                        helperText={errors.minSize}
                        disabled={loading}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                      <TextField
                        label={t.maxSize}
                        name="maxSize"
                        type="number"
                        value={form.maxSize}
                        onChange={handleInputChange}
                        error={!!errors.maxSize}
                        helperText={errors.maxSize}
                        disabled={loading}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Box>
                  )}
                </>
              )}

              {form.mode === "card" && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t.cardOrder}</InputLabel>
                    <Select
                      name="cardOrder"
                      value={form.cardOrder}
                      label={t.cardOrder}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <MenuItem value="sequential">{t.sequentialOrder}</MenuItem>
                      <MenuItem value="random">{t.randomOrder}</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>{t.inputType}</InputLabel>
                    <Select
                      name="cardInputType"
                      value={form.cardInputType}
                      label={t.inputType}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <MenuItem value="text">{t.textInput}</MenuItem>
                      <MenuItem value="signature">{t.signatureInput}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={onClose}
              disabled={loading}
              startIcon={<ICONS.close fontSize="small" />}
              sx={getStartIconSpacing(dir)}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <ICONS.save fontSize="small" />}
              sx={getStartIconSpacing(dir)}
            >
              {loading 
                ? (editMode ? t.updating : t.creating)
                : (editMode ? t.update : t.create)
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirm.open}
        title={deleteConfirm.mediaType === 'background' ? t.deleteBackgroundTitle : t.deleteLogoTitle}
        message={deleteConfirm.mediaType === 'background' ? t.deleteBackgroundMessage : t.deleteLogoMessage}
        confirmButtonText={t.deleteConfirm}
        confirmButtonIcon={<ICONS.delete />}
        onClose={() => setDeleteConfirm({ open: false, mediaType: null, mediaUrl: null })}
        onConfirm={confirmDeleteMedia}
      />
    </>
  );
};

export default WallConfigModal;