"use client";

import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import LanguageSelector from "./LanguageSelector";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import ICONS from "@/utils/iconUtil";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { globalConfig } = useGlobalConfig();
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const openLogoutConfirm = () => {
    handleClose();
    setConfirmLogout(true);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          height: "64px",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{ cursor: "pointer", width: { xs: 180, sm: "auto" } }}
  >
    {/* Logo for mobile devices */}
    <Box
      component="img"
      src="/WW.png"
      alt="Company Logo"
      sx={{
        display: { xs: "block", sm: "none" },
        height: 20,
        objectFit: "contain",
      }}
    />

    {/* App name for tablets and desktops */}
    <Typography
      variant="h6"
      fontWeight="bold"
      color="text.primary"
      noWrap
      sx={{ display: { xs: "none", sm: "block" } }}
    >
      {globalConfig?.appName || "EventPass Suite"}
    </Typography>
  </Stack>
</Link>


          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {!user ? (
              <Link href="/auth/login">
                <Button
                  color="primary"
                  startIcon={<ICONS.login />}
                  sx={{ textTransform: "none" }}
                >
                  Sign In
                </Button>
              </Link>
            ) : (
              <>
                <IconButton
                  onClick={handleOpen}
                  sx={{
                    p: 0,
                    borderRadius: "50%",
                    backgroundColor: "background.paper",
                    transition: "box-shadow 0.3s ease",
                    boxShadow: `
      2px 2px 6px rgba(0, 0, 0, 0.15),
      -2px -2px 6px rgba(255, 255, 255, 0.5),
      inset 2px 2px 5px rgba(0, 0, 0, 0.2),
      inset -2px -2px 5px rgba(255, 255, 255, 0.7)
    `,
                    "&:hover": {
                      boxShadow: `
        3px 3px 8px rgba(0, 0, 0, 0.2),
        -3px -3px 8px rgba(255, 255, 255, 0.6),
        inset 2px 2px 5px rgba(0, 0, 0, 0.2),
        inset -2px -2px 5px rgba(255, 255, 255, 0.7)
      `,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "white",
                      color: "#033649",
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

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      minWidth: 200,
                      boxShadow: `
        2px 2px 6px rgba(0, 0, 0, 0.1),
        -2px -2px 6px rgba(255, 255, 255, 0.4)
      `,
                    },
                  }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      Signed in as <strong>&nbsp;{user.name}</strong>
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={openLogoutConfirm}
                    sx={{ color: "error.main" }}
                  >
                    <ICONS.logout fontSize="small" sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
            <LanguageSelector />
          </Box>
        </Toolbar>
      </AppBar>

      <ConfirmationDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmButtonText="Logout"
      />
    </Box>
  );
}
