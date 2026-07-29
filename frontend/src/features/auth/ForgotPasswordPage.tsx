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
import { useForgotPassword } from "../../hooks/useApi";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      setError("");
      await forgotPassword.mutateAsync(data.email);
      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420, mx: 2 }}>
        <Box sx={{ textAlign: "center", mb: 4, cursor: "pointer" }} onClick={() => navigate({ to: "/" })}>
          <FitnessCenterIcon sx={{ fontSize: 48, color: "#E8E3D8", mb: 1 }} />
          <Typography variant="h1" sx={{ fontSize: "2.5rem", color: "#E8E3D8" }}>
            FitSphere
          </Typography>
        </Box>

        <Box sx={{ p: 4, borderRadius: 2, border: "1px solid #2A2D2B", bgcolor: "#1A1D1B" }}>
          <Typography variant="h6" sx={{ mb: 1, color: "#E8E3D8", fontFamily: '"Anton", sans-serif', letterSpacing: "0.04em" }}>
            Reset Password
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>
            Enter your email and we'll send you a reset link.
          </Typography>

          {sent ? (
            <Alert severity="success" sx={{ backgroundColor: "rgba(212,255,63,0.1)", border: "1px solid rgba(212,255,63,0.3)", color: "#D4FF3F" }}>
              If an account with that email exists, a password reset link has been sent.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, backgroundColor: "rgba(255,75,62,0.1)", border: "1px solid rgba(255,75,62,0.3)", color: "#FF4B3E" }}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={forgotPassword.isPending}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {forgotPassword.isPending ? "SENDING..." : "SEND RESET LINK"}
              </Button>
            </form>
          )}

          <Typography variant="body2" sx={{ textAlign: "center", color: "#6B6F6C" }}>
            <Link to="/login" style={{ color: "#D4FF3F", fontWeight: 700 }}>
              Back to Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
