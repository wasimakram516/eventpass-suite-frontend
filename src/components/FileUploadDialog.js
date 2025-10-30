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
} from "@mui/material";
import slugify from "@/utils/slugify";

export default function FileUploadDialog({
  open,
  onClose,
  onSubmit,
  editingFile,
  businessSlug,
}) {
  const [title, setTitle] = useState(editingFile?.title || "");
  const [slug, setSlug] = useState(editingFile?.slug || "");
  const [file, setFile] = useState(null);

  // 🔹 Update slug immediately when title changes
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!editingFile) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("businessSlug", businessSlug);
    if (file) formData.append("file", file);

    console.log("FormData entries:", [...formData.entries()]);

    if (editingFile) {
      await onSubmit(formData, editingFile._id);
    } else {
      await onSubmit(formData);
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        {editingFile ? "Update File" : "Upload New File"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Title"
            value={title}
            onChange={handleTitleChange}
            fullWidth
          />
          <TextField
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            fullWidth
          />
          <input
            type="file"
            accept="*/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ marginTop: 10 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {editingFile ? "Update" : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
