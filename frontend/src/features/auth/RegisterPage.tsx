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

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError("");
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      navigate({ to: "/dashboard" });
    } catch {
      setError("Registration failed. Please try again.");
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
          maxWidth: 480,
          mx: 2,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <FitnessCenterIcon
            sx={{
              fontSize: 48,
              color: "#FF6D00",
              mb: 1,
              filter: "drop-shadow(0 0 20px rgba(255,109,0,0.3))",
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #FF6D00 0%, #FF9100 50%, #FF6D00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Join FitSphere
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start building your fitness business
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
              label="Email"
              margin="normal"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              fullWidth
              label="First Name"
              margin="normal"
              {...register("first_name")}
              error={!!errors.first_name}
              helperText={errors.first_name?.message}
            />
            <TextField
              fullWidth
              label="Last Name"
              margin="normal"
              {...register("last_name")}
              error={!!errors.last_name}
              helperText={errors.last_name?.message}
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
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              margin="normal"
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
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
              {isSubmitting ? "CREATING..." : "CREATE ACCOUNT"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: "center", color: "#666" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#FF6D00", fontWeight: 700 }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
