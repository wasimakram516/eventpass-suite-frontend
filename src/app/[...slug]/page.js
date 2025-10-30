"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
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
      fileRemoved: "الملف الذي تحاول الوصول إليه قد تمت إزالته أو انتهت صلاحيته.",
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
        if (!res || !res.fileUrl) throw new Error("File not found");
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
    <PdfIcon sx={{ fontSize: 80, color: "error.main" }} />
  ) : isImage ? (
    <ImageIcon sx={{ fontSize: 80, color: "primary.main" }} />
  ) : isVideo ? (
    <VideoIcon sx={{ fontSize: 80, color: "secondary.main" }} />
  ) : (
    <FileIcon sx={{ fontSize: 80, color: "text.secondary" }} />
  );

  const preview = (() => {
    if (isImage)
      return (
        <Box
          component="img"
          src={file.fileUrl}
          alt={file.title}
          sx={{
            maxWidth: "100%",
            borderRadius: 2,
            boxShadow: 2,
            mt: 3,
          }}
        />
      );
    if (isVideo)
      return (
        <Box sx={{ mt: 3 }}>
          <video
            controls
            style={{ width: "100%", borderRadius: "10px" }}
            src={file.fileUrl}
          />
        </Box>
      );
    if (isPdf)
      return (
        <Box sx={{ mt: 3 }}>
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              file.fileUrl
            )}&embedded=true`}
            style={{
              width: "100%",
              height: "500px",
              border: "none",
              borderRadius: "10px",
            }}
          ></iframe>
        </Box>
      );
    return null;
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
    <Container
      maxWidth="md"
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
          {icon}
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 2 }}>
            {file.title || "File"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 2 }}
          >
            {t.preview}
          </Typography>

          {preview}

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mt: 3 }}
          >
            {t.download}
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
