import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import apiClient from "../../api/client";
import { setApiErrors } from "../../hooks/setApiErrors";

const STAFF_ROLES = [
  { value: "trainer", label: "Trainer" },
  { value: "receptionist", label: "Receptionist" },
  { value: "manager", label: "Manager" },
  { value: "instructor", label: "Instructor" },
  { value: "security", label: "Security" },
  { value: "cleaner", label: "Cleaner" },
  { value: "maintenance", label: "Maintenance" },
] as const;

const staffSchema = z
  .object({
    role: z.string().min(1, "Select your role"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    phone: z.string().optional(),
    invite_code: z
      .string()
      .trim()
      .min(6, "Invite code is required — ask your gym owner")
      .max(6, "Invite codes are 6 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type StaffForm = z.infer<typeof staffSchema>;

export default function StaffRegisterForm({
  onError,
  onSuccess,
  onBack,
}: {
  onError: (message: string) => void;
  onSuccess: (email: string) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
  });

  const onSubmit = async (data: StaffForm) => {
    try {
      onError("");
      const { data: response } = await apiClient.post("/auth/register-staff/", {
        role: data.role,
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        phone: data.phone || "",
        invite_code: data.invite_code.toUpperCase(),
      });
      onSuccess(response?.email || data.email);
    } catch (err) {
      const apiError = setApiErrors(err, setFieldError);
      if (apiError) onError(apiError);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{ color: "#E8E3D8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          Staff — Join Your Gym
        </Typography>
        <Button size="small" onClick={onBack} sx={{ color: "#8A8F8C", textTransform: "none" }}>
          ← Back
        </Button>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          fullWidth
          select
          label="Your Role *"
          margin="normal"
          defaultValue=""
          {...register("role")}
          error={!!errors.role}
          helperText={errors.role?.message}
        >
          <MenuItem value="" disabled>
            Select role
          </MenuItem>
          {STAFF_ROLES.map((role) => (
            <MenuItem key={role.value} value={role.value}>
              {role.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          label="Invite Code *"
          margin="normal"
          placeholder="e.g. K7M2PQ"
          {...register("invite_code")}
          error={!!errors.invite_code}
          helperText={errors.invite_code?.message ?? "Ask your gym owner — codes refresh daily at 12:01 AM"}
        />
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
          label="Phone (optional)"
          margin="normal"
          {...register("phone")}
          error={!!errors.phone}
          helperText={errors.phone?.message}
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
          {...register("confirm_password")}
          error={!!errors.confirm_password}
          helperText={errors.confirm_password?.message}
        />

        <Divider sx={{ my: 3, borderColor: "#2A2D2B" }} />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 1, mb: 2, py: 1.5 }}
        >
          {isSubmitting ? "JOINING..." : "JOIN GYM"}
        </Button>
      </form>
    </>
  );
}
