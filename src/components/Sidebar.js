"use client";

import { Drawer, List, ListItem, Tooltip, IconButton } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ViewModule, PeopleAlt, Settings } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18nLayout({
    en: {
      home: "Home",
      modules: "Modules",
      staff: "Staff",
      users: "Users",
      settings: "Settings"
    },
    ar: {
      home: "الرئيسية",
      modules: "الوحدات",
      staff: "الموظفون",
      users: "المستخدمون",
      settings: "الإعدادات"
    }
  });

  const navItems = [
    { label: t.home, icon: Home, path: "/cms" },
    { label: t.modules, icon: ViewModule, path: "/cms/modules" },
    {
      label: user?.role === "business" ? t.staff : t.users,
      icon: PeopleAlt,
      path: "/cms/users",
    },
    { label: t.settings, icon: Settings, path: "/cms/settings" },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 64,
        flexShrink: 0,
        top: "64px",
        height: "calc(100% - 64px)",
        position: "fixed",
        [`& .MuiDrawer-paper`]: {
          width: 64,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          pt: 2,
          top: "64px",
          height: "calc(100% - 64px)",
          position: "fixed",
        },
      }}
    >
      <List>
        {navItems.map((item) => {
          const isActive =
            item.path === "/cms"
              ? pathname === "/cms"
              : pathname.startsWith(item.path);

          const Icon = item.icon;

          return (
            <Tooltip title={item.label} placement="right" key={item.label}>
              <ListItem disablePadding sx={{ justifyContent: "center", mb: 2 }}>
                <Link href={item.path} passHref>
                  <IconButton
                    size="large"
                    sx={{
                      color: isActive ? "white" : "text.secondary",
                      backgroundColor: isActive
                        ? "primary.light"
                        : "transparent",
                      ":hover": {
                        backgroundColor: "action.hover",
                        color: "primary.main",
                      },
                    }}
                  >
                    <Icon />
                  </IconButton>
                </Link>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
    </Drawer>
  );
}