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
    numberType: "Number",
    radioType: "Radio",
    listType: "List",
    downloadTemplateError: "Failed to download template.",
    showQrToggle: "Show QR code after registration?",
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
    numberType: "رقم",
    radioType: "اختيار",
    listType: "قائمة",
    downloadTemplateError: "فشل في تحميل القالب.",
    showQrToggle: "عرض رمز الاستجابة السريعة بعد التسجيل؟",
    downloadTemplateSuccess: "تم تحميل القالب بنجاح",
  },
};

// Helper function to detect video URLs by file extension
const isVideoUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".mov",
    ".avi",
    ".mkv",
    ".wmv",
    ".flv",
  ];
  const urlWithoutQuery = url.split("?")[0].toLowerCase();
  return videoExtensions.some((ext) => urlWithoutQuery.endsWith(ext));
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

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    startDate: "",
    endDate: "",
    venue: "",
    description: "",
    logo: null,
    logoPreview: "",
    brandingMedia: null,
    brandingPreview: "",
    agenda: null,
    agendaPreview: "",
    capacity: "",
    eventType: isEmployee ? "employee" : "public",
    employeeData: null,
    tableImages: [],
    formFields: [],
    useCustomFields: false,
    showQrAfterRegistration: false,
  });

  const [loading, setLoading] = useState(false);

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
        brandingMedia: null,
        brandingPreview: initialValues.brandingMediaUrl || "",
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
        brandingMedia: null,
        brandingPreview: "",
        agenda: null,
        agendaPreview: "",
        capacity: "",
        eventType: isEmployee ? "employee" : "public",
        employeeData: null,
        tableImages: [],
        formFields: [],
        useCustomFields: false,
        showQrAfterRegistration: false,
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
    } else if (name === "brandingMedia" && files?.[0]) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFormData((prev) => ({
          ...prev,
          brandingMedia: file,
          brandingPreview: URL.createObjectURL(file),
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
    if (formData.brandingMedia)
      payload.append("brandingMedia", formData.brandingMedia);
    if (formData.agenda) payload.append("agenda", formData.agenda);
    if (formData.eventType === "employee") {
      if (formData.employeeData)
        payload.append("employeeData", formData.employeeData);
      formData.tableImages.forEach((file) =>
        payload.append("tableImages", file)
      );
    }
    payload.append(
      "showQrAfterRegistration",
      formData.showQrAfterRegistration.toString()
    );

    if (formData.eventType === "public" && formData.useCustomFields) {
      payload.append("formFields", JSON.stringify(formData.formFields));
    }
    await onSubmit(payload, !!initialValues);
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir={dir}>
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
          <Box>
            <Button component="label" variant="outlined">
              {t.brandingMedia}
              <input
                hidden
                name="brandingMedia"
                type="file"
                accept="image/*,video/*,.gif"
                onChange={handleInputChange}
              />
            </Button>
            {formData.brandingPreview && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {initialValues && !formData.brandingMedia
                    ? isVideoUrl(formData.brandingPreview)
                      ? "Current Branding Video:"
                      : "Current Branding:"
                    : t.preview}
                </Typography>
                {(formData.brandingMedia &&
                  formData.brandingMedia.type.startsWith("video/")) ||
                (!formData.brandingMedia &&
                  isVideoUrl(formData.brandingPreview)) ? (
                  <video
                    src={formData.brandingPreview}
                    controls
                    style={{ maxHeight: 100, borderRadius: 6 }}
                  />
                ) : (
                  <img
                    src={formData.brandingPreview}
                    alt="Branding preview"
                    style={{ maxHeight: 100, borderRadius: 6 }}
                  />
                )}
              </Box>
            )}
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
