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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
        background: "radial-gradient(ellipse at top, #1A1A1A 0%, #050505 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background:
            "radial-gradient(circle at 30% 50%, rgba(255,109,0,0.03) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(0,230,118,0.03) 0%, transparent 50%)",
          pointerEvents: "none",
        },
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
              fontSize: 56,
              color: "#FF6D00",
              mb: 1,
              filter: "drop-shadow(0 0 20px rgba(255,109,0,0.3))",
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #FF6D00 0%, #FF9100 50%, #FF6D00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 30px rgba(255,109,0,0.2))",
            }}
          >
            FitSphere
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Your Fitness Empire Starts Here
          </Typography>
        </Box>

        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            border: "1px solid #2A2A2A",
            background: "linear-gradient(180deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.95) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, backgroundColor: "rgba(255,23,68,0.1)", border: "1px solid rgba(255,23,68,0.3)" }}
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

          <Typography variant="body2" sx={{ textAlign: "center", color: "#666" }}>
            New to FitSphere?{" "}
            <Link to="/register" style={{ color: "#FF6D00", fontWeight: 700 }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
