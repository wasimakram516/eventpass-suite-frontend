"use client";

import {
  Box,
  Typography,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Divider,
  Avatar,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import LoadingState from "@/components/LoadingState";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useAuth } from "@/contexts/AuthContext";
import AppCard from "@/components/cards/AppCard";
import {
  getRoles,
  getRolePermissions,
  setRolePermissions,
  getActions,
} from "@/services/roleService";
import { getModules } from "@/services/moduleService";
import { getModuleIcon } from "@/utils/iconMapper";

// "files" (Manage Downloadable Files) isn't part of the older per-role
// module-tile catalog GET /modules serves (that catalog also drives the CMS
// home grid + legacy modulePermissions, which "files" was never part of) —
// it only exists in the granular Permission catalog. This local fallback
// keeps its row from showing the raw "files" key/a generic icon instead of a
// proper bilingual label and matching icon.
const FALLBACK_MODULE_INFO = {
  files: {
    labels: { en: "Manage Downloadable Files", ar: "إدارة الملفات القابلة للتنزيل" },
    icon: "files",
  },
};

const translations = {
  en: {
    title: "Access Control — Permissions",
    subtitle: "Pick a role on the left, then grant module actions on the right",
    selectAll: "Select All",
    save: "Save Changes",
    reset: "Reset",
    noRoles: "No roles yet.",
    selectRole: "Select a role to edit its permissions",
    saved: "Permissions saved",
  },
  ar: {
    title: "التحكم بالصلاحيات — الصلاحيات",
    subtitle: "اختر دورًا من القائمة، ثم حدد صلاحيات الوحدات",
    selectAll: "تحديد الكل",
    save: "حفظ التغييرات",
    reset: "إعادة تعيين",
    noRoles: "لا توجد أدوار بعد.",
    selectRole: "اختر دورًا لتعديل صلاحياته",
    saved: "تم حفظ الصلاحيات",
  },
};

export default function PermissionsMatrixPage() {
  const { user } = useAuth();
  const { t, dir, language } = useI18nLayout(translations);
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(searchParams.get("roleId") || null);
  const [moduleData, setModuleData] = useState({}); // key -> { labels, icon }
  const [actionLabels, setActionLabels] = useState({});
  const [permissions, setPermissions] = useState([]); // [{permissionId, module, allowedActions}]
  const [assignments, setAssignments] = useState({}); // permissionId -> Set(actions)
  const [savedAssignments, setSavedAssignments] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [rolesRes, modulesRes, actionsRes] = await Promise.all([
        getRoles(),
        getModules("admin"),
        getActions(),
      ]);
      if (!rolesRes?.error) setRoles(Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || []);
      if (!modulesRes?.error) {
        const list = Array.isArray(modulesRes) ? modulesRes : modulesRes?.data || [];
        const map = {};
        list.forEach((m) => { map[m.key] = { labels: m.labels, icon: m.icon }; });
        setModuleData(map);
      }
      if (!actionsRes?.error) {
        const list = Array.isArray(actionsRes) ? actionsRes : actionsRes?.data || [];
        const labels = {};
        list.forEach((a) => { labels[a.key] = a.labels; });
        setActionLabels(labels);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Each role's permission-matrix rows already carry the full pilot-module
  // catalog (permissionId/module/allowedActions) plus this role's current
  // grants (grantedActions) — no separate catalog fetch needed.
  useEffect(() => {
    if (!selectedRoleId) return;
    (async () => {
      const res = await getRolePermissions(selectedRoleId);
      if (res?.error) return;
      const rows = res?.permissions || [];
      setPermissions(rows);

      const next = {};
      rows.forEach((row) => {
        next[row.permissionId] = new Set(row.grantedActions || []);
      });
      setAssignments(next);
      setSavedAssignments(
        Object.fromEntries(Object.entries(next).map(([k, v]) => [k, new Set(v)]))
      );
    })();
  }, [selectedRoleId]);

  const isDirty = useMemo(() => {
    const keys = new Set([...Object.keys(assignments), ...Object.keys(savedAssignments)]);
    for (const key of keys) {
      const a = assignments[key] || new Set();
      const b = savedAssignments[key] || new Set();
      if (a.size !== b.size) return true;
      for (const action of a) if (!b.has(action)) return true;
    }
    return false;
  }, [assignments, savedAssignments]);

  const toggleAction = (permissionId, action) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const current = new Set(next[permissionId] || []);
      if (current.has(action)) current.delete(action);
      else current.add(action);
      next[permissionId] = current;
      return next;
    });
  };

  const toggleAllForModule = (permissionId, allowedActions, checked) => {
    setAssignments((prev) => ({
      ...prev,
      [permissionId]: checked ? new Set(allowedActions) : new Set(),
    }));
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    const payload = Object.entries(assignments).map(([permissionId, actions]) => ({
      permissionId,
      actions: Array.from(actions),
    }));
    const res = await setRolePermissions(selectedRoleId, payload);
    setSaving(false);
    if (!res?.error) {
      setSavedAssignments(
        Object.fromEntries(Object.entries(assignments).map(([k, v]) => [k, new Set(v)]))
      );
    }
  };

  const handleReset = () => {
    setAssignments(
      Object.fromEntries(Object.entries(savedAssignments).map(([k, v]) => [k, new Set(v)]))
    );
  };

  if (loading) return <LoadingState />;

  const selectedRole = roles.find((r) => r._id === selectedRoleId);

  return (
    <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, md: 3 }, py: 3 }} dir={dir}>
      <BreadcrumbsNav />
      <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{t.title}</Typography>
      <Typography variant="body2" color="text.secondary">{t.subtitle}</Typography>
      <Divider sx={{ mb: 2, mt: 1 }} />

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start" }}>
        <AppCard
          sx={{
            width: { xs: "100%", md: 280 },
            flexShrink: 0,
            position: { md: "sticky" },
            top: { md: 16 },
            maxHeight: { md: "calc(100vh - 140px)" },
            overflowY: "auto",
          }}
        >
          {roles.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>{t.noRoles}</Typography>
          ) : (
            <List dense>
              {roles.map((role) => (
                <ListItemButton
                  key={role._id}
                  selected={role._id === selectedRoleId}
                  onClick={() => setSelectedRoleId(role._id)}
                >
                  <ListItemText primary={role.name} />
                </ListItemButton>
              ))}
            </List>
          )}
        </AppCard>

        <AppCard sx={{ flex: 1, minWidth: 0 }}>
          {!selectedRoleId ? (
            <Typography color="text.secondary" sx={{ p: 3 }}>{t.selectRole}</Typography>
          ) : (
            <>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", p: 2, pb: 1.5 }}
              >
                <Typography variant="subtitle1" fontWeight="bold">{selectedRole?.name}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button disabled={!isDirty || saving} onClick={handleReset}>{t.reset}</Button>
                  <Button variant="contained" disabled={!isDirty || saving} onClick={handleSave}>
                    {t.save}
                  </Button>
                </Stack>
              </Stack>
              <Divider />

              <Box sx={{ p: 2, overflowY: "auto", maxHeight: { md: "calc(100vh - 260px)" } }}>
                <Stack spacing={2} divider={<Divider />}>
                  {permissions.map((perm) => {
                    const granted = assignments[perm.permissionId] || new Set();
                    const allChecked = perm.allowedActions.every((a) => granted.has(a));
                    const info = moduleData[perm.module] || FALLBACK_MODULE_INFO[perm.module];

                    return (
                      <Box key={perm.permissionId}>
                        <Box
                          sx={{
                            display: "flex",
                            width: "100%",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                            rowGap: 1,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "action.hover",
                                color: "primary.main",
                              }}
                            >
                              {getModuleIcon(info?.icon, { fontSize: "small" })}
                            </Avatar>
                            <Typography fontWeight="bold">
                              {info?.labels?.[language] || perm.module}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                            <Typography variant="caption" color="text.secondary">{t.selectAll}</Typography>
                            <Switch
                              size="small"
                              checked={allChecked}
                              onChange={(e) =>
                                toggleAllForModule(perm.permissionId, perm.allowedActions, e.target.checked)
                              }
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                            columnGap: 3,
                            rowGap: 1.5,
                          }}
                        >
                          {perm.allowedActions.map((action) => (
                            <FormControlLabel
                              key={action}
                              sx={{ mr: 0, minWidth: 0 }}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={granted.has(action)}
                                  onChange={() => toggleAction(perm.permissionId, action)}
                                />
                              }
                              label={
                                <Typography variant="body2" noWrap>
                                  {actionLabels[action]?.[language] || action}
                                </Typography>
                              }
                            />
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}
        </AppCard>
      </Box>
    </Container>
  );
}
