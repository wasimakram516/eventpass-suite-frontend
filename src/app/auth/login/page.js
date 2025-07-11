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
import LoginIcon from "@mui/icons-material/Login";
import HomeIcon from "@mui/icons-material/Home";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRouter } from "next/navigation";
import { login } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import useI18nLayout from "@/hooks/useI18nLayout";

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
        response.user.role === "admin"
      ) {
        router.push("/cms");
      }
      showMessage("Login successful!", "success");
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
    <Container maxWidth="sm" dir={dir}>
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <IconButton onClick={() => router.push("/")} aria-label="Go home">
            <HomeIcon />
          </IconButton>
        </Stack>

        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign={"center"}
          gutterBottom
        >
          {t.title} {globalConfig?.appName || "EventPass Suite"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign={"center"}
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
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
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
                <LoginIcon />
              )
            }
            disabled={loading}
            sx={{ mt: 1, textTransform: "none", py: 1.5 }}
          >
            {loading ? t.loggingIn : t.login}
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          {t.noAccount}{" "}
          <a
            href="/auth/register"
            style={{
              color: "inherit",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {t.register}
          </a>
        </Typography>

        <Divider sx={{ my: 3 }} />
        {globalConfig?.poweredBy.text !== "" && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            textAlign="center"
          >
            {t.poweredBy}{" "}
            <a
              href={globalConfig?.socialLinks?.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "inherit",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {globalConfig?.poweredBy.text}
            </a>
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
