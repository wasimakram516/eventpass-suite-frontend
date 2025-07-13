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
    date: "Date",
    venue: "Venue",
    description: "Description",
    capacity: "Capacity",
    logo: "Upload Event Logo",
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
  },
  ar: {
    createTitle: "إنشاء فعالية",
    editTitle: "تعديل الفعالية",
    name: "اسم الفعالية",
    slug: "المعرف",
    date: "التاريخ",
    venue: "المكان",
    description: "الوصف",
    capacity: "السعة",
    logo: "رفع شعار الفعالية",
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
  const { t, dir, align } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    date: "",
    venue: "",
    description: "",
    logo: null,
    logoPreview: "",
    capacity: "",
    eventType: isEmployee ? "employee" : "public",
    employeeData: null,
    tableImages: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData((prev) => ({
        ...prev,
        name: initialValues.name || "",
        slug: initialValues.slug || "",
        date: initialValues.date
          ? new Date(initialValues.date).toISOString().split("T")[0]
          : "",
        venue: initialValues.venue || "",
        description: initialValues.description || "",
        capacity: initialValues.capacity?.toString() || "",
        eventType:
          initialValues.eventType || (isEmployee ? "employee" : "public"),
        logo: null,
        logoPreview: initialValues.logoUrl || "",
        employeeData: null,
        tableImages: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: "",
        slug: "",
        date: "",
        venue: "",
        description: "",
        logo: null,
        logoPreview: "",
        capacity: "",
        eventType: isEmployee ? "employee" : "public",
        employeeData: null,
        tableImages: [],
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
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleDownloadTemplate = async () => {
    try {
      const file = await downloadEmployeeTemplate();
      const url = window.URL.createObjectURL(new Blob([file]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employee_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showMessage("Failed to download template.", "error");
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.venue) {
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

    if (!initialValues && selectedBusiness) {
      payload.append("businessSlug", selectedBusiness);
    }

    payload.append("name", formData.name);
    payload.append("slug", formData.slug || slugify(formData.name));
    payload.append("date", formData.date);
    payload.append("venue", formData.venue);
    payload.append("description", formData.description);
    payload.append("capacity", formData.capacity || "999");
    payload.append("eventType", formData.eventType);

    if (formData.logo) payload.append("logo", formData.logo);
    if (formData.eventType === "employee") {
      if (formData.employeeData)
        payload.append("employeeData", formData.employeeData);
      formData.tableImages.forEach((file) =>
        payload.append("tableImages", file)
      );
    }

    try {
      await onSubmit(payload, !!initialValues);
    } catch (err) {
      const msg = err?.message || "Failed to submit event.";
      showMessage(msg, "error");
    } finally {
      setLoading(false);
    }
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
        <Typography variant="body1" sx={{ fontWeight: "bold", fontSize:"1.25rem" }}>
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
            label={`${t.date} *`}
            name="date"
            type="date"
            value={formData.date}
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

          {/* Employee Event Specific Fields */}
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
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          alignItems: "stretch",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          disabled={loading}
          fullWidth
        >
          {t.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
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
