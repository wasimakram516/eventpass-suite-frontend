"use client";

import { useEffect, useRef } from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    uploadFile: "Upload File",
    uploadHelperText: "Optional: Attach media files (Image, Video, or PDF) to include with your message",
  },
  ar: {
    uploadFile: "رفع ملف",
    uploadHelperText: "اختياري: يمكنك إرفاق ملفات الوسائط (صورة أو فيديو أو PDF) لتضمينها مع رسالتك",
  },
};

/**
 * Optional file attachment for a notification. Shared by the bulk and single
 * notification modals.
 *
 * @param {object} props
 * @param {File|null} props.file - The attached file, or null
 * @param {(file: File|null) => void} props.onChange - Called with the chosen file, or null when removed
 * @returns {JSX.Element}
 */
const AttachmentPicker = ({ file, onChange }) => {
  const { t, dir } = useI18nLayout(translations);
  const inputRef = useRef(null);

  // Clear the hidden input when the parent drops the file (for example after closing the modal).
  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = "";
  }, [file]);

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept="*/*"
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          if (chosen) onChange(chosen);
        }}
        style={{ display: "none" }}
      />
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Button
          variant="outlined"
          onClick={() => inputRef.current?.click()}
          size="small"
          startIcon={<ICONS.upload />}
          sx={getStartIconSpacing(dir)}
        >
          {t.uploadFile}
        </Button>
        {file && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {file.name}
            </Typography>
            <IconButton size="small" onClick={() => onChange(null)} color="error">
              <ICONS.close />
            </IconButton>
          </Stack>
        )}
      </Stack>
      <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
        {t.uploadHelperText}
      </Typography>
    </Box>
  );
};

export default AttachmentPicker;
