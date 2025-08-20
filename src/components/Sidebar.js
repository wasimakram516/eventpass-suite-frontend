"use client";

import {
  Drawer,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useState } from "react";
import ICONS from "@/utils/iconUtil";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, dir } = useI18nLayout({
    en: {
      home: "Home",
      modules: "Modules",
      staff: "Staff",
      users: "Users",
      settings: "Settings",
      trash: "Recycle Bin",
      menu: "Menu",
      close: "Close",
    },
    ar: {
      home: "الرئيسية",
      modules: "الوحدات",
      staff: "الموظفون",
      users: "المستخدمون",
      settings: "الإعدادات",
      trash: "سلة المحذوفات",
      menu: "القائمة",
      close: "إغلاق",
    },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: t.home, icon: ICONS.home, path: "/cms" },
    { label: t.modules, icon: ICONS.module, path: "/cms/modules" },
    {
      label: user?.role === "business" ? t.staff : t.users,
      icon: ICONS.peopleAlt,
      path: "/cms/users",
    },
    { label: t.settings, icon: ICONS.settings, path: "/cms/settings" },
    { label: t.trash, icon: ICONS.delete, path: "/cms/trash" },
  ];

  const isActive = (path) =>
    path === "/cms" ? pathname === "/cms" : pathname.startsWith(path);

  const drawerContent = (
    <Box
      dir={dir}
      sx={{
        width: isMobile ? "auto" : 64,
        pt: 2,
        px: isMobile ? 2 : 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {isMobile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 2,
          }}
        >
          <IconButton
            size="large"
            color="error"
            sx={{ p: 1 }}
            onClick={() => setMobileOpen(false)}
            aria-label={t.close}
          >
            <ICONS.close />
          </IconButton>
        </Box>
      )}

      <List sx={{ width: "100%" }}>
        {navItems.map(({ path, icon: Icon, label }) => (
          <ListItem
            key={label}
            disablePadding
            sx={{
              mb: 1,
              justifyContent: isMobile ? "flex-start" : "center",
            }}
          >
            <Link
              href={path}
              style={{ width: "100%", textDecoration: "none" }}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isMobile ? "flex-start" : "center",
                  gap: isMobile ? 2 : 0,
                  px: isMobile ? 1 : 0,
                }}
              >
                <Tooltip
                  title={label}
                  placement="right"
                  disableHoverListener={isMobile}
                >
                  <IconButton
                    size="large"
                    sx={{
                      color: isActive(path) ? "white" : "text.secondary",
                      bgcolor: isActive(path) ? "primary.light" : "transparent",
                      ":hover": {
                        bgcolor: "action.hover",
                        color: "primary.main",
                      },
                    }}
                  >
                    <Icon />
                  </IconButton>
                </Tooltip>

                {isMobile && (
                  <Typography variant="body2" sx={{ color: "text.primary" }}>
                    {label}
                  </Typography>
                )}
              </Box>
            </Link>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && !mobileOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 72,
            [dir === "rtl" ? "left" : "right"]: 16,
            zIndex: 2,
            bgcolor: "background.paper",
            borderRadius: "50%",
            boxShadow: 3,
          }}
        >
          <Tooltip title={t.menu}>
            <IconButton
              size="large"
              color="primary"
              onClick={() => setMobileOpen(true)}
              sx={{ p: 1.5 }}
            >
              <ICONS.menu />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 64,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 64,
              boxSizing: "border-box",
              bgcolor: "background.paper",
              pt: 2,
              top: "64px",
              height: "calc(100% - 64px)",
              position: "fixed",
              zIndex: 1200,
              overflowX: "hidden",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor={dir === "rtl" ? "right" : "left"}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            [`& .MuiDrawer-paper`]: {
              width: "80vw",
              maxWidth: 320,
              zIndex: 1400,
              boxShadow: 6,
              borderRadius: 0,
              overflowX: "hidden",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
