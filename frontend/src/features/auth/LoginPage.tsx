import { zodResolver } from "@hookform/resolvers/zod";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {
  Alert,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const VERIFIED_MESSAGES: Record<string, { text: string; severity: "success" | "error" }> = {
  expired: { text: "Verification link has expired. Please register again.", severity: "error" },
  invalid: { text: "Invalid verification link.", severity: "error" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const verified = new URLSearchParams(window.location.search).get("verified") || undefined;
  const verifiedMsg = verified ? VERIFIED_MESSAGES[verified] : null;
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      await login(data.username, data.password);
      navigate({ to: "/dashboard" });
    } catch {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          mx: 2,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <FitnessCenterIcon
            sx={{
              fontSize: 48,
              color: "#E8E3D8",
              mb: 1,
            }}
          />
          <Typography
            variant="h1"
            sx={{ fontSize: "2.5rem", color: "#E8E3D8" }}
          >
            FitSphere
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontFamily: '"Inter", sans-serif' }}>
            Your Fitness Empire Starts Here
          </Typography>
        </Box>

          <Box
            sx={{
              p: 4,
              borderRadius: 2,
              border: "1px solid #2A2D2B",
              bgcolor: "#1A1D1B",
            }}
          >
            {verifiedMsg && (
            <Alert
              severity={verifiedMsg.severity}
              sx={{
                mb: 2,
                backgroundColor: verifiedMsg.severity === "success" ? "rgba(212,255,63,0.1)" : "rgba(255,75,62,0.1)",
                border: verifiedMsg.severity === "success" ? "1px solid rgba(212,255,63,0.3)" : "1px solid rgba(255,75,62,0.3)",
                color: verifiedMsg.severity === "success" ? "#D4FF3F" : "#FF4B3E",
              }}
            >
              {verifiedMsg.text}
            </Alert>
          )}
            {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, backgroundColor: "rgba(255,75,62,0.1)", border: "1px solid rgba(255,75,62,0.3)", color: "#FF4B3E" }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              {...register("username")}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isSubmitting ? "PUSHING HARD..." : "LET'S GO"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: "center", color: "#6B6F6C" }}>
            New to FitSphere?{" "}
            <Link to="/register" style={{ color: "#D4FF3F", fontWeight: 700 }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
