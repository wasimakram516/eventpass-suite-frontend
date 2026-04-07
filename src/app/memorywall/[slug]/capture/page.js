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
import SignatureCanvas from "react-signature-canvas";

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
    addSignature: "Add a Signature",
    clearSignature: "Clear Signature",
    signatureRequired: "Signature is required",
    messagePlaceholder: "Type your message (shown on the big screen)...",
    charactersCount: "characters",
    capturePhotoBtn: "Capture Photo",
    submitPhoto: "Submit Photo",
    submitPhotoMessage: "Submit Photo & Message",
    uploading: "Uploading...",
    retakePhoto: "Retake Photo",
    rotatePhoto: "Rotate Photo",
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
    addSignature: "أضف توقيعًا",
    clearSignature: "مسح التوقيع",
    signatureRequired: "التوقيع مطلوب",
    messagePlaceholder: "اكتب رسالتك (ستظهر على الشاشة الكبيرة)...",
    charactersCount: "حرف",
    capturePhotoBtn: "التقاط صورة",
    submitPhoto: "إرسال الصورة",
    submitPhotoMessage: "إرسال الصورة والرسالة",
    uploading: "جاري الرفع...",
    retakePhoto: "إعادة التقاط الصورة",
    rotatePhoto: "تدوير الصورة",
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
  const signaturePadRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [deviceRotation, setDeviceRotation] = useState(0);
  const [lastRotation, setLastRotation] = useState(0);
  const [orientationValues, setOrientationValues] = useState({ beta: 0, gamma: 0 });
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");
  const [mode, setMode] = useState(null);
  const [wallConfig, setWallConfig] = useState(null);
  const [mediaType, setMediaType] = useState("type1");
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const SIGNATURE_EXPORT_SIZE = 256;

  useEffect(() => {
    const loadWallConfigs = async () => {
      const response = await getWallConfigBySlug(slug);
      const config = response;
      setWallConfig(config);
      setMode(config.mode);
      setMediaType(config.cardSettings?.mediaType || "type1");
    };

    loadWallConfigs();
  }, [slug]);

  useEffect(() => {
    const handleDeviceOrientation = (event) => {
      const { beta, gamma } = event;
      setOrientationValues({ beta: beta || 0, gamma: gamma || 0 });

      const absBeta = Math.abs(beta);
      const absGamma = Math.abs(gamma);
      const margin = 20;

      const currentlyVertical = lastRotation === 0;
      let targetVertical = currentlyVertical;

      if (currentlyVertical) {
        if (absGamma > absBeta + margin) targetVertical = false;
      } else {
        if (absBeta > 45 && absGamma < 25) targetVertical = true;
      }

      let rotation = 0;
      if (targetVertical) {
        rotation = 0;
      } else {
        if (lastRotation === 90 || lastRotation === -90) {
          rotation = lastRotation;
        } else {
          rotation = gamma > 0 ? -90 : 90;
        }
      }

      if (rotation !== lastRotation) {
        setLastRotation(rotation);
        setDeviceRotation(rotation);
      }
    };

    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        } catch (error) {}
      } else {
        if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [lastRotation]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (capturedImageUrl) {
        URL.revokeObjectURL(capturedImageUrl);
      }
    };
  }, [stream, capturedImageUrl]);

  const startCamera = async (facingMode = cameraFacingMode) => {
    setIsLoading(true);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          aspectRatio: { ideal: 16/9 }
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
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isFrontCamera = cameraFacingMode === "user";
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const currentRotation = deviceRotation;
    const currentOrientationValues = orientationValues;
    const absBeta = Math.abs(currentOrientationValues.beta);

    if (vw === 0 || vh === 0) {
      showMessage('Camera not ready, please try again', 'error');
      return;
    }

    const rotation = currentRotation;
    const isLandscape = rotation === 90 || rotation === -90;
    const streamIsLandscape = vw > vh;

    const isMobilePortrait = rotation === 0 && absBeta > 45;

    if (isLandscape) {
      canvas.width = streamIsLandscape ? vw : vh;
      canvas.height = streamIsLandscape ? vh : vw;
    } else {
      if (streamIsLandscape) {
        if (isMobilePortrait) {
          canvas.width = vh;
          canvas.height = vw;
        } else {
          canvas.width = vh * 0.75;
          canvas.height = vh;
        }
      } else {
        canvas.width = vw;
        canvas.height = vh;
      }
    }

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);

    let angleDeg = 0;
    if (streamIsLandscape) {
      if (rotation === 90) {
        angleDeg = isFrontCamera ? 0 : 0;
      } else if (rotation === -90) {
        angleDeg = isFrontCamera ? 180 : 180;
      } else if (isMobilePortrait) {
        angleDeg = -90;
      } else {
        angleDeg = 0;
      }
    } else {
      if (rotation === 90) angleDeg = -90;
      else if (rotation === -90) angleDeg = 90;
      else angleDeg = 0;
    }

    ctx.rotate((angleDeg * Math.PI) / 180);

    if (isFrontCamera) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl);
          setCapturedImage(blob);
          setCapturedImageUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = () => {
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
      setCapturedImageUrl(null);
    }
    setCapturedImage(null);
    setText("");
    setSignatureDataUrl("");
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSignatureEnd = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setSignatureDataUrl("");
      return;
    }

    const sourceCanvas = signaturePadRef.current.getCanvas();
    const sourceCtx = sourceCanvas.getContext("2d");
    if (!sourceCtx) {
      setSignatureDataUrl(signaturePadRef.current.toDataURL("image/png"));
      return;
    }

    const { width: sourceWidth, height: sourceHeight } = sourceCanvas;
    const imageData = sourceCtx.getImageData(0, 0, sourceWidth, sourceHeight).data;

    let minX = sourceWidth;
    let minY = sourceHeight;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < sourceHeight; y += 1) {
      for (let x = 0; x < sourceWidth; x += 1) {
        const idx = (y * sourceWidth + x) * 4;
        const alpha = imageData[idx + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      setSignatureDataUrl("");
      return;
    }

    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(sourceWidth - 1, maxX + padding);
    maxY = Math.min(sourceHeight - 1, maxY + padding);

    const trimWidth = Math.max(1, maxX - minX + 1);
    const trimHeight = Math.max(1, maxY - minY + 1);

    const trimmedCanvas = document.createElement("canvas");
    trimmedCanvas.width = trimWidth;
    trimmedCanvas.height = trimHeight;
    const trimmedCtx = trimmedCanvas.getContext("2d");

    if (!trimmedCtx) {
      setSignatureDataUrl(signaturePadRef.current.toDataURL("image/png"));
      return;
    }

    trimmedCtx.drawImage(
      sourceCanvas,
      minX,
      minY,
      trimWidth,
      trimHeight,
      0,
      0,
      trimWidth,
      trimHeight
    );

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = SIGNATURE_EXPORT_SIZE;
    exportCanvas.height = SIGNATURE_EXPORT_SIZE;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) {
      setSignatureDataUrl(signaturePadRef.current.toDataURL("image/png"));
      return;
    }

    const boundedWidth = Math.max(trimmedCanvas.width, 1);
    const boundedHeight = Math.max(trimmedCanvas.height, 1);
    const scale = Math.min(
      SIGNATURE_EXPORT_SIZE / boundedWidth,
      SIGNATURE_EXPORT_SIZE / boundedHeight
    );

    const drawWidth = boundedWidth * scale;
    const drawHeight = boundedHeight * scale;
    const offsetX = (SIGNATURE_EXPORT_SIZE - drawWidth) / 2;
    const offsetY = (SIGNATURE_EXPORT_SIZE - drawHeight) / 2;

    exportCtx.clearRect(0, 0, SIGNATURE_EXPORT_SIZE, SIGNATURE_EXPORT_SIZE);
    exportCtx.drawImage(trimmedCanvas, offsetX, offsetY, drawWidth, drawHeight);

    setSignatureDataUrl(exportCanvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setSignatureDataUrl("");
  };

  const rotateImageBlob = async (blob, rotationDeg) => {
    if (!blob || !rotationDeg) return blob;

    return new Promise((resolve) => {
      const img = new Image();
      const src = URL.createObjectURL(blob);

      img.onload = () => {
        const normalized = ((rotationDeg % 360) + 360) % 360;
        const canvas = document.createElement("canvas");
        const shouldSwap = normalized === 90 || normalized === 270;

        canvas.width = shouldSwap ? img.height : img.width;
        canvas.height = shouldSwap ? img.width : img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(src);
          resolve(blob);
          return;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalized * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob(
          (rotatedBlob) => {
            URL.revokeObjectURL(src);
            resolve(rotatedBlob || blob);
          },
          "image/jpeg",
          0.9
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(src);
        resolve(blob);
      };

      img.src = src;
    });
  };

  const rotateCapturedImage = async () => {
    if (!capturedImage) return;
    if (isRotating || isSubmitting) return;

    setIsRotating(true);

    try {
      const rotatedBlob = await rotateImageBlob(capturedImage, 90);
      if (!rotatedBlob) return;

      if (capturedImageUrl) {
        URL.revokeObjectURL(capturedImageUrl);
      }

      setCapturedImage(rotatedBlob);
      setCapturedImageUrl(URL.createObjectURL(rotatedBlob));
    } finally {
      setIsRotating(false);
    }
  };

  const submitPhoto = async () => {
    const isType2 = mode === "card" && mediaType === "type2";
    if (!isType2 && (!capturedImage || isRotating)) return;
    if (isType2 && isSubmitting) return;

    if (!wallConfig?.business?.slug) {
      showMessage("Business information is missing", "error");
      return;
    }

    const useSignatureInput = mode === "card" && mediaType === "type2";


    setIsSubmitting(true);

    try {
      let photoFile = null;
      if (capturedImage) {
        photoFile = capturedImage instanceof File
          ? capturedImage
          : new File([capturedImage], "captured-image.jpg", { type: "image/jpeg" });
      }

      let signatureFile = null;
      if (useSignatureInput && signatureDataUrl) {
        const signatureBlob = await (await fetch(signatureDataUrl)).blob();
        signatureFile = new File([signatureBlob], "signature.png", { type: "image/png" });
      }

      const files = [];
      if (photoFile) files.push(photoFile);
      if (signatureFile) files.push(signatureFile);

      const uploads = files.map((f, index) => ({
        file: f,
        label: f.name.includes("signature") ? "Signature" : "Image",
        percent: 0,
        loaded: 0,
        total: f.size,
        error: null,
        url: null,
      }));

      let photoUrl = "";
      let signatureUrl = "";

      if (files.length > 0) {
        setShowUploadProgress(true);
        const urls = await uploadMediaFiles({
          files,
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
          photoUrl = photoFile ? urls[0] : "";
          signatureUrl = signatureFile ? (photoFile ? urls[1] : urls[0]) : "";

          if (signatureFile && !signatureUrl) {
            showMessage("Signature upload failed. Please try again.", "error");
            return;
          }
        }
      }

      await createDisplayMedia({
        imageUrl: photoUrl,
        text: text.trim(),
        signatureUrl: signatureUrl,
        slug: slug,
      });

      setTimeout(() => {
        if (capturedImageUrl) {
          URL.revokeObjectURL(capturedImageUrl);
          setCapturedImageUrl(null);
        }
        setCapturedImage(null);
        setText("");
        setSignatureDataUrl("");
        if (signaturePadRef.current) {
          signaturePadRef.current.clear();
        }
      }, 3000);
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

        {((mode === "mosaic" || mediaType === "type1") && !capturedImage) && (
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
        )}

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
            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={rotateCapturedImage}
                disabled={isRotating || isSubmitting}
                startIcon={<ICONS.refresh />}
                sx={getStartIconSpacing(dir)}
              >
                {t.rotatePhoto}
              </Button>
            </Box>
            <Box
              sx={{
                width: "100%",
                height: "50vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "12px",
                overflow: "hidden",
                bgcolor: "#f5f5f5",
              }}
            >
              <img
                src={capturedImageUrl}
                alt="Captured"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "12px",
                }}
              />
            </Box>
          </Paper>
        )}

        {mode === "mosaic" && capturedImage && (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "center",
              gap: 2,
              mb: 3,
              width: "100%",
              maxWidth: "800px",
              alignSelf: "center",
            }}
          >
            <Button
              variant="contained"
              size="large"
              color="success"
              onClick={submitPhoto}
              disabled={isSubmitting || isRotating}
              startIcon={
                isSubmitting ? (
                  <ICONS.refresh sx={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <ICONS.send />
                )
              }
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: "bold",
                width: { xs: "100%", sm: "auto" },
                ...getStartIconSpacing(dir),
              }}
            >
              {isSubmitting ? t.uploading : t.submitPhoto}
            </Button>

            <Button
              variant="outlined"
              size="large"
              color="warning"
              onClick={retakePhoto}
              disabled={isSubmitting || isRotating}
              startIcon={<ICONS.refresh />}
              sx={{
                width: { xs: "100%", sm: "auto" },
                ...getStartIconSpacing(dir),
              }}
            >
              {t.retakePhoto}
            </Button>
          </Box>
        )}

        {(mode === "card" && (mediaType === "type2" || capturedImage)) && (
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
            {mediaType === "type2" ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {t.addMessage}
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={3}
                    placeholder={t.messagePlaceholder}
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 150))}
                    disabled={isSubmitting}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ display: "block", textAlign: align, mt: 0.5 }}
                  >
                    {text.length}/150 {t.charactersCount}
                  </Typography>
                </Box>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {t.addSignature}
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 280,
                    aspectRatio: "1.5 / 1",
                    mx: "auto",
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#fff",
                    mb: 1.5,
                  }}
                >
                  <SignatureCanvas
                    ref={signaturePadRef}
                    penColor="#111"
                    canvasProps={{
                      width: 280,
                      height: 180,
                      className: "signature-canvas",
                      style: { width: "100%", height: "100%" },
                    }}
                    onEnd={handleSignatureEnd}
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearSignature}
                    startIcon={<ICONS.clear />}
                    sx={getStartIconSpacing(dir)}
                  >
                    {t.clearSignature}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {t.addMessage}
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  placeholder={t.messagePlaceholder}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 150))}
                  disabled={isSubmitting}
                />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ display: "block", textAlign: align, mt: 0.5 }}
                >
                  {text.length}/150 {t.charactersCount}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={submitPhoto}
              disabled={isSubmitting || isRotating || (mediaType === 'type2' && !text.trim() && !signatureDataUrl)}
              startIcon={
                isSubmitting ? (
                  <ICONS.refresh sx={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <ICONS.send />
                )
              }
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: "bold",
                ...getStartIconSpacing(dir),
              }}
            >
              {isSubmitting
                ? t.uploading
                : mediaType === "type2" 
                  ? "Submit Message & Signature"
                  : t.submitPhotoMessage}
            </Button>

            {capturedImage && (
              <Button
                variant="text"
                color="secondary"
                fullWidth
                size="medium"
                onClick={retakePhoto}
                disabled={isSubmitting || isRotating}
                sx={{ mt: 1 }}
              >
                {t.retakePhoto}
              </Button>
            )}
          </Paper>
        )}

        <Paper
          elevation={1}
          sx={{
            p: 2,
            mt: 3,
            bgcolor: "grey.50",
            mb: { xs: 8, sm: 8 },
            width: "100%",
            maxWidth: "800px",
            alignSelf: "center",
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