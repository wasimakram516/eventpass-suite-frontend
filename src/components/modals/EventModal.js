"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import slugify from "@/utils/slugify";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { downloadEmployeeTemplate } from "@/services/checkin/checkinEventService";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    createTitle: "Create Event",
    editTitle: "Edit Event",
    name: "Event Name",
    slug: "Slug",
    startDate: "Start Date",
    endDate: "End Date",
    venue: "Venue",
    description: "Description",
    capacity: "Capacity",
    logo: "Upload Event Logo",
    brandingMedia: "Upload Branding Media",
    currentImage: "Current Logo:",
    preview: "Preview:",
    downloadTemplate: "Download Employee Template",
    uploadEmployee: "Upload Employee Data",
    uploadTables: "Upload Table Images",
    cancel: "Cancel",
    create: "Create Event",
    update: "Save Changes",
    creating: "Creating...",
    updating: "Saving...",
    required: "Please fill all required fields.",
    invalidCapacity: "Capacity must be a positive number.",
    useCustomFields: "Use custom registration fields?",
    switchToClassic: "Switch to Classic Fields",
    switchToCustom: "Switch to Custom Fields",
    fieldLabel: "Field Label",
    inputType: "Input Type",
    options: "Options",
    optionPlaceholder: "Type option and press comma",
    requiredField: "Required",
    visibleField: "Visible",
    remove: "Remove",
    addField: "Add Field",
    classicFieldsNote:
      "Classic registration fields (fullName, email, phone) will be used.",
    textType: "Text",
    emailType: "Email",
    numberType: "Number",
    radioType: "Radio",
    listType: "List",
    downloadTemplateError: "Failed to download template.",
    showQrToggle: "Show QR code after registration?",
    showQrOnBadgeToggle: "Show QR Code on Printed Badge?",
    requiresApprovalToggle: "Require admin approval for registrations?",
    downloadTemplateSuccess: "Template downloaded successfully",
  },
  ar: {
    createTitle: "إنشاء فعالية",
    editTitle: "تعديل الفعالية",
    name: "اسم الفعالية",
    slug: "المعرف",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    venue: "المكان",
    description: "الوصف",
    capacity: "السعة",
    logo: "رفع شعار الفعالية",
    brandingMedia: "رفع الوسائط التسويقية",
    currentImage: "الشعار الحالي:",
    preview: "معاينة:",
    downloadTemplate: "تحميل قالب الموظفين",
    uploadEmployee: "رفع بيانات الموظفين",
    uploadTables: "رفع صور الطاولات",
    cancel: "إلغاء",
    create: "إنشاء فعالية",
    update: "حفظ التغييرات",
    creating: "جارٍ الإنشاء...",
    updating: "جارٍ الحفظ...",
    required: "يرجى تعبئة جميع الحقول المطلوبة.",
    invalidCapacity: "يجب أن تكون السعة رقماً موجباً.",
    useCustomFields: "استخدم حقول التسجيل المخصصة؟",
    switchToClassic: "التحويل إلى الحقول الكلاسيكية",
    switchToCustom: "التحويل إلى الحقول المخصصة",
    fieldLabel: "تسمية الحقل",
    inputType: "نوع الإدخال",
    options: "الخيارات",
    optionPlaceholder: "اكتب الخيار واضغط فاصلة",
    requiredField: "إلزامي",
    visibleField: "مرئي",
    remove: "إزالة",
    addField: "إضافة حقل",
    classicFieldsNote:
      "سيتم استخدام الحقول الكلاسيكية (الاسم الكامل، البريد الإلكتروني، الهاتف).",
    textType: "نص",
    emailType: "البريد الإلكتروني",
    numberType: "رقم",
    radioType: "اختيار",
    listType: "قائمة",
    downloadTemplateError: "فشل في تحميل القالب.",
    showQrToggle: "عرض رمز الاستجابة السريعة بعد التسجيل؟",
    showQrOnBadgeToggle: "عرض رمز QR على بطاقة الطباعة؟",
    requiresApprovalToggle: "يتطلب موافقة المسؤول على التسجيلات؟",
    downloadTemplateSuccess: "تم تحميل القالب بنجاح",
  },
};

const EventModal = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  selectedBusiness,
  isEmployee = false,
}) => {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    startDate: "",
    endDate: "",
    venue: "",
    description: "",
    logo: null,
    logoPreview: "",
    background: null,
    backgroundPreview: "",
    brandingLogos: [], // array of { _id?, name, website, logoUrl, file? }
    removeBrandingLogoIds: [],
    clearAllBrandingLogos: false,
    agenda: null,
    agendaPreview: "",
    capacity: "",
    eventType: isEmployee ? "employee" : "public",
    employeeData: null,
    tableImages: [],
    formFields: [],
    useCustomFields: false,
    showQrAfterRegistration: false,
    showQrOnBadge: true,
    requiresApproval: false,
    defaultLanguage: "en",
  });

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData((prev) => ({
        ...prev,
        name: initialValues.name || "",
        slug: initialValues.slug || "",
        startDate: initialValues.startDate
          ? new Date(initialValues.startDate).toISOString().split("T")[0]
          : "",
        endDate: initialValues.endDate
          ? new Date(initialValues.endDate).toISOString().split("T")[0]
          : "",
        venue: initialValues.venue || "",
        description: initialValues.description || "",
        capacity: initialValues.capacity?.toString() || "",
        eventType:
          initialValues.eventType || (isEmployee ? "employee" : "public"),
        logo: null,
        logoPreview: initialValues.logoUrl || "",
        background: null,
        backgroundPreview: initialValues.backgroundUrl || "",
        brandingLogos: Array.isArray(initialValues.brandingMedia)
          ? initialValues.brandingMedia.map((l) => ({
            _id: l._id,
            name: l.name || "",
            website: l.website || "",
            logoUrl: l.logoUrl || "",
          }))
          : [],
        removeBrandingLogoIds: [],
        clearAllBrandingLogos: false,
        agenda: null,
        agendaPreview: initialValues.agendaUrl || "",
        employeeData: null,
        tableImages: [],
        formFields: (initialValues.formFields || []).map((f) => ({
          ...f,
          _temp: "",
        })),

        useCustomFields: !!initialValues.formFields?.length,
        showQrAfterRegistration:
          initialValues?.showQrAfterRegistration || false,
        showQrOnBadge: initialValues?.showQrOnBadge ?? true,
        requiresApproval: initialValues?.requiresApproval || false,
        defaultLanguage: initialValues?.defaultLanguage || "en",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: "",
        slug: "",
        startDate: "",
        endDate: "",
        venue: "",
        description: "",
        logo: null,
        logoPreview: "",
        background: null,
        backgroundPreview: "",
        brandingLogos: [],
        removeBrandingLogoIds: [],
        clearAllBrandingLogos: false,
        agenda: null,
        agendaPreview: "",
        capacity: "",
        eventType: isEmployee ? "employee" : "public",
        employeeData: null,
        tableImages: [],
        formFields: [],
        useCustomFields: false,
        showQrAfterRegistration: false,
        showQrOnBadge: true,
        requiresApproval: false,
        defaultLanguage: "en",
      }));
    }
  }, [initialValues, isEmployee]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo" && files?.[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({
          ...prev,
          logo: file,
          logoPreview: URL.createObjectURL(file),
        }));
      }
    } else if (name === "background" && files?.[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({
          ...prev,
          background: file,
          backgroundPreview: URL.createObjectURL(file),
        }));
      }
    } else if (name === "agenda" && files?.[0]) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setFormData((prev) => ({
          ...prev,
          agenda: file,
          agendaPreview: file.name,
        }));
      }
    } else if (name === "employeeData" && files?.[0]) {
      setFormData((prev) => ({ ...prev, employeeData: files[0] }));
    } else if (name === "tableImages" && files?.length > 0) {
      setFormData((prev) => ({ ...prev, tableImages: [...files] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddBrandingLogos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map((file, index) => ({
      name: "",
      website: "",
      logoUrl: URL.createObjectURL(file),
      file,
      uniqueKey: `${Date.now()}-${index}-${Math.random()}`,
    }));

    setFormData((prev) => ({
      ...prev,
      brandingLogos: [...prev.brandingLogos, ...newItems],
    }));
    e.target.value = "";
  };

  const handleBrandingLogoFieldChange = (index, key, value) => {
    setFormData((prev) => {
      const arr = [...prev.brandingLogos];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, brandingLogos: arr };
    });
  };

  const handleRemoveBrandingLogo = (index) => {
    setFormData((prev) => {
      const arr = [...prev.brandingLogos];
      const removed = arr.splice(index, 1)[0];
      const removeIds = [...prev.removeBrandingLogoIds];

      if (removed && removed._id) {
        removeIds.push(removed._id);
      }

      return {
        ...prev,
        brandingLogos: arr,
        removeBrandingLogoIds: removeIds,
      };
    });
  };

  const handleClearAllBrandingLogos = () => {
    setFormData((prev) => ({
      ...prev,
      clearAllBrandingLogos: !prev.clearAllBrandingLogos,
    }));
  };
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name, slug: slugify(name) }));
  };

  const handleFormFieldChange = (index, key, value) => {
    const updated = [...formData.formFields];
    updated[index][key] = value;
    setFormData((prev) => ({ ...prev, formFields: updated }));
  };

  const addFormField = () => {
    setFormData((prev) => ({
      ...prev,
      formFields: [
        ...prev.formFields,
        {
          inputName: "",
          inputType: "text",
          values: [],
          required: false,
          visible: true,
          _temp: "",
        },
      ],
    }));
  };

  const removeFormField = (index) => {
    const updated = [...formData.formFields];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, formFields: updated }));
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadEmployeeTemplate();
      showMessage(
        t.downloadTemplateSuccess || "Template downloaded successfully",
        "success"
      );
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.venue
    ) {
      showMessage(t.required, "error");
      return;
    }
    if (
      formData.capacity &&
      (isNaN(formData.capacity) || formData.capacity <= 0)
    ) {
      showMessage(t.invalidCapacity, "error");
      return;
    }
    setLoading(true);
    const payload = new FormData();
    if (!initialValues && selectedBusiness)
      payload.append("businessSlug", selectedBusiness);
    payload.append("name", formData.name);
    payload.append("slug", formData.slug || slugify(formData.name));
    payload.append("startDate", formData.startDate);
    payload.append("endDate", formData.endDate);
    payload.append("venue", formData.venue);
    payload.append("description", formData.description);
    payload.append("capacity", formData.capacity || "999");
    payload.append("eventType", formData.eventType);
    if (formData.logo) payload.append("logo", formData.logo);
    if (formData.background) payload.append("background", formData.background);
    if (formData.clearAllBrandingLogos) {
      payload.append("clearAllBrandingLogos", "true");
    } else {
      const meta = [];
      formData.brandingLogos.forEach((item) => {
        if (item.file) {
          payload.append("brandingMedia", item.file);
          meta.push({ name: item.name || "", website: item.website || "" });
        }
      });
      if (meta.length) {
        payload.append("brandingMediaMeta", JSON.stringify(meta));
      }
    }

    if (initialValues && !formData.clearAllBrandingLogos) {
      const existingBrandingUrls = formData.brandingLogos
        .filter((item) => !item.file && item.logoUrl)
        .map((item) => ({
          name: item.name || "",
          website: item.website || "",
          logoUrl: item.logoUrl,
        }));
      payload.append("brandingMediaUrls", JSON.stringify(existingBrandingUrls));

      if (formData.removeBrandingLogoIds.length > 0) {
        payload.append(
          "removeBrandingLogoIds",
          JSON.stringify(formData.removeBrandingLogoIds)
        );
      }
    }

    if (formData.agenda) payload.append("agenda", formData.agenda);
    if (formData.eventType === "employee") {
      if (formData.employeeData)
        payload.append("employeeData", formData.employeeData);
      formData.tableImages.forEach((file) =>
        payload.append("tableImages", file)
      );
    }
    payload.append("showQrAfterRegistration", formData.showQrAfterRegistration.toString());
    payload.append("showQrOnBadge", formData.showQrOnBadge.toString());
    payload.append("requiresApproval", formData.requiresApproval.toString());
    payload.append("defaultLanguage", formData.defaultLanguage);

    if (formData.eventType === "public" && formData.useCustomFields) {
      payload.append("formFields", JSON.stringify(formData.formFields));
    }
    await onSubmit(payload, !!initialValues);
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir={dir}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
          px: 3,
          pt: 3,
        }}
      >
        <Typography fontWeight="bold" fontSize="1.25rem">
          {initialValues ? t.editTitle : t.createTitle}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            ml: 2,
            alignSelf: "flex-start",
          }}
        >
          <ICONS.close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={`${t.name} *`}
            name="name"
            value={formData.name}
            onChange={handleNameChange}
            fullWidth
          />
          <TextField
            label={t.slug}
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label={`${t.startDate} *`}
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label={`${t.endDate} *`}
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label={`${t.venue} *`}
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label={t.description}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label={t.capacity}
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleInputChange}
            fullWidth
          />

          {/* Show QR After Registration Toggle */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.showQrAfterRegistration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      showQrAfterRegistration: e.target.checked,
                    }))
                  }
                  color="primary"
                />
              }
              label={t.showQrToggle}
              sx={{ alignSelf: "start" }}
            />
          </Box>

          {/* Show QR on Badge Toggle */}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.showQrOnBadge}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      showQrOnBadge: e.target.checked,
                    }))
                  }
                  color="primary"
                />
              }
              label={t.showQrOnBadgeToggle}
              sx={{ alignSelf: "start" }}
            />
          </Box>

          {/* Requires Approval Toggle */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requiresApproval}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiresApproval: e.target.checked,
                    }))
                  }
                  color="primary"
                />
              }
              label={t.requiresApprovalToggle}
              sx={{ alignSelf: "start" }}
            />
          </Box>

          {/* Default Language Selector */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  defaultLanguage: prev.defaultLanguage === "en" ? "ar" : "en",
                }))
              }
              sx={{
                width: 64,
                height: 32,
                borderRadius: 32,
                backgroundColor: "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                cursor: "pointer",
                overflow: "hidden",
                boxShadow: `
        2px 2px 6px rgba(0, 0, 0, 0.15),
        -2px -2px 6px rgba(255, 255, 255, 0.5),
        inset 2px 2px 5px rgba(0, 0, 0, 0.2),
        inset -2px -2px 5px rgba(255, 255, 255, 0.7)
      `,
                position: "relative",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: formData.defaultLanguage === "en" ? "#fff" : "text.secondary",
                  zIndex: 2,
                  transition: "color 0.3s",
                }}
              >
                EN
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: formData.defaultLanguage === "ar" ? "#fff" : "text.secondary",
                  zIndex: 2,
                  transition: "color 0.3s",
                }}
              >
                AR
              </Typography>
              <Box
                sx={{
                  position: "absolute",
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  top: 2,
                  left: formData.defaultLanguage === "ar" ? 34 : 2,
                  backgroundColor: "#1976d2",
                  zIndex: 1,
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                  transition: "left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                }}
              />
            </Box>
          </Box>

          {/* Logo Upload */}
          <Box>
            <Button component="label" variant="outlined">
              {t.logo}
              <input
                hidden
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
              />
            </Button>
            {formData.logoPreview && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {initialValues && !formData.logo ? t.currentImage : t.preview}
                </Typography>
                <img
                  src={formData.logoPreview}
                  alt="Logo preview"
                  style={{ maxHeight: 100, borderRadius: 6 }}
                />
              </Box>
            )}
          </Box>

          {/* Background Upload */}
          <Box>
            <Button component="label" variant="outlined">
              Upload Background Image (optional)
              <input
                hidden
                name="background"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
              />
            </Button>
            {formData.backgroundPreview && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {initialValues && !formData.background
                    ? "Current Background:"
                    : "Preview:"}
                </Typography>
                <img
                  src={formData.backgroundPreview}
                  alt="Background preview"
                  style={{
                    maxHeight: 120,
                    borderRadius: 6,
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}
          </Box>
          {/* Branding Logos Upload and List */}
          <Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                width: { xs: "100%", sm: "auto" },
                mb: 1,
              }}
            >
              <Button
                variant="outlined"
                component="label"
                sx={{ width: { xs: "100%", sm: "auto" } }}
                disabled={formData.clearAllBrandingLogos}
              >
                {t.brandingMedia}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleAddBrandingLogos}
                />
              </Button>
              <Button
                variant={
                  formData.clearAllBrandingLogos ? "contained" : "outlined"
                }
                color="error"
                onClick={handleClearAllBrandingLogos}
              >
                {formData.clearAllBrandingLogos
                  ? t.willClearAll || "Will Clear All (toggle off?)"
                  : t.clearAllLogos || "Clear All Logos"}
              </Button>
            </Box>

            <Box
              sx={{ maxHeight: { xs: 420, md: 360 }, overflow: "auto", pr: 1 }}
            >
              <List disablePadding>
                {formData.brandingLogos.map((item, idx) => (
                  <ListItem
                    key={item.uniqueKey || item._id || `b-${idx}`}
                    disableGutters
                    sx={{ px: 0, mb: 1 }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 1.5, width: "100%" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "stretch", sm: "center" },
                          gap: 1.5,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            flexShrink: 0,
                            alignSelf: { xs: "center", sm: "flex-start" },
                          }}
                        >
                          <img
                            src={item.logoUrl}
                            alt="branding"
                            style={{
                              width: 72,
                              height: 72,
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: 1.5,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              minWidth: { xs: "100%", sm: 120 },
                            }}
                          >
                            <TextField
                              size="small"
                              fullWidth
                              label={t.nameOptional || "Client Name (optional)"}
                              value={item.name}
                              onChange={(e) =>
                                handleBrandingLogoFieldChange(
                                  idx,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                          </Box>
                          <Box
                            sx={{
                              flex: 1.2,
                              minWidth: { xs: "100%", sm: 140 },
                            }}
                          >
                            <TextField
                              size="small"
                              fullWidth
                              label={t.websiteOptional || "Website (optional)"}
                              value={item.website}
                              onChange={(e) =>
                                handleBrandingLogoFieldChange(
                                  idx,
                                  "website",
                                  e.target.value
                                )
                              }
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            flexShrink: 0,
                            alignSelf: { xs: "stretch", sm: "flex-start" },
                          }}
                        >
                          <Tooltip title={t.remove || "Remove"}>
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveBrandingLogo(idx)}
                              size="small"
                              sx={{ width: { xs: "100%", sm: "auto" } }}
                            >
                              <ICONS.delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
          <Box>
            <Button component="label" variant="outlined">
              Upload Agenda (PDF)
              <input
                hidden
                name="agenda"
                type="file"
                accept="application/pdf"
                onChange={handleInputChange}
              />
            </Button>
            {formData.agendaPreview && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {initialValues && !formData.agenda
                    ? "Current Agenda:"
                    : "Selected Agenda:"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.agendaPreview}
                </Typography>
              </Box>
            )}
          </Box>

          {formData.eventType === "employee" && (
            <>
              <Button variant="outlined" onClick={handleDownloadTemplate}>
                {t.downloadTemplate}
              </Button>
              <Box>
                <Typography variant="subtitle2" color="primary">
                  {t.uploadEmployee}
                </Typography>
                <TextField
                  name="employeeData"
                  type="file"
                  inputProps={{ accept: ".csv,.xlsx,.xls" }}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="primary">
                  {t.uploadTables}
                </Typography>
                <TextField
                  name="tableImages"
                  type="file"
                  inputProps={{ accept: "image/*", multiple: true }}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Box>
              {formData.tableImages.length > 0 && (
                <List>
                  {Array.from(formData.tableImages).map((file, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}

          {/* Public Custom Field Toggle */}
          {formData.eventType === "public" && (
            <>
              <Typography variant="subtitle2" color="primary">
                {t.useCustomFields}
              </Typography>
              <Button
                variant="outlined"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    useCustomFields: !prev.useCustomFields,
                  }))
                }
              >
                {formData.useCustomFields
                  ? t.switchToClassic
                  : t.switchToCustom}
              </Button>

              {formData.useCustomFields ? (
                <>
                  {formData.formFields.map((field, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <TextField
                        label={t.fieldLabel}
                        value={field.inputName}
                        onChange={(e) =>
                          handleFormFieldChange(
                            index,
                            "inputName",
                            e.target.value
                          )
                        }
                        fullWidth
                      />

                      <TextField
                        label={t.inputType}
                        select
                        SelectProps={{ native: true }}
                        value={field.inputType}
                        onChange={(e) =>
                          handleFormFieldChange(
                            index,
                            "inputType",
                            e.target.value
                          )
                        }
                        fullWidth
                      >
                        {[
                          { value: "text", label: t.textType },
                          { value: "email", label: t.emailType },
                          { value: "number", label: t.numberType },
                          { value: "radio", label: t.radioType },
                          { value: "list", label: t.listType },
                        ].map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </TextField>

                      {(field.inputType === "radio" ||
                        field.inputType === "list") && (
                          <Box>
                            <Typography variant="subtitle2">
                              {t.options}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              {field.values.map((option, i) => (
                                <Chip
                                  key={i}
                                  label={option}
                                  onDelete={() => {
                                    const updated = [...field.values];
                                    updated.splice(i, 1);
                                    handleFormFieldChange(
                                      index,
                                      "values",
                                      updated
                                    );
                                  }}
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                            <TextField
                              placeholder={t.optionPlaceholder}
                              value={field._temp || ""}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                if (newValue.endsWith(",")) {
                                  const option = newValue.slice(0, -1).trim();
                                  if (option && !field.values.includes(option)) {
                                    const updated = [...field.values, option];
                                    handleFormFieldChange(
                                      index,
                                      "values",
                                      updated
                                    );
                                  }
                                  handleFormFieldChange(index, "_temp", "");
                                } else {
                                  handleFormFieldChange(index, "_temp", newValue);
                                }
                              }}
                              fullWidth
                            />
                          </Box>
                        )}

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.required}
                              onChange={(e) =>
                                handleFormFieldChange(
                                  index,
                                  "required",
                                  e.target.checked
                                )
                              }
                              color="primary"
                            />
                          }
                          label={t.requiredField}
                        />

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.visible}
                              onChange={(e) =>
                                handleFormFieldChange(
                                  index,
                                  "visible",
                                  e.target.checked
                                )
                              }
                              color="primary"
                            />
                          }
                          label={t.visibleField}
                        />

                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          onClick={() => removeFormField(index)}
                        >
                          {t.remove}
                        </Button>
                      </Box>
                    </Box>
                  ))}
                  <Button onClick={addFormField} variant="outlined">
                    {t.addField}
                  </Button>
                </>
              ) : (
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  {t.classicFieldsNote}
                </Typography>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 3, flexDirection: { xs: "column", sm: "row" }, gap: 1 }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          disabled={loading}
          fullWidth
          startIcon={<ICONS.cancel />}
        >
          {t.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <ICONS.save />
            )
          }
          fullWidth
        >
          {loading
            ? initialValues
              ? t.updating
              : t.creating
            : initialValues
              ? t.update
              : t.create}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventModal;
