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
import { createDisplayMedia } from "@/services/memorywall/displayMediaService";
import { getWallConfigBySlug } from "@/services/memorywall/wallConfigService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LoadingState from "@/components/LoadingState";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import Footer from "@/components/nav/Footer";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import { useMessage } from "@/contexts/MessageContext";

const translations = {
  en: {
    capturePhoto: "Capture Your Photo",
    startCamera: "Start Camera",
    accessingCamera: "Accessing Camera...",
    stopCamera: "Stop Camera",
    switchCamera: "Switch Camera",
    singleCameraOnly: "Only one camera is available on this device.",
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
    switchCamera: "تبديل الكاميرا",
    singleCameraOnly: "تتوفر كاميرا واحدة فقط على هذا الجهاز.",
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
  const { showMessage } = useMessage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");
  const [mode, setMode] = useState(null);
  const [wallConfig, setWallConfig] = useState(null);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);

  useEffect(() => {
    const loadWallConfigs = async () => {
      const response = await getWallConfigBySlug(slug);
      const config = response;
      setWallConfig(config);
      setMode(config.mode);
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

  const startCamera = async (facingMode = cameraFacingMode) => {
    setIsLoading(true);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const [videoTrack] = mediaStream.getVideoTracks();
      const detectedFacingMode =
        videoTrack?.getSettings?.().facingMode || facingMode;

      setStream(mediaStream);
      setCameraFacingMode(detectedFacingMode);
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);

      return detectedFacingMode;
    } catch (error) {
      console.error("Failed to access camera:", error);
      showMessage("Unable to access camera", "error");
      setCameraOn(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = async () => {
    const currentFacingMode = cameraFacingMode;
    const nextFacingMode = currentFacingMode === "user" ? "environment" : "user";
    const activeFacingMode = await startCamera(nextFacingMode);

    if (activeFacingMode && activeFacingMode === currentFacingMode) {
      showMessage(t.singleCameraOnly, "info");
    }
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
      if (!context) return;

      const isFrontCamera = cameraFacingMode === "user";

      // Preserve native orientation from the video stream.
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (isFrontCamera) {
        context.save();
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();
      } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
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

    if (!wallConfig?.business?.slug) {
      showMessage("Business information is missing", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const file = capturedImage instanceof File
        ? capturedImage
        : new File([capturedImage], "captured-image.jpg", { type: "image/jpeg" });

      setShowUploadProgress(true);
      const uploads = [{
        file,
        label: "Image",
        percent: 0,
        loaded: 0,
        total: file.size,
        error: null,
        url: null,
      }];

      setUploadProgress(uploads);

      const urls = await uploadMediaFiles({
        files: [file],
        businessSlug: wallConfig.business.slug,
        moduleName: "MemoryWall",
        wallSlug: slug,
        onProgress: (progressUploads) => {
          progressUploads.forEach((progressUpload, index) => {
            if (uploads[index]) {
              uploads[index].percent = progressUpload.percent;
              uploads[index].loaded = progressUpload.loaded;
              uploads[index].total = progressUpload.total;
              uploads[index].error = progressUpload.error;
              uploads[index].url = progressUpload.url;
            }
          });
          setUploadProgress([...uploads]);
        },
      });

      setShowUploadProgress(false);

      if (urls && urls.length > 0) {
        await createDisplayMedia({
          imageUrl: urls[0],
          text: mode === "card" ? text.trim() : "",
          slug: slug,
        });

        setTimeout(() => {
          setCapturedImage(null);
          setText("");
        }, 3000);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showMessage(error.message || "Failed to upload image", "error");
      setShowUploadProgress(false);
    } finally {
      setIsSubmitting(false);
    }
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

            {/* Camera Flip Button */}
            <Button
              variant="contained"
              size="small"
              onClick={toggleCamera}
              disabled={isLoading}
              startIcon={<ICONS.cameraSwitch />}
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 10,
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
            >
              {t.switchCamera}
            </Button>

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
                transform: cameraFacingMode === "user" ? "scaleX(-1)" : "none",
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
      <MediaUploadProgress
        open={showUploadProgress}
        uploads={uploadProgress}
        onClose={() => setShowUploadProgress(false)}
        allowClose={false}
      />
    </Container>
  );
}
