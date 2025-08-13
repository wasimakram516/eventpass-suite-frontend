"use client";
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Divider,
  List,
  ListSubheader,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

import {
  Settings as SettingsIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import {
  getGlobalConfig,
  updateGlobalConfig,
  createGlobalConfig,
  deleteGlobalConfig,
} from "@/services/globalConfigService";
import { useMessage } from "@/contexts/MessageContext";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Global Configuration",
    subtitle: "Manage all global settings below.",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    save: "Save Changes",
    saving: "Saving...",
    creating: "Creating...",
    cancel: "Cancel",
    deleteConfirmTitle: "Delete Configuration?",
    deleteConfirmMsg:
      "Are you sure you want to delete the global configuration? This action cannot be undone.",
    deleteConfirmBtn: "Delete",
    noConfig: "No configuration found.",
    appName: "App Name",
    contact: "Contact",
    support: "Support",
    poweredBy: "Powered By",
    companyLogo: "Company Logo",
    brandingMedia: "Branding Media",
    socialLinks: "Social Links",
    contactEmail: "Contact Email",
    contactPhone: "Contact Phone",
    supportEmail: "Support Email",
    supportPhone: "Support Phone",
    poweredByText: "Powered By Text",
    uploadLogo: "Upload Logo",
    uploadBranding: "Upload Branding",
    uploadPoweredBy: "Upload Powered By",
    none: "None",
    socialLinksSection: "Social Links",
    mediaUploadsSection: "Media Uploads",
  },
  ar: {
    title: "الإعدادات العامة",
    subtitle: "قم بإدارة جميع الإعدادات العامة أدناه.",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    save: "حفظ التغييرات",
    saving: "جارٍ الحفظ...",
    creating: "جارٍ الإنشاء...",
    cancel: "إلغاء",
    deleteConfirmTitle: "حذف الإعدادات؟",
    deleteConfirmMsg:
      "هل أنت متأكد من حذف الإعدادات العامة؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteConfirmBtn: "حذف",
    noConfig: "لا توجد إعدادات.",
    appName: "اسم التطبيق",
    contact: "الاتصال",
    support: "الدعم",
    poweredBy: "برعاية",
    companyLogo: "شعار الشركة",
    brandingMedia: "وسائط العلامة",
    socialLinks: "روابط التواصل",
    contactEmail: "بريد الاتصال",
    contactPhone: "هاتف الاتصال",
    supportEmail: "بريد الدعم",
    supportPhone: "هاتف الدعم",
    poweredByText: "نص برعاية",
    uploadLogo: "تحميل الشعار",
    uploadBranding: "تحميل الوسائط",
    uploadPoweredBy: "تحميل وسائط برعاية",
    none: "لا يوجد",
    socialLinksSection: "روابط التواصل الاجتماعي",
    mediaUploadsSection: "تحميل الوسائط",
  },
};

export default function GlobalConfigPage() {
  const { showMessage } = useMessage();
  const { refetchConfig } = useGlobalConfig();
  const { dir, align, t } = useI18nLayout(translations);

  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [form, setForm] = useState({
    appName: "",
    contact: { email: "", phone: "" },
    support: { email: "", phone: "" },
    poweredBy: { text: "", mediaUrl: "" },
    socialLinks: { facebook: "", instagram: "", linkedin: "", website: "" },
    companyLogoUrl: "",
    brandingMediaUrl: "",
    companyLogoFile: null,
    brandingMediaFile: null,
    poweredByMediaFile: null,
  });

  // Helper
  const isVideo = (url) => /\.(mp4|mov|webm|ogg)$/i.test(url);

  // Load config
  useEffect(() => {
    (async () => {
      const res = await getGlobalConfig();
      const cfg =
        res && typeof res === "object" && "data" in res ? res.data : res;

      if (!cfg) {
        setConfig(null); // no record -> show Create button
        return;
      }

      setConfig(cfg);
      setForm({
        appName: cfg.appName || "",
        contact: {
          email: cfg.contact?.email || "",
          phone: cfg.contact?.phone || "",
        },
        support: {
          email: cfg.support?.email || "",
          phone: cfg.support?.phone || "",
        },
        poweredBy: {
          text: cfg.poweredBy?.text || "",
          mediaUrl: cfg.poweredBy?.mediaUrl || "",
        },
        socialLinks: {
          facebook: cfg.socialLinks?.facebook || "",
          instagram: cfg.socialLinks?.instagram || "",
          linkedin: cfg.socialLinks?.linkedin || "",
          website: cfg.socialLinks?.website || "",
        },
        companyLogoUrl: cfg.companyLogoUrl || "",
        brandingMediaUrl: cfg.brandingMediaUrl || "",
      });
    })();
  }, []);

  // Delete handler
  const handleDelete = async () => {
    await deleteGlobalConfig();
    setConfig(null);
    refetchConfig();
  };

  // Field change
  const handleChange = (e, section) => {
    const { name, value } = e.target;
    if (section) {
      setForm((prev) => ({
        ...prev,
        [section]: { ...prev[section], [name]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // File pick & preview
  const handleFileChange = (e, fileKey, previewKey) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);

    if (previewKey === "poweredBy.mediaUrl") {
      setForm((prev) => ({
        ...prev,
        poweredBy: { ...prev.poweredBy, mediaUrl: preview },
        poweredByMediaFile: file,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [fileKey]: file,
        [previewKey]: preview,
      }));
    }
  };

  // Save (create or update)
  const handleSave = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (form.contact.email && !emailRegex.test(form.contact.email)) {
      return showMessage(
        t.invalidContactEmail || "Invalid contact email",
        "error"
      );
    }

    if (form.support.email && !emailRegex.test(form.support.email)) {
      return showMessage(
        t.invalidSupportEmail || "Invalid support email",
        "error"
      );
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("appName", form.appName);
    formData.append("contactEmail", form.contact.email);
    formData.append("contactPhone", form.contact.phone);
    formData.append("supportEmail", form.support.email);
    formData.append("supportPhone", form.support.phone);
    formData.append("poweredByText", form.poweredBy.text);
    formData.append("facebook", form.socialLinks.facebook);
    formData.append("instagram", form.socialLinks.instagram);
    formData.append("linkedin", form.socialLinks.linkedin);
    formData.append("website", form.socialLinks.website);

    if (form.companyLogoFile)
      formData.append("companyLogo", form.companyLogoFile);
    if (form.brandingMediaFile)
      formData.append("brandingMedia", form.brandingMediaFile);
    if (form.poweredByMediaFile)
      formData.append("poweredByMedia", form.poweredByMediaFile);

    const updated = config
      ? await updateGlobalConfig(formData)
      : await createGlobalConfig(formData);

    const saved =
      updated && typeof updated === "object" && "data" in updated
        ? updated.data
        : updated;

    if (saved && !updated?.error) {
      setConfig(saved);
      refetchConfig();
    }

    setOpenEdit(false);
    setLoading(false);
  };

  return (
    <Container dir={dir}>
      <BreadcrumbsNav />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.subtitle}
          </Typography>
        </Box>
        {config && (
          <Stack
            direction="row"
            spacing={2}
            sx={{
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "space-between", sm: "flex-end" },
            }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={getStartIconSpacing(dir)}
              onClick={() => setConfirmDeleteOpen(true)}
              fullWidth
            >
              {t.delete}
            </Button>

            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={getStartIconSpacing(dir)}
              onClick={() => setOpenEdit(true)}
              fullWidth
            >
              {t.edit}
            </Button>
          </Stack>
        )}
      </Box>

      <Divider />

      {!config ? (
        <Box textAlign="center" py={4}>
          <Typography sx={{ mb: 4 }}>{t.noConfig}</Typography>
          <Button
            startIcon={<ICONS.add />}
            sx={getStartIconSpacing(dir)}
            variant="contained"
            onClick={() => setOpenEdit(true)}
          >
            {t.create}
          </Button>
        </Box>
      ) : (
        <List sx={{ mt: 2, bgcolor: "background.paper" }}>
          {/* App Name */}
          <ListItem>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t.appName} secondary={config?.appName} />
          </ListItem>
          <Divider />

          {/* Contact */}
          <ListSubheader>{t.contact}</ListSubheader>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText secondary={config?.contact?.email} />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <PhoneIcon />
            </ListItemIcon>
            <ListItemText secondary={config?.contact?.phone} />
          </ListItem>
          <Divider />

          {/* Support */}
          <ListSubheader>{t.support}</ListSubheader>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText secondary={config?.support?.email} />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <PhoneIcon />
            </ListItemIcon>
            <ListItemText secondary={config?.support?.phone} />
          </ListItem>
          <Divider />

          {/* Powered By */}
          <ListSubheader>{t.poweredBy}</ListSubheader>
          <ListItem>
            <ListItemText secondary={config?.poweredBy?.text || t.none} />
            {config?.poweredBy?.mediaUrl &&
              (isVideo(config?.poweredBy?.mediaUrl) ? (
                <Box
                  component="video"
                  src={config?.poweredBy?.mediaUrl}
                  controls
                  width={100}
                />
              ) : (
                <Avatar
                  src={config?.poweredBy?.mediaUrl}
                  variant="square"
                  sx={{ width: 80, height: 80 }}
                />
              ))}
          </ListItem>
          <Divider />

          {/* Company Logo */}
          <ListSubheader>{t.companyLogo}</ListSubheader>
          <ListItem>
            {config?.companyLogoUrl ? (
              <Avatar
                src={config?.companyLogoUrl}
                variant="square"
                sx={{ width: 80, height: 80 }}
              />
            ) : (
              <Typography color="text.secondary">None</Typography>
            )}
          </ListItem>
          <Divider />

          {/* Branding Media */}
          <ListSubheader>{t.brandingMedia}</ListSubheader>
          <ListItem>
            {config?.brandingMediaUrl ? (
              isVideo(config?.brandingMediaUrl) ? (
                <Box
                  component="video"
                  src={config?.brandingMediaUrl}
                  controls
                  width={100}
                />
              ) : (
                <Box
                  component="img"
                  src={config?.brandingMediaUrl}
                  alt="Branding"
                  width={100}
                />
              )
            ) : (
              <Typography color="text.secondary">{t.none}</Typography>
            )}
          </ListItem>
          <Divider />

          {/* Social Links */}
          <ListSubheader>{t.socialLinks}</ListSubheader>
          {config?.socialLinks &&
            [
              { key: "facebook", icon: <FacebookIcon /> },
              { key: "instagram", icon: <InstagramIcon /> },
              { key: "linkedin", icon: <LinkedInIcon /> },
              { key: "website", icon: <LanguageIcon /> },
            ].map(({ key, icon }) =>
              config.socialLinks?.[key] ? (
                <Box key={key}>
                  <ListItem>
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText
                      primary={config.socialLinks[key]}
                      component="a"
                      href={config.socialLinks[key]}
                      target="_blank"
                    />
                  </ListItem>
                  <Divider component="li" />
                </Box>
              ) : null
            )}
        </List>
      )}

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
        <DialogTitle>{config ? "Edit" : "Create"} Configuration</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label={t.appName}
              name="appName"
              value={form.appName}
              onChange={(e) => handleChange(e)}
            />

            <TextField
              fullWidth
              label={t.contactEmail}
              name="contactEmail"
              value={form.contact.email}
              onChange={(e) =>
                handleChange(
                  { target: { name: "email", value: e.target.value } },
                  "contact"
                )
              }
            />
            <TextField
              fullWidth
              label={t.contactPhone}
              name="contactPhone"
              value={form.contact.phone}
              onChange={(e) =>
                handleChange(
                  { target: { name: "phone", value: e.target.value } },
                  "contact"
                )
              }
            />

            <TextField
              fullWidth
              label={t.supportEmail}
              name="supportEmail"
              value={form.support.email}
              onChange={(e) =>
                handleChange(
                  { target: { name: "email", value: e.target.value } },
                  "support"
                )
              }
            />
            <TextField
              fullWidth
              label={t.supportPhone}
              name="supportPhone"
              value={form.support.phone}
              onChange={(e) =>
                handleChange(
                  { target: { name: "phone", value: e.target.value } },
                  "support"
                )
              }
            />

            <TextField
              fullWidth
              label={t.poweredByText}
              name="poweredByText"
              value={form.poweredBy.text}
              onChange={(e) =>
                handleChange(
                  { target: { name: "text", value: e.target.value } },
                  "poweredBy"
                )
              }
            />

            <Divider />

            <Typography variant="subtitle2">{t.socialLinksSection}</Typography>
            {Object.entries(form.socialLinks).map(([key, val]) => (
              <TextField
                key={key}
                fullWidth
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={val}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    socialLinks: { ...f.socialLinks, [key]: e.target.value },
                  }))
                }
              />
            ))}

            <Divider />

            <Typography variant="subtitle2">{t.mediaUploadsSection}</Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={form.companyLogoUrl}
                variant="square"
                sx={{ width: 64, height: 64 }}
              />
              <Button variant="outlined" component="label">
                {t.uploadLogo}
                <input
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  onChange={(e) =>
                    handleFileChange(e, "companyLogoFile", "companyLogoUrl")
                  }
                />
              </Button>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              {form.brandingMediaUrl &&
                (isVideo(form.brandingMediaUrl) ? (
                  <Box
                    component="video"
                    src={form.brandingMediaUrl}
                    controls
                    width={80}
                  />
                ) : (
                  <Box
                    component="img"
                    src={form.brandingMediaUrl}
                    alt=""
                    width={80}
                  />
                ))}
              <Button variant="outlined" component="label">
                {t.uploadBranding}
                <input
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  onChange={(e) =>
                    handleFileChange(e, "brandingMediaFile", "brandingMediaUrl")
                  }
                />
              </Button>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              {form.poweredBy.mediaUrl &&
                (isVideo(form.poweredBy.mediaUrl) ? (
                  <Box
                    component="video"
                    src={form.poweredBy.mediaUrl}
                    controls
                    width={80}
                  />
                ) : (
                  <Box
                    component="img"
                    src={form.poweredBy.mediaUrl}
                    alt=""
                    width={80}
                  />
                ))}

              <Button variant="outlined" component="label">
                {t.uploadPoweredBy}
                <input
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  onChange={(e) =>
                    handleFileChange(
                      e,
                      "poweredByMediaFile",
                      "poweredBy.mediaUrl"
                    )
                  }
                />
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={loading}
            startIcon={<ICONS.cancel />}
            onClick={() => setOpenEdit(false)}
            sx={getStartIconSpacing(dir)}
          >
            {t.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ICONS.save />
              )
            }
            sx={getStartIconSpacing(dir)}
          >
            {loading
              ? config
                ? t.saving
                : t.creating
              : config
              ? t.save
              : t.create}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmationDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          await handleDelete();
          setConfirmDeleteOpen(false);
        }}
        title={t.deleteConfirmTitle}
        message={t.deleteConfirmMsg}
        confirmButtonText={t.deleteConfirmBtn}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
