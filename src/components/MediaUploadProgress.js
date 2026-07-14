"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    LinearProgress,
    List,
    ListItem,
    IconButton,
    Alert,
    Chip,
    Paper,
    useTheme,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";

const MediaUploadProgress = ({ open, uploads, onClose, allowClose = false }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const allComplete = uploads.every((u) => u.percent === 100 || u.error);
    const hasErrors = uploads.some((u) => u.error);
    const uploadingCount = uploads.filter((u) => u.percent < 100 && !u.error).length;

    const getStatusColor = (upload) => {
        if (upload.error) return theme.palette.error.main;
        if (upload.percent === 100) return theme.palette.success.main;
        return theme.palette.primary.main;
    };

    const getStatusIcon = (upload) => {
        if (upload.error) {
            return (
                <ICONS.errorOutline
                    sx={{
                        color: "error.main",
                        fontSize: 22,
                        animation: upload.error ? "pulse 0.5s ease-in-out" : "none"
                    }}
                />
            );
        }
        if (upload.percent === 100) {
            return (
                <ICONS.checkCircle
                    sx={{
                        color: "success.main",
                        fontSize: 22,
                        animation: "scaleIn 0.3s ease-out"
                    }}
                />
            );
        }
        return (
            <Box
                sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: "primary.main",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                }}
            />
        );
    };

    const getUploadBg = (upload) => {
        if (upload.error) return theme.palette.mediaUpload.status.error.bg;
        if (upload.percent === 100) return theme.palette.mediaUpload.status.success.bg;
        return theme.palette.mediaUpload.status.uploading.bg;
    };

    const getUploadBorder = (upload) => {
        if (upload.error) return theme.palette.mediaUpload.status.error.border;
        if (upload.percent === 100) return theme.palette.mediaUpload.status.success.border;
        return theme.palette.mediaUpload.status.uploading.border;
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={allowClose || allComplete ? onClose : undefined}
                maxWidth="sm"
                fullWidth
                onKeyDown={(e) => {
                    if (e.key === "Escape" && !allowClose && !allComplete) e.stopPropagation();
                }}
                slotProps={{
                    paper: {
                        sx: {
                            boxShadow: (theme) => theme.palette.shadow.dialog,
                            overflow: "hidden",
                        }
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: allComplete
                            ? (theme) => `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                            : (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        color: "primary.contrastText",
                        py: 2.5,
                        px: 3,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        {!allComplete && (
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    bgcolor: (theme) => theme.palette.mediaUpload.iconCircleBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ICONS.cloud sx={{ color: "primary.contrastText", fontSize: 18 }} />
                            </Box>
                        )}
                        {allComplete && (
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    bgcolor: (theme) => theme.palette.mediaUpload.iconCircleBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ICONS.checkCircle sx={{ color: "primary.contrastText", fontSize: 18 }} />
                            </Box>
                        )}
                        <Box>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: "1.1rem",
                                    color: "primary.contrastText"
                                }}>
                                {allComplete ? "Upload Complete" : "Uploading Media"}
                            </Typography>
                            {!allComplete && uploadingCount > 0 && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: (theme) => theme.palette.landing.subtitleText,
                                        fontSize: "0.75rem"
                                    }}
                                >
                                    {uploadingCount} {uploadingCount === 1 ? "file" : "files"} uploading...
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    {(allowClose || allComplete) && (
                        <IconButton
                            onClick={onClose}
                            size="small"
                            sx={{
                                color: "primary.contrastText",
                                "&:hover": {
                                    bgcolor: (theme) => theme.palette.overlay.whiteGlassLight,
                                }
                            }}
                        >
                            <ICONS.close />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 3, bgcolor: "background.default" }}>
                    {hasErrors && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2.5,
                                borderRadius: 2,
                                boxShadow: (theme) => theme.palette.mediaUpload.alertShadow,
                            }}
                            icon={<ICONS.errorOutline />}
                        >
                            Some uploads failed. Please try again.
                        </Alert>
                    )}
                    <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                        {uploads.map((upload, index) => (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    bgcolor: "background.paper",
                                    border: "1px solid",
                                    borderColor: getUploadBorder(upload),
                                    boxShadow: (theme) => theme.palette.mediaUpload.cardShadow,
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        boxShadow: (theme) => theme.palette.mediaUpload.cardHoverShadow,
                                        transform: "translateY(-1px)",
                                    }
                                }}
                            >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: "text.primary",
                                                mb: 0.5,
                                                fontSize: "0.95rem"
                                            }}>
                                            {upload.label}
                                        </Typography>
                                        {upload.percent < 100 && upload.loaded && upload.total && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "text.secondary",
                                                    fontSize: "0.8rem",
                                                    display: "block",
                                                }}
                                            >
                                                {(upload.loaded / 1024 / 1024).toFixed(2)} MB / {(upload.total / 1024 / 1024).toFixed(2)} MB
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 2 }}>
                                        <Chip
                                            label={`${upload.percent}%`}
                                            size="small"
                                            sx={{
                                                bgcolor: getUploadBg(upload),
                                                color: getStatusColor(upload),
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
                                                height: 24,
                                                minWidth: 50,
                                            }}
                                        />
                                        {getStatusIcon(upload)}
                                    </Box>
                                </Box>
                                <Box sx={{ position: "relative", mb: upload.error ? 1 : 0 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={upload.percent}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: getUploadBg(upload),
                                            "& .MuiLinearProgress-bar": {
                                                borderRadius: 4,
                                                bgcolor: getStatusColor(upload),
                                                transition: "all 0.3s ease",
                                                boxShadow: (theme) => upload.percent === 100
                                                    ? theme.palette.mediaUpload.progressBarShadow.success
                                                    : theme.palette.mediaUpload.progressBarShadow.default,
                                            }
                                        }}
                                    />
                                </Box>
                                {upload.error && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "error.main",
                                            fontSize: "0.8rem",
                                            mt: 1,
                                            display: "block",
                                        }}
                                    >
                                        {upload.error}
                                    </Typography>
                                )}
                            </Paper>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>
            <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
        </>
    );
};

export default MediaUploadProgress;