"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getFileBySlug } from "@/services/fileResourceService";
import ICONS from "@/utils/iconUtil";

export default function FileDownloadPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;

  const { t, dir } = useI18nLayout({
    en: {
      fileNotFound: "File Not Found",
      fileRemoved:
        "The file you’re trying to access may have been removed or expired.",
      loading: "Loading...",
      download: "Download File",
      preview: "File Preview",
    },
    ar: {
      fileNotFound: "الملف غير موجود",
      fileRemoved:
        "الملف الذي تحاول الوصول إليه قد تمت إزالته أو انتهت صلاحيته.",
      loading: "جارٍ التحميل...",
      download: "تنزيل الملف",
      preview: "معاينة الملف",
    },
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const res = await getFileBySlug(slug);
        if (!res || !res.fileUrl) {
          setError("File not found or has been removed.");
          return;
        }
        setFile(res);
      } catch (err) {
        console.error(err);
        setError("File not found or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchFile();
  }, [slug]);

  // ========== Loading State ==========
  if (loading)
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );

  // ========== Error / Not Found ==========
  if (error)
    return (
      <Container
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
        }}
        dir={dir}
      >
        <Card
          elevation={4}
          sx={{
            width: "100%",
            textAlign: "center",
            borderRadius: 3,
            p: 4,
          }}
        >
          <CardContent>
            <CloudOffIcon sx={{ fontSize: 80, color: "error.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {t.fileNotFound}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.fileRemoved}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );

  // ========== Success View ==========
  const isImage = file?.contentType?.startsWith("image/");
  const isPdf = file?.contentType === "application/pdf";
  const isVideo = file?.contentType?.startsWith("video/");

  const fileIcon = isPdf ? (
    <ICONS.pdf sx={{ fontSize: 40, color: "error.main" }} />
  ) : isImage ? (
    <ICONS.image sx={{ fontSize: 40, color: "primary.main" }} />
  ) : isVideo ? (
    <ICONS.video sx={{ fontSize: 40, color: "secondary.main" }} />
  ) : (
    <ICONS.files sx={{ fontSize: 40, color: "text.secondary" }} />
  );

  const preview = (() => {
    if (isImage)
      return (
        <Box
          component="img"
          src={file.fileUrl}
          alt={file.title}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 2,
          }}
        />
      );
    if (isVideo)
      return (
        <video
          controls
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "10px",
            background: "#000",
          }}
          src={file.fileUrl}
        />
      );
    if (isPdf)
      return (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(
            file.fileUrl
          )}&embedded=true`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "10px",
          }}
        ></iframe>
      );
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ICONS.files sx={{ fontSize: 80, color: "text.secondary" }} />
      </Box>
    );
  })();

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.fileUrl;
    link.download = file.title || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 40px)",
        backgroundColor: "#fafafa",
      }}
      dir={dir}
    >
      {/* ===== File Preview Area ===== */}
      <Box
        sx={{
          flexGrow: 1,
          mt: 4,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#00000005",
        }}
      >
        {preview}
      </Box>

      {/* ===== Footer Section ===== */}
      <Box
        sx={{
          borderTop: "1px solid #ddd",
          p: 1,
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="text.primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            {fileIcon}
            {file.title || "File"}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<ICONS.download />}
          onClick={handleDownload}
          sx={{ mt: { xs: 1, sm: 0 } }}
        >
          {t.download}
        </Button>
      </Box>
    </Box>
  );
}
