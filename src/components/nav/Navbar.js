"use client";

import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useColorMode } from "@/contexts/ThemeContext";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import LanguageSelector from "../LanguageSelector";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { globalConfig } = useGlobalConfig();
  const { mode, toggleColorMode } = useColorMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { t } = useI18nLayout({
    en: {
      signIn: "Sign In",
      logout: "Logout",
      confirmLogoutTitle: "Confirm Logout",
      confirmLogoutMsg: "Are you sure you want to log out of your account?",
      loggedInAs: "Logged in as",
      viewProfile: "View profile",
      switchToDark: "Switch to dark mode",
      switchToLight: "Switch to light mode",
    },
    ar: {
      signIn: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      confirmLogoutTitle: "تأكيد تسجيل الخروج",
      confirmLogoutMsg: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
      loggedInAs: "تم تسجيل الدخول كـ",
      viewProfile: "عرض الملف الشخصي",
      switchToDark: "التبديل إلى الوضع الداكن",
      switchToLight: "التبديل إلى الوضع الفاتح",
    },
  });

  useEffect(() => {
    if (!user) {
      setConfirmLogout(false);
      setAnchorEl(null);
    }
  }, [user]);

  const avatarButtonStyle = {
    p: 0,
    borderRadius: "50%",
    width: 30,
    height: 30,
    backgroundColor: "background.paper",
    transition: "box-shadow 0.3s ease",
    boxShadow: (theme) =>
      theme.palette.mode === "dark"
        ? theme.palette.custom.shadow.neumorphicDark1
        : theme.palette.custom.shadow.neumorphicLight1,
    "&:hover": {
      boxShadow: (theme) => theme.palette.navbar.avatarButtonHoverShadow,
    },
  };

  // Slightly larger than the other toolbar icon buttons — the profile
  // avatar sits at the end of the toolbar and should read as the primary
  // action, not blend in with the theme toggle.
  const profileButtonStyle = {
    ...avatarButtonStyle,
    width: 40,
    height: 40,
  };

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const openLogoutConfirm = () => {
    handleClose();
    setConfirmLogout(true);
  };

  const handleConfirmLogout = async () => {
    setConfirmLogout(false);
    await logout();
  };

  return (
    <Box sx={{ position: "relative" }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: (theme) => theme.palette.navbar.appBarBg,
          boxShadow: "none",
          borderBottom: (theme) =>
            `1px solid ${theme.palette.divider}`,
          height: "64px",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "primary.main", letterSpacing: 1 }}
            >
              EventPass
            </Typography>
          </Link>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Dark/Light Mode Toggle */}
            <Tooltip title={mode === "dark" ? t.switchToLight : t.switchToDark}>
              <IconButton onClick={toggleColorMode} sx={avatarButtonStyle}>
                {mode === "dark" ? (
                  <LightModeIcon fontSize="small" sx={{ color: "secondary.main" }} />
                ) : (
                  <DarkModeIcon fontSize="small" sx={{ color: "primary.main" }} />
                )}
              </IconButton>
            </Tooltip>

            <LanguageSelector />

            {!user ? (
              <Link href="/auth/login">
                <Tooltip title={t.signIn}>
                  <IconButton color="primary" sx={profileButtonStyle}>
                    <ICONS.login fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Link>
            ) : (
              <>
                <Tooltip title={t.viewProfile}>
                  <IconButton onClick={handleOpen} sx={profileButtonStyle}>
                    <Avatar
                      sx={{
                        bgcolor: "background.paper",
                        width: 38,
                        height: 38,
                        color: "text.primary",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                      }}
                    >
                      {user.name
                        ?.split(" ")
                        .map((n) => n[0]?.toUpperCase())
                        .slice(0, 2)
                        .join("")}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        mt: 1,
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: (theme) => theme.palette.navbar.menuPaperShadow,
                      },
                    },
                  }}
                >
                  <MenuItem>
                    <Typography variant="body2" sx={{
                      color: "text.secondary"
                    }}>
                      {t.loggedInAs}{" "}
                      <strong>
                        &nbsp;
                        {user.role?.charAt(0).toUpperCase() +
                          user.role?.slice(1)}
                      </strong>
                    </Typography>
                  </MenuItem>
                  <MenuItem>
                    <Typography variant="body2">{user.name}</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={openLogoutConfirm}
                    sx={{ color: "error.main" }}
                  >
                    <ICONS.logout fontSize="small" sx={{ mr: 1 }} />
                    {t.logout}
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <ConfirmationDialog
        open={!!user && confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleConfirmLogout}
        title={t.confirmLogoutTitle}
        message={t.confirmLogoutMsg}
        confirmButtonText={t.logout}
        confirmButtonIcon={<ICONS.logout fontSize="small" />}
      />
    </Box>
  );
}