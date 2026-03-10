"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    initializing: "Initializing camera...",
    cameraSelector: "Select camera",
    tooltip: {
      cancel: "Cancel scanning",
    },
    errors: {
      permissionDenied: "Camera permission denied.",
      noCamera: "No camera found.",
      generic: "Camera error.",
      switchFailed: "Unable to switch camera.",
    },
  },
  ar: {
    initializing: "جاري تهيئة الكاميرا...",
    cameraSelector: "اختر الكاميرا",
    tooltip: {
      cancel: "إلغاء المسح",
    },
    errors: {
      permissionDenied: "تم رفض إذن الكاميرا.",
      noCamera: "لم يتم العثور على كاميرا.",
      generic: "خطأ في الكاميرا.",
      switchFailed: "تعذر تبديل الكاميرا.",
    },
  },
};

const EXTERNAL_CAMERA_PATTERN = /\b(usb|external|webcam)\b/i;
const REAR_CAMERA_PATTERN = /\b(rear|back|environment|world)\b/i;
const FRONT_CAMERA_PATTERN = /\b(front|user|facetime|selfie)\b/i;

const getCameraScore = (camera) => {
  const label = camera?.label || "";
  let score = 0;

  if (EXTERNAL_CAMERA_PATTERN.test(label)) score += 50;
  if (REAR_CAMERA_PATTERN.test(label)) score += 30;
  if (FRONT_CAMERA_PATTERN.test(label)) score -= 20;

  return score;
};

const buildCameraCandidates = (cameras = [], selectedCameraId = "") => {
  const orderedCandidates = [];
  const seen = new Set();

  const addCandidate = (candidate) => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    orderedCandidates.push(candidate);
  };

  addCandidate(selectedCameraId);
  addCandidate("environment");

  [...cameras]
    .sort((left, right) => getCameraScore(right) - getCameraScore(left))
    .forEach((camera) => addCandidate(camera.id));

  addCandidate("user");

  return orderedCandidates;
};

const getActiveTrackDeviceId = (videoElement) => {
  const stream = videoElement?.srcObject;
  if (!(stream instanceof MediaStream)) return "";

  const [track] = stream.getVideoTracks();
  return track?.getSettings?.().deviceId || "";
};

const getStreamDeviceId = (stream) => {
  if (!(stream instanceof MediaStream)) return "";

  const [track] = stream.getVideoTracks();
  return track?.getSettings?.().deviceId || "";
};

const stopStream = (stream) => {
  if (!(stream instanceof MediaStream)) return;

  stream.getTracks().forEach((track) => track.stop());
};

const isMediaDevicesSupported = () =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  !!navigator.mediaDevices?.enumerateDevices;

const isPermissionError = (error) => {
  const message = `${error?.name || ""} ${error?.message || ""} ${typeof error === "string" ? error : ""}`.toLowerCase();
  return message.includes("notallowed") || message.includes("permission");
};

const isNoCameraError = (error) => {
  const message = `${error?.name || ""} ${error?.message || ""} ${typeof error === "string" ? error : ""}`.toLowerCase();
  return (
    message.includes("notfound") ||
    message.includes("camera not found") ||
    message.includes("requested device not found") ||
    message.includes("overconstrained")
  );
};

const getCameraErrorMessage = (error, t) => {
  if (!isMediaDevicesSupported()) return t.errors.generic;
  if (isPermissionError(error)) return t.errors.permissionDenied;
  if (isNoCameraError(error)) return t.errors.noCamera;
  return t.errors.generic;
};

const listAvailableCameras = async () => {
  if (!isMediaDevicesSupported()) return [];

  try {
    return (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        id: device.deviceId,
        label: device.label || (index === 0 ? "Default Camera" : `Camera ${index + 1}`),
      }));
  } catch {
    return [];
  }
};

const buildVideoConstraints = (cameras = [], preferredCameraId = "") => {
  const constraints = [];
  const seen = new Set();

  const addConstraint = (key, video) => {
    if (!video || seen.has(key)) return;
    seen.add(key);
    constraints.push(video);
  };

  const rankedCameras = [...cameras].sort(
    (left, right) => getCameraScore(right) - getCameraScore(left)
  );

  addConstraint(
    `device:${preferredCameraId}`,
    preferredCameraId ? { deviceId: { exact: preferredCameraId } } : null
  );

  rankedCameras
    .filter((camera) => getCameraScore(camera) > 0)
    .forEach((camera) =>
      addConstraint(`device:${camera.id}`, { deviceId: { exact: camera.id } })
    );

  addConstraint("environment-ideal", { facingMode: { ideal: "environment" } });

  rankedCameras.forEach((camera) =>
    addConstraint(`device:${camera.id}`, { deviceId: { exact: camera.id } })
  );

  addConstraint("generic", true);
  addConstraint("user-ideal", { facingMode: { ideal: "user" } });

  return constraints;
};

const openCameraStream = async (cameras = [], preferredCameraId = "") => {
  if (!isMediaDevicesSupported()) {
    throw new Error("Camera API unavailable");
  }

  let lastError = null;
  const constraintOptions = buildVideoConstraints(cameras, preferredCameraId);

  for (const video of constraintOptions) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video,
        audio: false,
      });

      return {
        stream,
        deviceId: getStreamDeviceId(stream),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Camera not found");
};

export default function QRScanner({ onScanSuccess, onError, onCancel }) {
  const { t, dir } = useI18nLayout(translations);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onErrorRef = useRef(onError);
  const translationsRef = useRef(t);
  const selectedCameraIdRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [cameraOptions, setCameraOptions] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState("");
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [switchError, setSwitchError] = useState("");

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    translationsRef.current = t;
  }, [t]);

  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId]);

  useEffect(() => {
    if (!ready) return;

    let isMounted = true;

    const ensureScanner = (videoElement) => {
      if (scannerRef.current) {
        return scannerRef.current;
      }

      const scanner = new QrScanner(
        videoElement,
        (result) => {
          if (!isMounted) return;
          scannerRef.current?.stop();
          onScanSuccessRef.current?.(result?.data ?? result);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );

      scannerRef.current = scanner;
      return scanner;
    };

    const startScanner = async () => {
      try {
        setLoading(true);
        setSwitchError("");

        const videoElement = videoRef.current;
        if (!videoElement) throw new Error("Video element not found");

        const discoveredCameras = await listAvailableCameras();
        if (isMounted && discoveredCameras.length) {
          setCameraOptions(discoveredCameras);
        }

        const { stream, deviceId } = await openCameraStream(
          discoveredCameras,
          selectedCameraIdRef.current
        );

        if (!isMounted) {
          stopStream(stream);
          return;
        }

        videoElement.srcObject = stream;

        const scanner = ensureScanner(videoElement);
        await scanner.start();

        if (!isMounted) {
          scanner.stop();
          stopStream(stream);
          return;
        }

        const resolvedDeviceId =
          getStreamDeviceId(stream) || getActiveTrackDeviceId(videoElement) || deviceId;

        setActiveCameraId(resolvedDeviceId);
        setSelectedCameraId((current) => current || resolvedDeviceId);
        setLoading(false);

        const labeledCameras = await listAvailableCameras();
        if (isMounted && labeledCameras.length) {
          setCameraOptions(labeledCameras);
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false);
          onErrorRef.current?.(
            getCameraErrorMessage(error, translationsRef.current)
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopStream(videoRef.current?.srcObject);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      scannerRef.current?.destroy?.();
      scannerRef.current = null;
    };
  }, [ready]);

  const handleCameraChange = async (event) => {
    const nextCameraId = event.target.value;
    setSelectedCameraId(nextCameraId);

    if (!scannerRef.current || !nextCameraId || nextCameraId === activeCameraId) {
      return;
    }

    const previousCameraId = activeCameraId || getActiveTrackDeviceId(videoRef.current);

    try {
      setLoading(true);
      setSwitchError("");

      const videoElement = videoRef.current;
      if (!videoElement || !scannerRef.current) {
        throw new Error("Video element not found");
      }

      await scannerRef.current.pause(true);

      const cameras = await listAvailableCameras();
      if (cameras.length) {
        setCameraOptions(cameras);
      }

      const { stream, deviceId } = await openCameraStream(cameras, nextCameraId);
      videoElement.srcObject = stream;

      await scannerRef.current.start();

      const currentDeviceId =
        getStreamDeviceId(stream) || getActiveTrackDeviceId(videoElement) || deviceId || nextCameraId;
      setActiveCameraId(currentDeviceId);
      setSelectedCameraId(currentDeviceId);

      const labeledCameras = await listAvailableCameras();
      if (labeledCameras.length) {
        setCameraOptions(labeledCameras);
      }
    } catch (error) {
      if (previousCameraId && previousCameraId !== nextCameraId) {
        try {
          const videoElement = videoRef.current;
          if (videoElement && scannerRef.current) {
            await scannerRef.current.pause(true);
            const cameras = await listAvailableCameras();
            const { stream, deviceId } = await openCameraStream(cameras, previousCameraId);
            videoElement.srcObject = stream;
            await scannerRef.current.start();

            const restoredDeviceId =
              getStreamDeviceId(stream) ||
              getActiveTrackDeviceId(videoElement) ||
              deviceId ||
              previousCameraId;

            setActiveCameraId(restoredDeviceId);
            setSelectedCameraId(restoredDeviceId);
          }
        } catch {}
      }

      setSwitchError(t.errors.switchFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      dir={dir}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Tooltip title={t.tooltip.cancel}>
        <IconButton
          onClick={onCancel}
          sx={{
            position: "absolute",
            top: 16,
            [dir === "rtl" ? "left" : "right"]: 16,
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <ICONS.close />
        </IconButton>
      </Tooltip>

      <Box
        sx={{
          width: "90vmin",
          height: "90vmin",
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 5,
        }}
      >
        <video
          ref={(element) => {
            videoRef.current = element;
            if (element && !ready) setReady(true);
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              flexDirection: "row",
            }}
          >
            <CircularProgress color="inherit" />
            <Typography ml={2} color="#fff">
              {t.initializing}
            </Typography>
          </Box>
        )}

        {!loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "2px dashed #00e676",
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          />
        )}

        {cameraOptions.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 16,
              zIndex: 2,
            }}
          >
            {switchError && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 1,
                  color: "#ff8a80",
                  textAlign: "center",
                }}
              >
                {switchError}
              </Typography>
            )}

            <FormControl fullWidth size="small">
              <Select
                value={selectedCameraId || activeCameraId || ""}
                onChange={handleCameraChange}
                displayEmpty
                disabled={loading}
                inputProps={{ "aria-label": t.cameraSelector }}
                renderValue={(value) => {
                  if (!value) {
                    return t.cameraSelector;
                  }

                  return (
                    cameraOptions.find((camera) => camera.id === value)?.label ||
                    t.cameraSelector
                  );
                }}
                sx={{
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.65)",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.35)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.45)",
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#fff",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 320,
                    },
                  },
                }}
              >
                {cameraOptions.map((camera, index) => (
                  <MenuItem
                    key={camera.id || `camera-${index}`}
                    value={camera.id}
                  >
                    {camera.label || `${t.cameraSelector} ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>
    </Box>
  );
}
