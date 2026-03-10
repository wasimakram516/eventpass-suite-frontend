"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    initializing: "Initializing camera...",
    cameraSelector: "Choose camera",
    cameraDefault: "System default",
    cameraRear: "Rear camera",
    cameraFront: "Front camera",
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
    cameraDefault: "الكاميرا الافتراضية",
    cameraRear: "الكاميرا الخلفية",
    cameraFront: "الكاميرا الأمامية",
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

const CAMERA_SELECTIONS = {
  AUTO_DEFAULT: "__auto_default__",
  AUTO_ENVIRONMENT: "__auto_environment__",
  AUTO_USER: "__auto_user__",
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

const buildSelectableCameraOptions = (cameras = [], t) => {
  const options = [
    { id: CAMERA_SELECTIONS.AUTO_DEFAULT, label: t.cameraDefault },
    { id: CAMERA_SELECTIONS.AUTO_ENVIRONMENT, label: t.cameraRear },
    { id: CAMERA_SELECTIONS.AUTO_USER, label: t.cameraFront },
  ];
  const seen = new Set(options.map((option) => option.id));

  cameras.forEach((camera, index) => {
    if (!camera?.id || seen.has(camera.id)) return;
    seen.add(camera.id);
    options.push({
      id: camera.id,
      label: camera.label || `${t.cameraSelector} ${index + 1}`,
    });
  });

  return options;
};

const buildVideoConstraints = (cameras = [], preferredCameraId = CAMERA_SELECTIONS.AUTO_DEFAULT) => {
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

  if (
    preferredCameraId &&
    !Object.values(CAMERA_SELECTIONS).includes(preferredCameraId)
  ) {
    addConstraint(`device:${preferredCameraId}`, {
      deviceId: { exact: preferredCameraId },
    });
  }

  if (preferredCameraId === CAMERA_SELECTIONS.AUTO_USER) {
    addConstraint("user-ideal", { facingMode: { ideal: "user" } });
    addConstraint("generic", true);
    addConstraint("environment-ideal", { facingMode: { ideal: "environment" } });
  } else if (preferredCameraId === CAMERA_SELECTIONS.AUTO_ENVIRONMENT) {
    addConstraint("environment-ideal", { facingMode: { ideal: "environment" } });
    rankedCameras
      .filter((camera) => getCameraScore(camera) > 0)
      .forEach((camera) =>
        addConstraint(`device:${camera.id}`, { deviceId: { exact: camera.id } })
      );
    addConstraint("generic", true);
    addConstraint("user-ideal", { facingMode: { ideal: "user" } });
  } else {
    addConstraint("generic", true);
    addConstraint("environment-ideal", { facingMode: { ideal: "environment" } });
    rankedCameras
      .filter((camera) => getCameraScore(camera) > 0)
      .forEach((camera) =>
        addConstraint(`device:${camera.id}`, { deviceId: { exact: camera.id } })
      );
    addConstraint("user-ideal", { facingMode: { ideal: "user" } });
  }

  rankedCameras.forEach((camera) =>
    addConstraint(`device:${camera.id}`, { deviceId: { exact: camera.id } })
  );

  return constraints;
};

const openCameraStream = async (
  cameras = [],
  preferredCameraId = CAMERA_SELECTIONS.AUTO_DEFAULT
) => {
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
  const selectedCameraIdRef = useRef(CAMERA_SELECTIONS.AUTO_DEFAULT);

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [cameraOptions, setCameraOptions] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState("");
  const [selectedCameraId, setSelectedCameraId] = useState(
    CAMERA_SELECTIONS.AUTO_DEFAULT
  );
  const [switchError, setSwitchError] = useState("");

  const selectableCameraOptions = buildSelectableCameraOptions(cameraOptions, t);

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
    if (!isMediaDevicesSupported()) return undefined;

    let isMounted = true;

    const refreshCameraOptions = async () => {
      const cameras = await listAvailableCameras();
      if (isMounted) {
        setCameraOptions(cameras);
      }
    };

    refreshCameraOptions();

    const handleDeviceChange = () => {
      refreshCameraOptions();
    };

    navigator.mediaDevices.addEventListener?.("devicechange", handleDeviceChange);

    return () => {
      isMounted = false;
      navigator.mediaDevices.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, []);

  const ensureScanner = (videoElement, isMountedRef) => {
    if (scannerRef.current) {
      return scannerRef.current;
    }

    const scanner = new QrScanner(
      videoElement,
      (result) => {
        if (!isMountedRef.current) return;
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

  useEffect(() => {
    if (!ready) return;

    const isMountedRef = { current: true };

    const startScanner = async () => {
      try {
        setLoading(true);
        setSwitchError("");

        const videoElement = videoRef.current;
        if (!videoElement) throw new Error("Video element not found");

        const discoveredCameras = await listAvailableCameras();
        if (isMountedRef.current && discoveredCameras.length) {
          setCameraOptions(discoveredCameras);
        }

        const scanner = ensureScanner(videoElement, isMountedRef);
        const { stream, deviceId } = await openCameraStream(
          discoveredCameras,
          selectedCameraIdRef.current
        );

        if (!isMountedRef.current) {
          stopStream(stream);
          return;
        }

        videoElement.srcObject = stream;
        await scanner.start();

        if (!isMountedRef.current) {
          scanner.stop();
          stopStream(stream);
          return;
        }

        const resolvedDeviceId =
          getStreamDeviceId(stream) || getActiveTrackDeviceId(videoElement) || deviceId;

        setActiveCameraId(resolvedDeviceId);
        setLoading(false);

        const labeledCameras = await listAvailableCameras();
        if (isMountedRef.current && labeledCameras.length) {
          setCameraOptions(labeledCameras);
        }
      } catch (error) {
        const refreshedCameras = await listAvailableCameras();
        if (isMountedRef.current && refreshedCameras.length) {
          setCameraOptions(refreshedCameras);
        }

        if (
          isMountedRef.current &&
          isNoCameraError(error) &&
          refreshedCameras.length > 0
        ) {
          setLoading(false);
          setSwitchError(getCameraErrorMessage(error, translationsRef.current));
          return;
        }

        if (isMountedRef.current) {
          setLoading(false);
          onErrorRef.current?.(getCameraErrorMessage(error, translationsRef.current));
        }
      }
    };

    startScanner();

    return () => {
      isMountedRef.current = false;
      stopStream(videoRef.current?.srcObject);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      scannerRef.current?.destroy?.();
      scannerRef.current = null;
    };
  }, [ready]);

  const handleCameraChange = async (nextCameraId) => {
    const previousSelection =
      selectedCameraIdRef.current || CAMERA_SELECTIONS.AUTO_DEFAULT;
    setSelectedCameraId(nextCameraId);

    if (
      !nextCameraId ||
      (nextCameraId === activeCameraId &&
        !Object.values(CAMERA_SELECTIONS).includes(nextCameraId))
    ) {
      return;
    }

    const previousCameraId = activeCameraId || getActiveTrackDeviceId(videoRef.current);

    try {
      setLoading(true);
      setSwitchError("");

      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error("Video element not found");
      }

      const scanner = ensureScanner(videoElement, { current: true });
      await scanner.pause(true);
      stopStream(videoElement.srcObject);

      const cameras = await listAvailableCameras();
      setCameraOptions(cameras);

      const { stream, deviceId } = await openCameraStream(cameras, nextCameraId);
      videoElement.srcObject = stream;

      await scanner.start();

      const currentDeviceId =
        getStreamDeviceId(stream) || getActiveTrackDeviceId(videoElement) || deviceId || nextCameraId;
      setActiveCameraId(currentDeviceId);
      setSelectedCameraId(nextCameraId);
      setSwitchError("");

      const labeledCameras = await listAvailableCameras();
      setCameraOptions(labeledCameras);
    } catch (error) {
      if (previousCameraId && previousCameraId !== nextCameraId) {
        try {
          const videoElement = videoRef.current;
          if (videoElement && scannerRef.current) {
            await scannerRef.current.pause(true);
            stopStream(videoElement.srcObject);
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
            setSelectedCameraId(previousSelection);
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

        {selectableCameraOptions.length > 0 && (
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

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1,
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
              }}
            >
              {t.cameraSelector}
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 0.5,
                scrollbarWidth: "thin",
              }}
            >
              {selectableCameraOptions.map((camera, index) => {
                const isSelected =
                  (selectedCameraId || CAMERA_SELECTIONS.AUTO_DEFAULT) === camera.id;

                return (
                  <Button
                    key={camera.id || `camera-${index}`}
                    type="button"
                    size="small"
                    variant={isSelected ? "contained" : "outlined"}
                    disabled={loading}
                    onClick={() => handleCameraChange(camera.id)}
                    sx={{
                      flexShrink: 0,
                      minWidth: 140,
                      color: isSelected ? "#000" : "#fff",
                      backgroundColor: isSelected ? "#fff" : "rgba(0,0,0,0.65)",
                      borderColor: "rgba(255,255,255,0.35)",
                      "&:hover": {
                        borderColor: "#fff",
                        backgroundColor: isSelected ? "#f2f2f2" : "rgba(255,255,255,0.12)",
                      },
                    }}
                  >
                    {camera.label || `${t.cameraSelector} ${index + 1}`}
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
