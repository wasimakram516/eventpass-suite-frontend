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
} from "@mui/material";
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Movie as VideoIcon,
  CloudOff as CloudOffIcon,
} from "@mui/icons-material";
import { getFileBySlug } from "@/services/fileResourceService";

export default function FileDownloadPage() {
  const params = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const res = await getFileBySlug(slug);
        if (!res || !res.fileUrl) throw new Error("File not found");
        setFile(res);

        // ✅ Auto trigger file download once the file is found
        const link = document.createElement("a");
        link.href = res.fileUrl;
        link.download = res.title || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
              File Not Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The file you’re trying to access may have been removed or expired.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );

  // ========== Success / Auto Download View ==========
  const isImage = file?.contentType?.startsWith("image/");
  const isPdf = file?.contentType === "application/pdf";
  const isVideo = file?.contentType?.startsWith("video/");

  const icon = isPdf ? (
    <PdfIcon sx={{ fontSize: 80, color: "error.main" }} />
  ) : isImage ? (
    <ImageIcon sx={{ fontSize: 80, color: "primary.main" }} />
  ) : isVideo ? (
    <MovieIcon sx={{ fontSize: 80, color: "secondary.main" }} />
  ) : (
    <FileIcon sx={{ fontSize: 80, color: "text.secondary" }} />
  );

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
            Downloading your file...
          </Typography>
          <CircularProgress size={26} />
        </CardContent>
      </Card>
    </Container>
  );
}
