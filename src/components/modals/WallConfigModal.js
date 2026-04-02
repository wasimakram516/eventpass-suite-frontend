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
  Slider,
  Popover,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
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
    logoOverlayEnabled: "Enable Logo Overlay",
    logoOpacity: "Logo Opacity (%)",
    stampOnImages: "Stamp logo on every image",
    logoStampPosition: "Logo Stamp Position",
    positions: {
      topLeft: "Top Left",
      topRight: "Top Right",
      bottomLeft: "Bottom Left",
      bottomRight: "Bottom Right",
    },
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
    cardRandomColors: "Random Card Colors",
    cardBackgroundColor: "Card Background Color",
    imageShape: "Image Shape",
    circle: "Circle",
    top70: "Top 70%",
    fullCard: "Full Card",
    mediaType: "Media Type",
    type1: "Media Type 1",
    type2: "Media Type 2",
    type1Desc: "Image with optional text",
    type2Desc: "Text with optional signature",
    mediaType2TextColor: "Text Color",
    mediaType2SignatureColor: "Signature Color",
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
    logoOverlayEnabled: "تفعيل تراكب الشعار",
    logoOpacity: "شفافية الشعار (%)",
    stampOnImages: "وضع الشعار على كل صورة",
    logoStampPosition: "موضع الشعار على الصورة",
    positions: {
      topLeft: "أعلى اليسار",
      topRight: "أعلى اليمين",
      bottomLeft: "أسفل اليسار",
      bottomRight: "أسفل اليمين",
    },
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
    mediaType: "نوع الوسائط",
    type1: "نوع الوسائط 1",
    type2: "نوع الوسائط 2",
    type1Desc: "صورة مع نص اختياري",
    type2Desc: "نص مع توقيع اختياري",
    mediaType2TextColor: "لون النص",
    mediaType2SignatureColor: "لون التوقيع",
  },
};

const WallConfigModal = ({
  open,
  onClose,
  editMode = false,
  initialValues = {},
  selectedWallConfig = null,
  onSubmit,
  onMediaDeleted,
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
    logoOverlayEnabled: false,
    logoOpacity: 100,
    stampOnImages: false,
    logoStampPosition: "bottom-right",
    cardBackgroundColor: "#ffffff",
    cardRandomColors: false,
    cardImageShape: "circle",
    cardMediaType: "type1",
    mediaType2TextColor: "#000000",
    mediaType2SignatureColor: "#000000",
  });
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [textColorAnchorEl, setTextColorAnchorEl] = useState(null);
  const [signatureColorAnchorEl, setSignatureColorAnchorEl] = useState(null);

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
        logoOverlayEnabled: false,
        logoOpacity: 100,
        stampOnImages: false,
        logoStampPosition: "bottom-right",
        cardBackgroundColor: "#ffffff",
        cardRandomColors: false,
        cardImageShape: "circle",
        cardMediaType: "type1",
        mediaType2TextColor: "#000000",
        mediaType2SignatureColor: "#000000",
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
        logoOverlayEnabled: values.backgroundLogo?.overlayEnabled || false,
        logoOpacity: values.backgroundLogo?.opacity ?? 100,
        stampOnImages: values.backgroundLogo?.stampOnImages || false,
        logoStampPosition: values.backgroundLogo?.stampPosition || "bottom-right",
        cardBackgroundColor: values.cardSettings?.backgroundColor || "#ffffff",
        cardRandomColors: values.cardSettings?.randomColors || false,
        cardImageShape: values.cardSettings?.imageShape || "circle",
        cardMediaType: values.cardSettings?.mediaType || "type1",
        mediaType2TextColor: values.cardSettings?.mediaType2TextColor || "#000000",
        mediaType2SignatureColor: values.cardSettings?.mediaType2SignatureColor || "#000000",
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
        const responseData = await deleteMedia({
          fileUrl: mediaUrl,
          wallConfigId: currentWallConfigId,
          mediaType,
          storageType: "s3",
        });

        if (onMediaDeleted && responseData?.data) {
          onMediaDeleted(responseData.data);
        }

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
          backgroundColor: form.cardBackgroundColor || "#ffffff",
          randomColors: form.cardRandomColors || false,
          imageShape: form.cardImageShape || "circle",
          mediaType: form.cardMediaType || "type1",
          mediaType2TextColor: form.mediaType2TextColor || "#000000",
          mediaType2SignatureColor: form.mediaType2SignatureColor || "#000000",
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
                overlayEnabled: form.logoOverlayEnabled,
                opacity: form.logoOpacity,
                stampOnImages: form.stampOnImages,
                stampPosition: form.logoStampPosition,
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
          overlayEnabled: form.logoOverlayEnabled,
          opacity: form.logoOpacity,
          stampOnImages: form.stampOnImages,
          stampPosition: form.logoStampPosition,
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

              {form.backgroundLogoPreview && (
                <Box sx={{ border: '1px solid #eee', p: 1.5, borderRadius: 1, backgroundColor: '#fafafa' }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    Logo Settings
                  </Typography>

                  <Box sx={{ px: 1, mb: 1, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t.logoOpacity}: {form.logoOpacity}%
                    </Typography>
                    <Slider
                      value={form.logoOpacity}
                      onChange={(e, val) => handleInputChange({ target: { name: 'logoOpacity', value: val } })}
                      min={0}
                      max={100}
                      size="small"
                      disabled={loading}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.logoOverlayEnabled}
                        onChange={handleInputChange}
                        name="logoOverlayEnabled"
                        disabled={loading}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">{t.logoOverlayEnabled}</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.stampOnImages}
                        onChange={handleInputChange}
                        name="stampOnImages"
                        disabled={loading}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">{t.stampOnImages}</Typography>}
                  />

                  {form.stampOnImages && (
                    <FormControl fullWidth size="small" disabled={loading} sx={{ mt: 1 }}>
                      <InputLabel id="stamp-position-label">{t.logoStampPosition}</InputLabel>
                      <Select
                        labelId="stamp-position-label"
                        name="logoStampPosition"
                        value={form.logoStampPosition}
                        label={t.logoStampPosition}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="top-left">{t.positions.topLeft}</MenuItem>
                        <MenuItem value="top-right">{t.positions.topRight}</MenuItem>
                        <MenuItem value="bottom-left">{t.positions.bottomLeft}</MenuItem>
                        <MenuItem value="bottom-right">{t.positions.bottomRight}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>
              )}

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
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <TextField
                        label={t.minSize}
                        name="minSize"
                        type="number"
                        value={form.minSize}
                        onChange={handleInputChange}
                        error={!!errors.minSize}
                        helperText={errors.minSize}
                        disabled={loading}
                        size="small"
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
                        size="small"
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Box>
                  )}

                  {form.mode === "card" && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.cardRandomColors}
                            onChange={handleInputChange}
                            name="cardRandomColors"
                            disabled={loading}
                          />
                        }
                        label={t.cardRandomColors}
                      />
                      {!form.cardRandomColors && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            onClick={(e) => !loading && setColorAnchorEl(e.currentTarget)}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '6px',
                              backgroundColor: form.cardBackgroundColor,
                              border: '2px solid #ddd',
                              cursor: loading ? 'default' : 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              '&:hover': {
                                transform: loading ? 'none' : 'scale(1.05)',
                                borderColor: '#2196f3',
                              },
                              transition: 'all 0.2s',
                              flexShrink: 0
                            }}
                          />
                          <TextField
                            size="small"
                            value={form.cardBackgroundColor}
                            onChange={(e) => handleInputChange({ target: { name: 'cardBackgroundColor', value: e.target.value } })}
                            disabled={loading}
                            sx={{ width: 90 }}
                            inputProps={{ 
                              style: { 
                                fontFamily: 'monospace', 
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                padding: '4px 8px'
                              } 
                            }}
                          />
                          <Popover
                            open={Boolean(colorAnchorEl)}
                            anchorEl={colorAnchorEl}
                            onClose={() => setColorAnchorEl(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            PaperProps={{ sx: { p: 2, borderRadius: 2, boxShadow: 6 } }}
                          >
                            <Box sx={{ "& .react-colorful": { width: '200px', height: '200px' } }}>
                              <HexColorPicker 
                                color={form.cardBackgroundColor} 
                                onChange={(color) => handleInputChange({ target: { name: 'cardBackgroundColor', value: color } })} 
                              />
                              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                                {["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50"].map((pColor) => (
                                  <Box
                                    key={pColor}
                                    onClick={() => handleInputChange({ target: { name: 'cardBackgroundColor', value: pColor } })}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '4px',
                                      backgroundColor: pColor,
                                      cursor: 'pointer',
                                      border: '1px solid #ddd',
                                      '&:hover': { transform: 'scale(1.2)' }
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Popover>
                        </Box>
                      )}
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
                    <InputLabel>{t.imageShape}</InputLabel>
                    <Select
                      name="cardImageShape"
                      value={form.cardImageShape}
                      label={t.imageShape}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <MenuItem value="circle">{t.circle}</MenuItem>
                      <MenuItem value="top-70">{t.top70}</MenuItem>
                      <MenuItem value="full">{t.fullCard}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {form.mode === "card" && (
                <Box sx={{ mt: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t.mediaType}</InputLabel>
                    <Select
                      name="cardMediaType"
                      value={form.cardMediaType}
                      label={t.mediaType}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <MenuItem value="type1">
                        <Box>
                          <Typography variant="body2">{t.type1}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.type1Desc}</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="type2">
                        <Box>
                          <Typography variant="body2">{t.type2}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.type2Desc}</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {form.mode === "card" && form.cardMediaType === "type2" && (
                <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" gutterBottom>{t.mediaType2TextColor}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => !loading && setTextColorAnchorEl(e.currentTarget)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '6px',
                          backgroundColor: form.mediaType2TextColor,
                          border: '2px solid #ddd',
                          cursor: loading ? 'default' : 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          '&:hover': {
                            transform: loading ? 'none' : 'scale(1.05)',
                            borderColor: '#2196f3',
                          },
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      />
                      <TextField
                        size="small"
                        value={form.mediaType2TextColor}
                        onChange={(e) => handleInputChange({ target: { name: 'mediaType2TextColor', value: e.target.value } })}
                        disabled={loading}
                        sx={{ width: 90 }}
                        inputProps={{ 
                          style: { 
                            fontFamily: 'monospace', 
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                          } 
                        }}
                      />
                      <Popover
                        open={Boolean(textColorAnchorEl)}
                        anchorEl={textColorAnchorEl}
                        onClose={() => setTextColorAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        PaperProps={{ sx: { p: 2, borderRadius: 2, boxShadow: 6 } }}
                      >
                        <Box sx={{ "& .react-colorful": { width: '200px', height: '200px' } }}>
                          <HexColorPicker 
                            color={form.mediaType2TextColor} 
                            onChange={(color) => handleInputChange({ target: { name: 'mediaType2TextColor', value: color } })} 
                          />
                          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                            {["#000000", "#ffffff", "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#ffeb3b", "#ff9800"].map((pColor) => (
                              <Box
                                key={pColor}
                                onClick={() => handleInputChange({ target: { name: 'mediaType2TextColor', value: pColor } })}
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '4px',
                                  backgroundColor: pColor,
                                  cursor: 'pointer',
                                  border: '1px solid #ddd',
                                  '&:hover': { transform: 'scale(1.2)' }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Popover>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>{t.mediaType2SignatureColor}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={(e) => !loading && setSignatureColorAnchorEl(e.currentTarget)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '6px',
                          backgroundColor: form.mediaType2SignatureColor,
                          border: '2px solid #ddd',
                          cursor: loading ? 'default' : 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          '&:hover': {
                            transform: loading ? 'none' : 'scale(1.05)',
                            borderColor: '#2196f3',
                          },
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      />
                      <TextField
                        size="small"
                        value={form.mediaType2SignatureColor}
                        onChange={(e) => handleInputChange({ target: { name: 'mediaType2SignatureColor', value: e.target.value } })}
                        disabled={loading}
                        sx={{ width: 90 }}
                        inputProps={{ 
                          style: { 
                            fontFamily: 'monospace', 
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                          } 
                        }}
                      />
                      <Popover
                        open={Boolean(signatureColorAnchorEl)}
                        anchorEl={signatureColorAnchorEl}
                        onClose={() => setSignatureColorAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        PaperProps={{ sx: { p: 2, borderRadius: 2, boxShadow: 6 } }}
                      >
                        <Box sx={{ "& .react-colorful": { width: '200px', height: '200px' } }}>
                          <HexColorPicker 
                            color={form.mediaType2SignatureColor} 
                            onChange={(color) => handleInputChange({ target: { name: 'mediaType2SignatureColor', value: color } })} 
                          />
                          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                            {["#000000", "#ffffff", "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#ffeb3b", "#ff9800"].map((pColor) => (
                              <Box
                                key={pColor}
                                onClick={() => handleInputChange({ target: { name: 'mediaType2SignatureColor', value: pColor } })}
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '4px',
                                  backgroundColor: pColor,
                                  cursor: 'pointer',
                                  border: '1px solid #ddd',
                                  '&:hover': { transform: 'scale(1.2)' }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Popover>
                    </Box>
                  </Box>
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