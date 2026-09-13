"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
import slugify from "@/utils/slugify";
import useI18nLayout from "@/hooks/useI18nLayout";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import ICONS from "@/utils/iconUtil";
import { uploadFileResource } from "@/services/fileResourceService";

const getStoredFileName = (fileKey, fileUrl) => {
  const source = fileKey || fileUrl?.split("?")[0];
  if (!source) return "";

  const encodedName = source.split("/").pop() || "";
  try {
    return decodeURIComponent(encodedName).replace(/^\d+_/, "");
  } catch {
    return encodedName.replace(/^\d+_/, "");
  }
};

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
      selectedFile: "Selected file",
      selectFile: "Choose a file",
      replaceFile: "Replace file",
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
      selectedFile: "الملف المحدد",
      selectFile: "اختر ملفًا",
      replaceFile: "استبدال الملف",
    },
  });

  const [title, setTitle] = useState(editingFile?.title || "");
  const [slug, setSlug] = useState(editingFile?.slug || "");
  const [file, setFile] = useState(null);
  const [bypassPreview, setBypassPreview] = useState(
    Boolean(editingFile?.bypassPreview)
  );
  const [loading, setLoading] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const lastUploadProgressRef = useRef(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [showCurrentFile, setShowCurrentFile] = useState(
    Boolean(editingFile?.fileUrl)
  );

  useEffect(() => {
    if (!open) return;

    setTitle(editingFile?.title || "");
    setSlug(editingFile?.slug || "");
    setFile(null);
    setBypassPreview(Boolean(editingFile?.bypassPreview));
    setUploadProgress(null);
    lastUploadProgressRef.current = null;
    setDragOver(false);
    setShowCurrentFile(Boolean(editingFile?.fileUrl));
  }, [open, editingFile]);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!editingFile) {
      setSlug(slugify(newTitle));
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) setFile(selectedFile);
  };

  const handleFileAction = () => {
    if (file) {
      setFile(null);
      return;
    }

    // An existing FileResource cannot be saved without a file. Reveal the
    // replacement dropzone instead of implying that the stored file is deleted.
    setShowCurrentFile(false);
  };

  const handleSubmit = async () => {
    const isUploadingFile = Boolean(file);
    try {
      setLoading(true);
      if (isUploadingFile) {
        const initialProgress = {
          percent: 0,
          loaded: 0,
          total: file.size,
          error: null,
        };
        lastUploadProgressRef.current = initialProgress;
        setUploadProgress(initialProgress);
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("businessSlug", businessSlug);
      formData.append("bypassPreview", String(bypassPreview));

      if (isUploadingFile) {
        const uploadedFile = await uploadFileResource({
          file,
          businessSlug,
          onProgress: (percent, loaded, total) => {
            const nextProgress = {
              percent,
              loaded,
              total,
              error: null,
            };
            lastUploadProgressRef.current = nextProgress;
            setUploadProgress(nextProgress);
          },
        });

        // Match the other upload modals: the progress dialog tracks the S3
        // transfer only, so close it as soon as that transfer has completed.
        setUploadProgress(null);
        formData.append("fileKey", uploadedFile.key);
      }

      if (editingFile) {
        await onSubmit(formData, editingFile._id);
      } else {
        await onSubmit(formData);
      }

      onClose();
    } catch (error) {
      if (isUploadingFile) {
        setUploadProgress({
          ...(lastUploadProgressRef.current || {}),
          percent: lastUploadProgressRef.current?.percent ?? 0,
          loaded: lastUploadProgressRef.current?.loaded ?? 0,
          total: lastUploadProgressRef.current?.total ?? file.size,
          error: error.message || "Upload failed",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = filePreviewUrl || editingFile?.fileUrl;
  const previewName =
    file?.name ||
    getStoredFileName(editingFile?.fileKey, editingFile?.fileUrl) ||
    editingFile?.title;
  const previewContentType = file?.type || editingFile?.contentType || "";
  const isImagePreview = previewContentType.startsWith("image/");
  const hasFilePreview = Boolean(file || showCurrentFile);

  return (
    <>
      <Dialog open={open} onClose={!loading ? onClose : undefined} fullWidth dir={dir}>
        <DialogTitle sx={{ textAlign: align }}>
          {editingFile ? t.updateFile : t.uploadNewFile}
        </DialogTitle>
        <DialogContent sx={{ direction: dir, textAlign: align }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
          {hasFilePreview ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                p: 1,
                pr: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                bgcolor: "background.paper",
                alignSelf: align === "right" ? "flex-end" : "flex-start",
                maxWidth: "100%",
              }}
            >
              {isImagePreview ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt={previewName || t.selectedFile}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    objectFit: "contain",
                    bgcolor: "grey.100",
                  }}
                />
              ) : (
                <ICONS.upload sx={{ fontSize: 28, mx: 0.5, color: "text.secondary" }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {previewName}
              </Typography>
              <IconButton
                onClick={handleFileAction}
                size="small"
                disabled={loading}
                sx={{
                  bgcolor: file ? "error.main" : "primary.main",
                  color: file ? "error.contrastText" : "primary.contrastText",
                  "&:hover": { bgcolor: file ? "error.dark" : "primary.dark" },
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                }}
              >
                {file ? <ICONS.delete sx={{ fontSize: 16 }} /> : <ICONS.edit sx={{ fontSize: 16 }} />}
              </IconButton>
            </Box>
          ) : (
            <>
              <Box
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  handleFileSelect(event.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: "2px dashed",
                  borderColor: dragOver ? "primary.main" : "divider",
                  borderRadius: 3,
                  py: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  cursor: loading ? "default" : "pointer",
                  bgcolor: dragOver ? "action.hover" : "transparent",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}
              >
                <ICONS.upload sx={{ fontSize: 28, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                  {editingFile ? t.replaceFile : t.selectFile}
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  hidden
                  disabled={loading}
                  onChange={(event) => {
                    handleFileSelect(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </Box>
            </>
          )}
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
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : null
            }
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
      <MediaUploadProgress
        open={Boolean(uploadProgress)}
        uploads={
          uploadProgress
            ? [{ ...uploadProgress, label: file?.name || t.selectedFile }]
            : []
        }
        onClose={() => setUploadProgress(null)}
      />
    </>
  );
}
