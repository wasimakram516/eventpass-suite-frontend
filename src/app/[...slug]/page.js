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
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Movie as VideoIcon,
  CloudOff as CloudOffIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getFileBySlug } from "@/services/fileResourceService";

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

  const icon = isPdf ? (
    <PdfIcon sx={{ fontSize: 28, color: "error.main", ml: 1 }} />
  ) : isImage ? (
    <ImageIcon sx={{ fontSize: 28, color: "primary.main", ml: 1 }} />
  ) : isVideo ? (
    <VideoIcon sx={{ fontSize: 28, color: "secondary.main", ml: 1 }} />
  ) : (
    <FileIcon sx={{ fontSize: 28, color: "text.secondary", ml: 1 }} />
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
        <FileIcon sx={{ fontSize: 80, color: "text.secondary" }} />
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
            {icon}
            {file.title || "File"}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{ mt: { xs: 1, sm: 0 } }}
        >
          {t.download}
        </Button>
      </Box>
    </Box>
  );
}
