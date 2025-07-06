"use client";

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
import { useState } from "react";
import { useRouter } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { registerUser } from "@/services/authService";
import { useMessage } from "@/contexts/MessageContext";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Register for",
    subtitle: "Create your account to start creating polls.",
    name: "Name",
    email: "Email",
    password: "Password",
    requiredName: "Name is required",
    requiredEmail: "Email is required",
    requiredPassword: "Password is required",
    register: "Register",
    registering: "Creating Account...",
    alreadyHave: "Already have an account?",
    loginHere: "Login here",
    poweredBy: "Powered by",
  },
  ar: {
    title: "سجل في",
    subtitle: "أنشئ حسابك للبدء في إنشاء الاستطلاعات.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    requiredName: "الاسم مطلوب",
    requiredEmail: "البريد الإلكتروني مطلوب",
    requiredPassword: "كلمة المرور مطلوبة",
    register: "سجل",
    registering: "جاري إنشاء الحساب...",
    alreadyHave: "هل لديك حساب بالفعل؟",
    loginHere: "تسجيل الدخول",
    poweredBy: "مشغل بواسطة",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { showMessage } = useMessage();
  const { globalConfig } = useGlobalConfig();
  const { t, dir, align } = useI18nLayout(translations);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = t.requiredName;
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
      await registerUser(form.name, form.email, form.password);
      showMessage("Account created successfully. Please login.", "success");
      router.push("/auth/login");
    } catch (err) {
      showMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Registration failed",
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
          textAlign="center"
          gutterBottom
        >
          {t.title} {globalConfig?.appName || "EventPass Suite"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
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
            label={t.name}
            name="name"
            fullWidth
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            inputProps={{ dir }}
          />
          <TextField
            label={t.email}
            name="email"
            type="email"
            fullWidth
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            inputProps={{ dir }}
          />
          <TextField
            label={t.password}
            name="password"
            type={showPassword ? "text" : "password"}
            fullWidth
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
                <PersonAddAltIcon />
              )
            }
            disabled={loading}
            sx={{ mt: 1, textTransform: "none", py: 1.5 }}
          >
            {loading ? t.registering : t.register}
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          {t.alreadyHave}{" "}
          <a
            href="/auth/login"
            style={{ color: "inherit", fontWeight: 500, textDecoration: "none" }}
          >
            {t.loginHere}
          </a>
        </Typography>

        <Divider sx={{ my: 3 }} />
        {globalConfig?.poweredBy.text && (
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
              style={{ color: "inherit", fontWeight: 500, textDecoration: "none" }}
            >
              {globalConfig?.poweredBy.text}
            </a>
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
