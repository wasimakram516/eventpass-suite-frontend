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

export default function RegisterPage() {
  const router = useRouter();
  const { showMessage } = useMessage();
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
    if (!form.name) newErrors.name = "Name is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
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
        err?.response?.data?.message || "Registration failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
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
          Register for EventPass CMS
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 3 }}
        >
          Create your account to start creating polls.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Name"
            name="name"
            fullWidth
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            fullWidth
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={form.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
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
            sx={{ mt: 1 }}
          >
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          Already have an account?{" "}
          <a href="/auth/login" style={{ color: "#033649", fontWeight: 500 }}>
            Login here
          </a>
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
        >
          Powered by{" "}
          <a
            href="https://whitewall.om"
            target="_blank"
            style={{ color: "#033649" }}
          >
            WhiteWall Digital Solutions
          </a>
        </Typography>
      </Paper>
    </Container>
  );
}
