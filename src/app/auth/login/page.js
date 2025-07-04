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

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showMessage } = useMessage();

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
      // const response = await login(form.email, form.password);
      // setUser(response.user);

      // Simulate dummy login success
      // const dummyUser = {
      //   name: "Admin",
      //   email: "admin@wwds.com",
      //   role: "admin",
      // };
      const dummyUser = {
        name: "Business User",
        email: "business@wwds.com",
        role: "business",
        businessSlug: "demo-corp",
      };
      
      setUser(dummyUser); 
      router.push("/cms"); 
    } catch (err) {
      showMessage("Login failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <IconButton onClick={() => router.push("/")} aria-label="Go home">
            <HomeIcon />
          </IconButton>
        </Stack>

        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          Sign in to EventPass CMS
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 3 }}
        >
          Enter your login details to access the dashboard.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
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
            {loading ? "Logging in..." : "Sign In"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Don’t have an account?{" "}
          <a
            href="/auth/register"
            style={{ color: "inherit", fontWeight: 500, textDecoration: "none" }}
          >
            Register here
          </a>
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          Powered by{" "}
          <a
            href="https://whitewall.om"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", fontWeight: 500, textDecoration: "none" }}
          >
            WhiteWall Digital Solutions
          </a>
        </Typography>
      </Paper>
    </Container>
  );
}
