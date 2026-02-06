"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Stack,
  Divider,
  InputAdornment,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { login } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import Background from "@/components/Background";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Sign in to",
    subtitle: "Enter your login details to access the dashboard.",
    email: "Email",
    password: "Password",
    requiredEmail: "Email is required",
    requiredPassword: "Password is required",
    login: "Sign In",
    loggingIn: "Logging in...",
    noAccount: "Don’t have an account?",
    register: "Register here",
    poweredBy: "Powered by",
    by: "by",
    featureOne: "Secure access for teams and organizers",
    featureTwo: "Role-based dashboards and permissions",
    featureThree: "Fast check-ins with real-time updates",
    contact: "Contact",
    support: "Support",
    leftTitle: "Event operations, unified.",
    leftBody:
      "Manage registration, check-in, and engagement from one secure suite.",
  },
  ar: {
    title: "تسجيل الدخول إلى",
    subtitle: "أدخل بيانات تسجيل الدخول للوصول إلى لوحة التحكم.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    requiredEmail: "البريد الإلكتروني مطلوب",
    requiredPassword: "كلمة المرور مطلوبة",
    login: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    noAccount: "ليس لديك حساب؟",
    register: "سجل هنا",
    poweredBy: "مشغل بواسطة",
    by: "بواسطة",
    featureOne: "وصول آمن للفرق والمنظمين",
    featureTwo: "لوحات تحكم وصلاحيات حسب الدور",
    featureThree: "تسجيل دخول سريع وتحديثات فورية",
    contact: "للتواصل",
    support: "الدعم",
    leftTitle: "عمليات الفعاليات في منصة واحدة.",
    leftBody: "أدر التسجيل والدخول والتفاعل من حزمة واحدة آمنة.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showMessage } = useMessage();
  const { globalConfig } = useGlobalConfig();
  const { t, dir, align } = useI18nLayout(translations);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = t.requiredEmail;
    if (!form.password) newErrors.password = t.requiredPassword;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await login(form.email, form.password);
      setUser(response.user);
      if (response.user.role === "staff") {
        router.push("/staff");
      } else if (
        response.user.role === "business" ||
        response.user.role === "admin" ||
        response.user.role === "superadmin"
      ) {
        router.push("/cms");
      }
    } catch (err) {
      showMessage(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      dir={dir}
    >
      <Background />
      <Container maxWidth="md">
        <Paper
          elevation={6}
          sx={(theme) => ({
            p: { xs: 2, md: 3 },
            mt: { xs: 2, md: 4 },
            borderRadius: 4,
            background:
              theme.palette.mode === "dark"
                ? "rgba(18, 18, 18, 0.9)"
                : "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          })}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box
              sx={(theme) => ({
                flex: 1,
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                color: theme.palette.primary.contrastText,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${
                  theme.palette.secondary
                    ? theme.palette.secondary.main
                    : theme.palette.primary.dark
                } 100%)`,
                minHeight: { xs: "auto", md: 420 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: align,
              })}
            >
              <Box sx={{ pt: 0.5 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      opacity: 0.98,
                      letterSpacing: 0.2,
                      textTransform: "none",
                      fontSize: { xs: "1.25rem", md: "1.45rem" },
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    {globalConfig?.appName || "EventPass Suite"}
                  </Typography>
                  {globalConfig?.companyLogoUrl && (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      sx={{ opacity: 0.9 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}
                      >
                        {t.by}
                      </Typography>
                      <Box
                        component="img"
                        src={globalConfig.companyLogoUrl}
                        alt={`${globalConfig?.appName || "EventPass Suite"} logo`}
                        sx={{
                          height: { xs: 22, md: 24 },
                          maxWidth: 140,
                          objectFit: "contain",
                          filter: "brightness(1.05)",
                        }}
                      />
                    </Stack>
                  )}
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 2.5 }}>
                  {t.leftTitle}
                </Typography>
                <Typography sx={{ mt: 1, opacity: 0.9 }}>
                  {t.leftBody}
                </Typography>
              </Box>
              <Stack spacing={1.5} sx={{ mt: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ICONS.checkCircleOutline fontSize="small" />
                  <Typography variant="body2">{t.featureOne}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ICONS.checkCircleOutline fontSize="small" />
                  <Typography variant="body2">{t.featureTwo}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ICONS.checkCircleOutline fontSize="small" />
                  <Typography variant="body2">{t.featureThree}</Typography>
                </Stack>
              </Stack>
              {(globalConfig?.contact?.email ||
                globalConfig?.contact?.phone ||
                globalConfig?.support?.email ||
                globalConfig?.support?.phone) && (
                <Stack spacing={0.75} sx={{ mt: 2.5, opacity: 0.9 }}>
                  {(globalConfig?.contact?.email ||
                    globalConfig?.contact?.phone) && (
                    <Stack spacing={0.35}>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        {t.contact}
                      </Typography>
                      {globalConfig?.contact?.email && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ICONS.email fontSize="inherit" sx={{ fontSize: 14 }} />
                          <Typography variant="body2" fontSize="0.75rem">
                            {globalConfig.contact.email}
                          </Typography>
                        </Stack>
                      )}
                      {globalConfig?.contact?.phone && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ICONS.phone fontSize="inherit" sx={{ fontSize: 14 }} />
                          <Typography variant="body2" fontSize="0.75rem">
                            {globalConfig.contact.phone}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  )}

                  {(globalConfig?.support?.email ||
                    globalConfig?.support?.phone) && (
                    <Stack spacing={0.35}>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        {t.support}
                      </Typography>
                      {globalConfig?.support?.email && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ICONS.email fontSize="inherit" sx={{ fontSize: 14 }} />
                          <Typography variant="body2" fontSize="0.75rem">
                            {globalConfig.support.email}
                          </Typography>
                        </Stack>
                      )}
                      {globalConfig?.support?.phone && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ICONS.phone fontSize="inherit" sx={{ fontSize: 14 }} />
                          <Typography variant="body2" fontSize="0.75rem">
                            {globalConfig.support.phone}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Stack>
              )}
            </Box>

            <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
              <Typography
                variant="h5"
                fontWeight={700}
                textAlign={align}
                gutterBottom
              >
                {t.login}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign={align}
                sx={{ mb: 3 }}
              >
                {t.subtitle}
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <TextField
                  fullWidth
                  label={t.email}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  inputProps={{ dir }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ICONS.emailOutline fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label={t.password}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  inputProps={{ dir }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ICONS.vpnKey fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <ICONS.hide /> : <ICONS.view />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ICONS.login />
                    )
                  }
                  disabled={loading}
                  disableElevation
                  sx={{ mt: 1 }}
                >
                  {loading ? t.loggingIn : t.login}
                </Button>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                align={align}
                sx={{ mt: 2 }}
              >
                {t.noAccount}{" "}
                <span
                  onClick={() => router.push("/auth/register")}
                  style={{
                    color: "inherit",
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  {t.register}
                </span>
              </Typography>

              {globalConfig?.poweredBy?.text && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    textAlign={align}
                  >
                    {globalConfig?.poweredBy?.mediaUrl && (
                      <Box
                        component="img"
                        src={globalConfig.poweredBy.mediaUrl}
                        alt={`${globalConfig?.poweredBy?.text} logo`}
                        sx={{
                          height: 20,
                          maxWidth: 120,
                          objectFit: "contain",
                          mr: dir === "rtl" ? 0 : 1,
                          ml: dir === "rtl" ? 1 : 0,
                          verticalAlign: "middle",
                          display: "inline-block",
                        }}
                      />
                    )}
                    {t.poweredBy}{" "}
                    <a
                      href={globalConfig?.socialLinks?.website || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "inherit",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {globalConfig?.poweredBy?.text}
                    </a>
                  </Typography>
                </>
              )}

            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
