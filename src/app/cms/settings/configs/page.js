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
  Paper,
  Grid,
  IconButton,
  Tooltip,
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
import { useTheme, useMediaQuery } from "@mui/material";
import LoadingState from "@/components/LoadingState";

const translations = {
  en: {
    title: "Global Configuration",
    subtitle: "Manage all global settings below.",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    saveChanges: "Save Changes",
    save: "Save",
    saving: "Saving...",
    creating: "Creating...",
    cancel: "Cancel",
    deleteConfirmTitle: "Delete Configuration?",
    deleteConfirmMsg:
      "Are you sure you want to move this item to the Recycle Bin?",
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
    clientLogosSection: "Client Logos",
    addClientLogos: "Add Client Logos",
    clearAllLogos: "Clear All Logos",
    willClearAll: "Will Clear All (toggle off?)",
    nameOptional: "Client Name (optional)",
    websiteOptional: "Website (optional)",
    remove: "Remove",
  },
  ar: {
    title: "الإعدادات العامة",
    subtitle: "قم بإدارة جميع الإعدادات العامة أدناه.",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    saveChanges: "حفظ التغييرات",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    creating: "جارٍ الإنشاء...",
    cancel: "إلغاء",
    deleteConfirmTitle: "حذف الإعدادات؟",
    deleteConfirmMsg:
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
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
    clientLogosSection: "شعارات العملاء",
    addClientLogos: "إضافة شعارات العملاء",
    clearAllLogos: "حذف جميع الشعارات",
    willClearAll: "سيتم حذف الكل (تعطيل؟)",
    nameOptional: "اسم العميل (اختياري)",
    websiteOptional: "الموقع (اختياري)",
    remove: "إزالة",
  },
};

export default function GlobalConfigPage() {
  const { showMessage } = useMessage();
  const { refetchConfig } = useGlobalConfig();
  const { dir, align, t } = useI18nLayout(translations);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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

    // client logos + controls
    clientLogos: [], // array of { _id?, name, website, logoUrl, file? }
    removeLogoIds: [],
    clearAllClientLogos: false,

    // removal flags for single media
    removeCompanyLogo: false,
    removeBrandingMedia: false,
    removePoweredByMedia: false,
  });

  const isVideo = (url) => {
    if (!url || typeof url !== "string") return false;
    const exts = [
      ".mp4",
      ".webm",
      ".ogg",
      ".mov",
      ".avi",
      ".mkv",
      ".wmv",
      ".flv",
    ];
    const clean = url.split("?")[0].toLowerCase();
    return exts.some((ext) => clean.endsWith(ext));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getGlobalConfig();
      const cfg =
        res && typeof res === "object" && "data" in res ? res.data : res;

      if (!cfg) {
        setConfig(null);
        return;
      }

      setConfig(cfg);
      setLoading(false);
      setForm((prev) => ({
        ...prev,
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
        clientLogos: Array.isArray(cfg.clientLogos)
          ? cfg.clientLogos.map((l) => ({
              _id: l._id,
              name: l.name || "",
              website: l.website || "",
              logoUrl: l.logoUrl || "",
            }))
          : [],
        removeLogoIds: [],
        clearAllClientLogos: false,
        removeCompanyLogo: false,
        removeBrandingMedia: false,
        removePoweredByMedia: false,
        companyLogoFile: null,
        brandingMediaFile: null,
        poweredByMediaFile: null,
      }));
    })();
  }, []);

  const handleDelete = async () => {
    await deleteGlobalConfig();
    setConfig(null);
    refetchConfig();
  };

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

  const handleFileChange = (e, fileKey, previewKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileKey === "companyLogoFile" && !file.type.startsWith("image/")) {
      showMessage("Please select an image file for logo", "error");
      return;
    }
    if (
      (fileKey === "brandingMediaFile" || fileKey === "poweredByMediaFile") &&
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      showMessage("Please select an image or video file", "error");
      return;
    }

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

  const normalizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  // Client logos
  const handleAddClientLogos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map((file) => ({
      name: "",
      website: "",
      logoUrl: URL.createObjectURL(file),
      file,
    }));

    setForm((prev) => ({
      ...prev,
      clientLogos: [...prev.clientLogos, ...newItems],
    }));
  };

  const handleLogoFieldChange = (index, key, value) => {
    setForm((prev) => {
      const arr = [...prev.clientLogos];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, clientLogos: arr };
    });
  };

  const handleRemoveClientLogo = (index) => {
    setForm((prev) => {
      const arr = [...prev.clientLogos];
      const removed = arr.splice(index, 1)[0];
      const removeLogoIds = [...prev.removeLogoIds];
      if (removed && removed._id) removeLogoIds.push(removed._id);
      return { ...prev, clientLogos: arr, removeLogoIds };
    });
  };

  const handleClearAllClientLogos = () => {
    setForm((prev) => ({
      ...prev,
      clearAllClientLogos: !prev.clearAllClientLogos,
    }));
  };

  // Single-media removals
  const handleRemoveCompanyLogo = () => {
    setForm((prev) => ({
      ...prev,
      companyLogoUrl: "",
      companyLogoFile: null,
      removeCompanyLogo: true,
    }));
  };

  const handleRemoveBrandingMedia = () => {
    setForm((prev) => ({
      ...prev,
      brandingMediaUrl: "",
      brandingMediaFile: null,
      removeBrandingMedia: true,
    }));
  };

  const handleRemovePoweredByMedia = () => {
    setForm((prev) => ({
      ...prev,
      poweredBy: { ...prev.poweredBy, mediaUrl: "" },
      poweredByMediaFile: null,
      removePoweredByMedia: true,
    }));
  };

  // Save
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

    if (form.removeCompanyLogo) formData.append("removeCompanyLogo", "true");
    if (form.removeBrandingMedia)
      formData.append("removeBrandingMedia", "true");
    if (form.removePoweredByMedia)
      formData.append("removePoweredByMedia", "true");

    if (form.clearAllClientLogos) {
      formData.append("clearAllClientLogos", "true");
    } else {
      const meta = [];
      form.clientLogos.forEach((item) => {
        if (item.file) {
          formData.append("clientLogos", item.file);
          meta.push({ name: item.name || "", website: item.website || "" });
        }
      });
      if (meta.length) {
        formData.append("clientLogosMeta", JSON.stringify(meta));
      }
    }

    if (form.removeLogoIds && form.removeLogoIds.length) {
      formData.append("removeLogoIds", JSON.stringify(form.removeLogoIds));
    }

    const hasNewFiles = form.clientLogos.some((l) => !!l.file);

    if (!form.clearAllClientLogos && !hasNewFiles) {
      const removeSet = new Set((form.removeLogoIds || []).map(String));
      const reordered = (form.clientLogos || [])
        .filter((l) => !removeSet.has(String(l._id)))
        .map((l) => ({
          _id: l._id,
          name: l.name || "",
          website: l.website || "",
          logoUrl: l.logoUrl || "",
        }));

      if (reordered.length) {
        formData.append("reorderClientLogos", JSON.stringify(reordered));
      }
    }

    const updated = config
      ? await updateGlobalConfig(formData)
      : await createGlobalConfig(formData);

    const saved =
      updated && typeof updated === "object" && "data" in updated
        ? updated.data
        : updated;

    if (saved && !updated?.error) {
      setConfig(saved);
      setForm((prev) => ({
        ...prev,
        companyLogoUrl: saved.companyLogoUrl || "",
        brandingMediaUrl: saved.brandingMediaUrl || "",
        poweredBy: {
          ...prev.poweredBy,
          mediaUrl: saved.poweredBy?.mediaUrl || "",
        },
        clientLogos: Array.isArray(saved.clientLogos)
          ? saved.clientLogos.map((l) => ({
              _id: l._id,
              name: l.name || "",
              website: l.website || "",
              logoUrl: l.logoUrl || "",
            }))
          : [],
        companyLogoFile: null,
        brandingMediaFile: null,
        poweredByMediaFile: null,
        removeCompanyLogo: false,
        removeBrandingMedia: false,
        removePoweredByMedia: false,
        removeLogoIds: [],
        clearAllClientLogos: false,
      }));
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
              flexDirection: { xs: "column-reverse", sm: "row" },
              "& > *": { marginLeft: { xs: 0, sm: undefined } },
              gap: { xs: 2, sm: 2 },
            }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{
                ...getStartIconSpacing(dir),
                width: { xs: "100%", sm: "auto" },
              }}
              onClick={() => setConfirmDeleteOpen(true)}
              fullWidth
            >
              {t.delete}
            </Button>

            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                ...getStartIconSpacing(dir),
                width: { xs: "100%", sm: "auto" },
                ml: { xs: "0 !important", sm: undefined },
              }}
              onClick={() => setOpenEdit(true)}
              fullWidth
            >
              {t.edit}
            </Button>
          </Stack>
        )}
      </Box>

      <Divider />

      {loading ? (
        <LoadingState />
      ) : !config ? (
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
            <ListItemText
              primary={t.appName}
              secondary={config?.appName}
              sx={{ textAlign: align }}
            />
          </ListItem>
          <Divider />

          {/* Contact */}
          <ListSubheader>{t.contact}</ListSubheader>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText
              secondary={config?.contact?.email}
              sx={{ textAlign: align }}
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <PhoneIcon />
            </ListItemIcon>
            <ListItemText
              secondary={config?.contact?.phone}
              sx={{ textAlign: align }}
            />
          </ListItem>
          <Divider />

          {/* Support */}
          <ListSubheader>{t.support}</ListSubheader>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText
              secondary={config?.support?.email}
              sx={{ textAlign: align }}
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <PhoneIcon />
            </ListItemIcon>
            <ListItemText
              secondary={config?.support?.phone}
              sx={{ textAlign: align }}
            />
          </ListItem>
          <Divider />

          {/* Powered By */}
          <ListSubheader>{t.poweredBy}</ListSubheader>
          <ListItem
            sx={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}
          >
            <ListItemText
              secondary={config?.poweredBy?.text || t.none}
              sx={{ textAlign: align }}
            />
            {config?.poweredBy?.mediaUrl &&
              (isVideo(config?.poweredBy?.mediaUrl) ? (
                <Box
                  component="video"
                  src={config?.poweredBy?.mediaUrl}
                  controls
                  sx={{
                    width: { xs: "100%", md: 200 },
                    height: { xs: 140, md: 200 },
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Avatar
                  src={config?.poweredBy?.mediaUrl}
                  variant="square"
                  sx={{
                    width: { xs: "100%", md: 200 },
                    height: { xs: 120, md: 200 },
                  }}
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
                sx={{
                  width: { xs: "100%", md: 200 },
                  height: { xs: 140, md: 200 },
                }}
              />
            ) : (
              <Typography color="text.secondary">{t.none}</Typography>
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
                  sx={{
                    width: { xs: "100%", md: 200 },
                    height: { xs: 140, md: 200 },
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Avatar
                  src={config?.brandingMediaUrl}
                  alt="Branding"
                  variant="square"
                  sx={{
                    width: { xs: "100%", md: 200 },
                    height: { xs: 140, md: 200 },
                  }}
                />
              )
            ) : (
              <Typography color="text.secondary">{t.none}</Typography>
            )}
          </ListItem>
          <Divider />

          {/* Client Logos */}
          <ListSubheader>
            {t.clientLogosSection || "Client Logos"}
          </ListSubheader>

          {!config?.clientLogos?.length ? (
            <ListItem>
              <ListItemText secondary={t.none} sx={{ textAlign: align }} />
            </ListItem>
          ) : (
            <ListItem disableGutters sx={{ px: 2 }}>
              <Grid container spacing={2}>
                {config.clientLogos.map((cl, idx) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={cl._id || idx}>
                    <Stack
                      spacing={0.5}
                      alignItems="center"
                      sx={{ width: "100%" }}
                    >
                      {/* logo tile */}
                      <Box
                        sx={{
                          width: "100%",
                          height: 80,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          bgcolor: "background.default",
                        }}
                      >
                        <Box
                          component="img"
                          src={cl.logoUrl}
                          alt={cl.name || "logo"}
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </Box>

                      {/* meta (only shown if present) */}
                      {(cl.name || cl.website) && (
                        <Stack spacing={0} sx={{ width: "100%" }}>
                          {cl.name ? (
                            <Typography
                              variant="caption"
                              noWrap
                              title={cl.name}
                              sx={{ textAlign: align }}
                            >
                              {cl.name}
                            </Typography>
                          ) : null}

                          {cl.website ? (
                            <Typography
                              component="a"
                              href={normalizeUrl(cl.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              noWrap
                              sx={{
                                textDecoration: "underline",
                                color: "blue",
                                textAlign: align,
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                display: "inline-block",
                              }}
                            >
                              {cl.website}
                            </Typography>
                          ) : null}
                        </Stack>
                      )}
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </ListItem>
          )}
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
                      primary={
                        <Typography
                          component="a"
                          href={config.socialLinks[key]}
                          target="_blank"
                          sx={{
                            textDecoration: "underline",
                            color: "blue",
                            textAlign: align,
                          }}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </Box>
              ) : null
            )}
        </List>
      )}

      {/* EDIT / CREATE DIALOG */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="md"
      >
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

            {/* Company Logo */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems="center"
              spacing={2}
            >
              <Avatar
                src={form.companyLogoUrl}
                variant="square"
                sx={{
                  width: { xs: "100%", md: 160 },
                  height: { xs: 120, md: 160 },
                }}
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {t.uploadLogo}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) =>
                      handleFileChange(e, "companyLogoFile", "companyLogoUrl")
                    }
                  />
                </Button>
                {form.companyLogoUrl && (
                  <Button
                    color="error"
                    variant="text"
                    onClick={handleRemoveCompanyLogo}
                  >
                    {t.remove}
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Branding Media */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems="center"
              spacing={2}
            >
              {form.brandingMediaUrl &&
                (form.brandingMediaFile?.type?.startsWith("video/") ||
                (!form.brandingMediaFile && isVideo(form.brandingMediaUrl)) ? (
                  <Box
                    component="video"
                    src={form.brandingMediaUrl}
                    controls
                    sx={{
                      width: { xs: "100%", md: 160 },
                      height: { xs: 120, md: 160 },
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Avatar
                    src={form.brandingMediaUrl}
                    alt=""
                    variant="square"
                    sx={{
                      width: { xs: "100%", md: 160 },
                      height: { xs: 120, md: 160 },
                    }}
                  />
                ))}
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {t.uploadBranding}
                  <input
                    type="file"
                    accept="image/*,video/*,.gif"
                    hidden
                    onChange={(e) =>
                      handleFileChange(
                        e,
                        "brandingMediaFile",
                        "brandingMediaUrl"
                      )
                    }
                  />
                </Button>
                {form.brandingMediaUrl && (
                  <Button
                    color="error"
                    variant="text"
                    onClick={handleRemoveBrandingMedia}
                  >
                    {t.remove}
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Powered By Media */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems="center"
              spacing={2}
            >
              {form.poweredBy.mediaUrl &&
                (form.poweredByMediaFile?.type?.startsWith("video/") ||
                (!form.poweredByMediaFile &&
                  isVideo(form.poweredBy.mediaUrl)) ? (
                  <Box
                    component="video"
                    src={form.poweredBy.mediaUrl}
                    controls
                    sx={{
                      width: { xs: "100%", md: 160 },
                      height: { xs: 120, md: 160 },
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Avatar
                    src={form.poweredBy.mediaUrl}
                    alt=""
                    variant="square"
                    sx={{
                      width: { xs: "100%", md: 160 },
                      height: { xs: 120, md: 160 },
                    }}
                  />
                ))}
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {t.uploadPoweredBy}
                  <input
                    type="file"
                    accept="image/*,video/*,.gif"
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
                {form.poweredBy.mediaUrl && (
                  <Button
                    color="error"
                    variant="text"
                    onClick={handleRemovePoweredByMedia}
                  >
                    {t.remove}
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Client Logos */}
            <Divider />
            <Typography variant="subtitle2">{t.clientLogosSection}</Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Button
                variant="outlined"
                component="label"
                sx={{ width: { xs: "100%", sm: "auto" } }}
                disabled={form.clearAllClientLogos}
              >
                {t.addClientLogos}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleAddClientLogos}
                />
              </Button>
              <Button
                variant={form.clearAllClientLogos ? "contained" : "outlined"}
                color="error"
                onClick={handleClearAllClientLogos}
              >
                {form.clearAllClientLogos ? t.willClearAll : t.clearAllLogos}
              </Button>
            </Stack>

            {/* make rows scroll if many */}
            <Stack
              spacing={2}
              sx={{ maxHeight: { xs: 420, md: 360 }, overflow: "auto", pr: 1 }}
            >
              {form.clientLogos.length === 0 && (
                <Typography color="text.secondary">{t.none}</Typography>
              )}

              {form.clientLogos.map((item, idx) => (
                <Paper
                  key={item._id || `new-${idx}`}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 1.5 }}
                >
                  <Grid container spacing={1.5} alignItems="center">
                    {/* thumbnail */}
                    <Grid item xs={12} sm="auto">
                      <Avatar
                        src={item.logoUrl}
                        variant="square"
                        sx={{ width: 72, height: 72 }}
                      />
                    </Grid>

                    {/* name */}
                    <Grid item xs={12} sm={4} md={4}>
                      <TextField
                        size="small"
                        fullWidth
                        label={t.nameOptional}
                        value={item.name}
                        onChange={(e) =>
                          handleLogoFieldChange(idx, "name", e.target.value)
                        }
                      />
                    </Grid>

                    {/* website */}
                    <Grid item xs={12} sm={6} md={6}>
                      <TextField
                        size="small"
                        fullWidth
                        label={t.websiteOptional}
                        value={item.website}
                        onChange={(e) =>
                          handleLogoFieldChange(idx, "website", e.target.value)
                        }
                      />
                    </Grid>

                    {/* remove button */}
                    <Grid item xs={12} sm="auto">
                      <Tooltip title={t.remove}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveClientLogo(idx)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 1,
            px: { xs: 3, sm: 2 },
          }}
        >
          <Button
            disabled={loading}
            startIcon={<ICONS.cancel />}
            onClick={() => setOpenEdit(false)}
            sx={{ ...getStartIconSpacing(dir) }}
            variant="outlined"
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
            sx={{ ...getStartIconSpacing(dir) }}
          >
            {loading
              ? config
                ? t.saving
                : t.creating
              : config
              ? isMobile
                ? t.save
                : t.saveChanges
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
