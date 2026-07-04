import { zodResolver } from "@hookform/resolvers/zod";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {
  Alert,
  Box,
  Button,
  Divider,
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
    email: z.string().email("Invalid email address"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    gym_name: z.string().min(1, "Gym name is required"),
    gym_city: z.string().optional(),
    gym_state: z.string().optional(),
    gym_address: z.string().optional(),
    branch_name: z.string().min(1, "Branch name is required"),
    branch_city: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
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
      const result = await registerUser({
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        gym_name: data.gym_name,
        gym_city: data.gym_city || "",
        gym_state: data.gym_state || "",
        gym_address: data.gym_address || "",
        branch_name: data.branch_name,
        branch_city: data.branch_city || "",
      });
      setRegisteredEmail(result?.email || data.email);
      setSuccess(true);
    } catch {
      setError("Registration failed. Please try again.");
    }
  };

  if (success) {
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
            width: "100%",
            maxWidth: 460,
            mx: 2,
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                fontSize: 48,
                color: "#E8E3D8",
                mb: 1,
              }}
            >
              &#9993;
            </Box>
            <Typography
              variant="h1"
              sx={{ fontSize: "2.5rem", color: "#E8E3D8" }}
            >
              Check Your Email
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
            <Typography
              variant="body1"
              sx={{ color: "#B0ACA3", mb: 2, textAlign: "center", fontFamily: '"Inter", sans-serif' }}
            >
              We sent a verification link to <strong style={{ color: "#E8E3D8" }}>{registeredEmail}</strong>.
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#6B6F6C", mb: 3, textAlign: "center", fontFamily: '"Inter", sans-serif' }}
            >
              Click the link in the email to activate your account. The link expires in 24 hours.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate({ to: "/login" })}
              sx={{ py: 1.5 }}
            >
              Go to Login
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

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
          maxWidth: 460,
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
            Join the Iron Empire
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
              label="Email"
              type="email"
              margin="normal"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
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
            </Box>
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
              {...register("confirm_password")}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password?.message}
            />

            <Divider sx={{ my: 3, borderColor: "#2A2D2B" }} />

            <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mb: 1, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
              Gym Details
            </Typography>
            <TextField
              fullWidth
              label="Gym Name *"
              margin="normal"
              {...register("gym_name")}
              error={!!errors.gym_name}
              helperText={errors.gym_name?.message}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="City"
                margin="normal"
                {...register("gym_city")}
                error={!!errors.gym_city}
                helperText={errors.gym_city?.message}
              />
              <TextField
                fullWidth
                label="State"
                margin="normal"
                {...register("gym_state")}
                error={!!errors.gym_state}
                helperText={errors.gym_state?.message}
              />
            </Box>
            <TextField
              fullWidth
              label="Address"
              margin="normal"
              {...register("gym_address")}
              error={!!errors.gym_address}
              helperText={errors.gym_address?.message}
            />

            <Divider sx={{ my: 3, borderColor: "#2A2D2B" }} />

            <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mb: 1, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
              First Branch
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Branch Name *"
                margin="normal"
                {...register("branch_name")}
                error={!!errors.branch_name}
                helperText={errors.branch_name?.message}
              />
              <TextField
                fullWidth
                label="City"
                margin="normal"
                {...register("branch_city")}
                error={!!errors.branch_city}
                helperText={errors.branch_city?.message}
              />
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isSubmitting ? "CREATING ACCOUNT..." : "JOIN NOW"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: "center", color: "#6B6F6C" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#D4FF3F", fontWeight: 700 }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
