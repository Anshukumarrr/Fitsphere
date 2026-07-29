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
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useResetPassword } from "../../hooks/useApi";

const schema = z
  .object({
    password: z.string().min(6, "At least 6 characters"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "__root__" }) as { token?: string; uid?: string };
  const resetPassword = useResetPassword();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    if (!search.token || !search.uid) {
      setError("Invalid or missing reset link parameters.");
      return;
    }
    try {
      setError("");
      await resetPassword.mutateAsync({
        token: search.token,
        uid: search.uid,
        password: data.password,
      });
      setDone(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail?: string } } }).response?.data?.detail || "Reset link is invalid or expired."
          : "Something went wrong.";
      setError(msg);
    }
  };

  const invalidLink = !search.token || !search.uid;

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
          {invalidLink ? (
            <>
              <Alert severity="error" sx={{ backgroundColor: "rgba(255,75,62,0.1)", border: "1px solid rgba(255,75,62,0.3)", color: "#FF4B3E", mb: 2 }}>
                Invalid reset link. Please request a new one.
              </Alert>
              <Typography variant="body2" sx={{ textAlign: "center" }}>
                <Link to="/forgot-password" style={{ color: "#D4FF3F", fontWeight: 700 }}>
                  Request new reset link
                </Link>
              </Typography>
            </>
          ) : done ? (
            <>
              <Alert severity="success" sx={{ backgroundColor: "rgba(212,255,63,0.1)", border: "1px solid rgba(212,255,63,0.3)", color: "#D4FF3F", mb: 2 }}>
                Password has been reset successfully!
              </Alert>
              <Typography variant="body2" sx={{ textAlign: "center" }}>
                <Link to="/login" style={{ color: "#D4FF3F", fontWeight: 700 }}>
                  Go to Login
                </Link>
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 1, color: "#E8E3D8", fontFamily: '"Anton", sans-serif', letterSpacing: "0.04em" }}>
                Set New Password
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: "#6B6F6C", fontFamily: '"Inter", sans-serif' }}>
                Enter your new password below.
              </Typography>
              <form onSubmit={handleSubmit(onSubmit)}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2, backgroundColor: "rgba(255,75,62,0.1)", border: "1px solid rgba(255,75,62,0.3)", color: "#FF4B3E" }}>
                    {error}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="New Password"
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
                  {...register("confirm")}
                  error={!!errors.confirm}
                  helperText={errors.confirm?.message}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={resetPassword.isPending}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {resetPassword.isPending ? "RESETTING..." : "RESET PASSWORD"}
                </Button>
              </form>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
