"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import { createDisplayMedia } from "@/services/mosaicwall/displayMediaService";
import { getWallConfigBySlug } from "@/services/mosaicwall/wallConfigService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LoadingState from "@/components/LoadingState";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import Footer from "@/components/nav/Footer";

const translations = {
  en: {
    capturePhoto: "Capture Your Photo",
    startCamera: "Start Camera",
    accessingCamera: "Accessing Camera...",
    stopCamera: "Stop Camera",
    preview: "Preview",
    addMessage: "Add a Message",
    messagePlaceholder: "Type your message (shown on the big screen)...",
    charactersCount: "characters",
    capturePhotoBtn: "Capture Photo",
    submitPhoto: "Submit Photo",
    submitPhotoMessage: "Submit Photo & Message",
    uploading: "Uploading...",
    retakePhoto: "Retake Photo",
    instructions: "Instructions:",
    mosaicInstructions:
      "Take a photo and submit it. Your photo will appear on the big screen in the live mosaic.",
    cardInstructions:
      "Take a photo and add a message. Both your image and message will be shown on the big screen.",
  },
  ar: {
    capturePhoto: "التقط صورتك",
    startCamera: "تشغيل الكاميرا",
    accessingCamera: "الوصول إلى الكاميرا...",
    stopCamera: "إيقاف الكاميرا",
    preview: "معاينة",
    addMessage: "أضف رسالة",
    messagePlaceholder: "اكتب رسالتك (ستظهر على الشاشة الكبيرة)...",
    charactersCount: "حرف",
    capturePhotoBtn: "التقاط صورة",
    submitPhoto: "إرسال الصورة",
    submitPhotoMessage: "إرسال الصورة والرسالة",
    uploading: "جاري الرفع...",
    retakePhoto: "إعادة التقاط الصورة",
    instructions: "التعليمات:",
    mosaicInstructions:
      "التقط صورة وأرسلها. ستظهر صورتك على الشاشة الكبيرة في الفسيفساء المباشرة.",
    cardInstructions:
      "التقط صورة وأضف رسالة. ستظهر صورتك ورسالتك على الشاشة الكبيرة.",
  },
};

export default function UploadPage() {
  const { slug } = useParams();
  const { t, dir, align } = useI18nLayout(translations);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    const loadWallConfigs = async () => {
      const response = await getWallConfigBySlug(slug);
      const wallConfig = response;
      setMode(wallConfig.mode);
    };

    loadWallConfigs();
  }, [slug]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setIsLoading(true);
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    setStream(mediaStream);
    setCameraOn(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    }, 100);
    setIsLoading(false);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraOn(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const isLandscape = window.innerWidth > window.innerHeight;

      if (isLandscape) {
        // Normal landscape capture
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
      } else {
        // Portrait mode: rotate canvas
        canvas.width = video.videoHeight;
        canvas.height = video.videoWidth;
        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate((90 * Math.PI) / 180);
        context.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2);
        context.restore();
      }

      canvas.toBlob(
        (blob) => {
          setCapturedImage(blob);
          stopCamera();
        },
        "image/jpeg",
        0.8
      );
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setText("");
  };

  const submitPhoto = async () => {
    if (!capturedImage) return;

    setIsSubmitting(true);

    const result = await createDisplayMedia({
      file: capturedImage,
      text: mode === "card" ? text.trim() : "",
      slug: slug,
    });

    setTimeout(() => {
      setCapturedImage(null);
      setText("");
    }, 3000);
    setIsSubmitting(false);
  };

  return (
    <Container maxWidth="lg" sx={{ minHeight: "100vh", py: 2 }} >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
        dir={dir}
      >
        {/* Title and Mode */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            mt: 2,
            mb: 4,
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {t.capturePhoto}
          </Typography>

          {mode ? (
            <Chip
              label={`${mode} mode`}
              color={mode === "mosaic" ? "primary" : "secondary"}
              sx={{ textTransform: "capitalize", mt: 1 }}
            />
          ) : (
            <LoadingState />
          )}
        </Box>

        {/* Camera Controls */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}>
          {!cameraOn ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={startCamera}
              startIcon={<ICONS.camera />}
              sx={getStartIconSpacing(dir)}
              disabled={isLoading}
            >
              {isLoading ? t.accessingCamera : t.startCamera}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              size="large"
              onClick={stopCamera}
            >
              {t.stopCamera}
            </Button>
          )}
        </Box>

        {/* Live Camera Feed */}
        {cameraOn && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "#000",
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={stopCamera}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.9)" },
              }}
            >
              <ICONS.close fontSize="large" />
            </IconButton>

            {/* Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Capture Button */}
            <Box
              sx={{
                position: "absolute",
                bottom: 30,
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <IconButton
                onClick={capturePhoto}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  bgcolor: "white",
                  color: "black",
                  boxShadow: 6,
                  "&:hover": {
                    bgcolor: "#f5f5f5",
                  },
                }}
              >
                <ICONS.camera fontSize="large" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Preview */}
        {capturedImage && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              width: "100%",
              maxWidth: "800px",
              alignSelf: "center",
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t.preview}
            </Typography>
            <img
              src={URL.createObjectURL(capturedImage)}
              alt="Captured"
              style={{
                width: "100%",
                height: "80vh",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          </Paper>
        )}

        {/* Optional Text */}
        {mode === "card" && capturedImage && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              width: "100%",
              maxWidth: "800px",
              alignSelf: "center",
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t.addMessage}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.messagePlaceholder}
              variant="outlined"
              inputProps={{ maxLength: 200 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block", textAlign: align }}
            >
              {text.length}/200 {t.charactersCount}
            </Typography>
          </Paper>
        )}

        {/* Action Buttons */}
        <Box
          sx={{
            display: { xs: "flex", sm: "flex" },
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
            gap: 2,
            mb: 3,
          }}
        >
          {!capturedImage ? (
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={capturePhoto}
              disabled={isLoading || !cameraOn}
              startIcon={<ICONS.camera />}
              sx={{
                ...getStartIconSpacing(dir),
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {t.capturePhotoBtn}
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                size="large"
                color="success"
                onClick={submitPhoto}
                disabled={isSubmitting || (mode === "card" && !text.trim())}
                startIcon={
                  isSubmitting ? <LoadingState size={20} /> : <ICONS.send />
                }
                sx={{
                  ...getStartIconSpacing(dir),
                  width: { xs: "100%", sm: "auto" },

                }}
              >
                {isSubmitting
                  ? t.uploading
                  : mode === "card"
                    ? t.submitPhotoMessage
                    : t.submitPhoto}
              </Button>

              <Button
                variant="outlined"
                size="large"
                color="warning"
                onClick={retakePhoto}
                disabled={isSubmitting}
                startIcon={<ICONS.refresh />}
                sx={{
                  ...getStartIconSpacing(dir),
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {t.retakePhoto}
              </Button>
            </>
          )}
        </Box>

        {/* Instructions */}
        <Paper

          elevation={1}
          sx={{
            p: 2,
            mt: 3,
            bgcolor: "grey.50",
            mb: { xs: 8, sm: 8 },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>{t.instructions}</strong>
          </Typography>
          {mode ? (
            <Typography variant="body2" color="text.secondary">
              {mode === "mosaic" ? t.mosaicInstructions : t.cardInstructions}
            </Typography>
          ) : (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 50,
              }}
            >
              <LoadingState />
            </Box>
          )}
        </Paper>

        <Footer />
      </Box>
      <LanguageSelector top={10} right={20} />
    </Container>
  );
}
