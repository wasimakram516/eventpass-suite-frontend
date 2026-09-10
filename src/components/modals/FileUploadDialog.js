"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import slugify from "@/utils/slugify";
import useI18nLayout from "@/hooks/useI18nLayout";

export default function FileUploadDialog({
  open,
  onClose,
  onSubmit,
  editingFile,
  businessSlug,
}) {
  const { t, dir, align } = useI18nLayout({
    en: {
      uploadNewFile: "Upload New File",
      updateFile: "Update File",
      title: "Title",
      slug: "Slug",
      cancel: "Cancel",
      upload: "Upload",
      update: "Update",
      uploading: "Uploading...",
      updating: "Updating...",
      bypassPreview: "Open file directly",
      bypassPreviewHelp: "Skip the preview page and let the browser open the file directly.",
    },
    ar: {
      uploadNewFile: "تحميل ملف جديد",
      updateFile: "تحديث الملف",
      title: "العنوان",
      slug: "المعرف (Slug)",
      cancel: "إلغاء",
      upload: "تحميل",
      update: "تحديث",
      uploading: "جارٍ التحميل...",
      updating: "جارٍ التحديث...",
      bypassPreview: "فتح الملف مباشرة",
      bypassPreviewHelp: "تخطي صفحة المعاينة وفتح الملف مباشرة في المتصفح.",
    },
  });

  const [title, setTitle] = useState(editingFile?.title || "");
  const [slug, setSlug] = useState(editingFile?.slug || "");
  const [file, setFile] = useState(null);
  const [bypassPreview, setBypassPreview] = useState(
    Boolean(editingFile?.bypassPreview)
  );
  const [loading, setLoading] = useState(false);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!editingFile) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("businessSlug", businessSlug);
      formData.append("bypassPreview", String(bypassPreview));
      if (file) formData.append("file", file);

      if (editingFile) {
        await onSubmit(formData, editingFile._id);
      } else {
        await onSubmit(formData);
      }

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} fullWidth dir={dir}>
      <DialogTitle sx={{ textAlign: align }}>
        {editingFile ? t.updateFile : t.uploadNewFile}
      </DialogTitle>
      <DialogContent sx={{ direction: dir, textAlign: align }}>
        <Stack spacing={2} sx={{
          mt: 1
        }}>
          <TextField
            label={t.title}
            value={title}
            onChange={handleTitleChange}
            fullWidth
            disabled={loading}
            slotProps={{
              htmlInput: { style: { textAlign: align } }
            }}
          />
          <TextField
            label={t.slug}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            fullWidth
            disabled={loading}
            slotProps={{
              htmlInput: { style: { textAlign: align } }
            }}
          />
          <input
            type="file"
            accept="*/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ marginTop: 10 }}
            disabled={loading}
          />
          <FormControlLabel
            control={
              <Switch
                checked={bypassPreview}
                onChange={(event) => setBypassPreview(event.target.checked)}
                disabled={loading}
              />
            }
            label={t.bypassPreview}
          />
          <Typography variant="caption" color="text.secondary">
            {t.bypassPreviewHelp}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ direction: dir }}>
        <Button onClick={onClose} disabled={loading}>
          {t.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !title || (!editingFile && !file)}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {loading
            ? editingFile
              ? t.updating
              : t.uploading
            : editingFile
            ? t.update
            : t.upload}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
