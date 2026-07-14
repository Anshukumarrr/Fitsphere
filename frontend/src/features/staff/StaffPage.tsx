import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useBranches, useCreateStaff } from "../../hooks/useApi";
import StaffRoleAccordion from "./StaffRoleAccordion";

const ROLE_LABELS: Record<string, string> = {
  manager: "Managers",
  trainer: "Trainers",
  receptionist: "Receptionists",
  instructor: "Instructors",
  security: "Security",
  cleaner: "Cleaners",
  maintenance: "Maintenance",
};

const ROLE_SINGULAR: Record<string, string> = {
  manager: "Manager",
  trainer: "Trainer",
  receptionist: "Receptionist",
  instructor: "Instructor",
  security: "Security",
  cleaner: "Cleaner",
  maintenance: "Maintenance",
};

const ROLE_ORDER = ["manager", "trainer", "receptionist", "instructor", "security", "cleaner", "maintenance"];

const staffSchema = z.object({
  role: z.string().min(1),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  branch_id: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  qualifications: z.string().optional(),
  years_of_experience: z.string().optional(),
  hourly_rate: z.string().optional(),
  max_members: z.string().optional(),
});

type StaffForm = z.infer<typeof staffSchema>;

const roleColor = (role: string) => {
  const colors: Record<string, string> = {
    manager: "#FF9800",
    trainer: "#4CAF50",
    receptionist: "#2196F3",
    instructor: "#9C27B0",
    security: "#F44336",
    cleaner: "#00BCD4",
    maintenance: "#607D8B",
  };
  return colors[role] || "#6B6F6C";
};

export default function StaffPage() {
  const [open, setOpen] = useState(false);
  const createStaff = useCreateStaff();
  const { data: branches } = useBranches();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
  });

  const watchedRole = watch("role");

  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (formData: StaffForm) => {
    try {
      setSubmitError(null);
      const payload: Record<string, unknown> = { ...formData } as Record<string, unknown>;
      if (payload.branch_id) payload.branch_id = Number(payload.branch_id);
      else delete payload.branch_id;
      if (payload.years_of_experience) payload.years_of_experience = Number(payload.years_of_experience);
      if (payload.hourly_rate) payload.hourly_rate = Number(payload.hourly_rate);
      if (payload.max_members) payload.max_members = Number(payload.max_members);
      await createStaff.mutateAsync(payload);
      reset();
      setOpen(false);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object" && "detail" in (data as Record<string, unknown>)) {
        setSubmitError((data as Record<string, string>).detail);
      } else if (data && typeof data === "object") {
        setSubmitError(Object.values(data as Record<string, unknown>).flat().join(", "));
      } else if (typeof data === "string") {
        setSubmitError(data);
      } else {
        setSubmitError("An unexpected error occurred.");
      }
    }
  };

  const handleOpen = (role: string) => {
    reset({ role } as StaffForm);
    setOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Staff
        </Typography>
        {user?.role !== "super_admin" && (
          <Box sx={{ display: "flex", gap: 1 }}>
            {ROLE_ORDER.map((role) => (
              <Button
                key={role}
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => handleOpen(role)}
                sx={{
                  borderColor: `${roleColor(role)}44`,
                  color: roleColor(role),
                  "&:hover": { borderColor: roleColor(role), bgcolor: `${roleColor(role)}11` },
                  textTransform: "capitalize",
                }}
              >
                {ROLE_SINGULAR[role]}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      {ROLE_ORDER.map((role) => (
        <StaffRoleAccordion key={role} role={role} label={ROLE_LABELS[role]} color={roleColor(role)} />
      ))}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add {watchedRole ? ROLE_SINGULAR[watchedRole] || "Staff" : "Staff"}</DialogTitle>
        <DialogContent>
          {submitError && (
            <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>
              {submitError}
            </Typography>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 1, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
              Account Details
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="Username *" margin="normal" {...register("username")} error={!!errors.username} helperText={errors.username?.message} />
              <TextField fullWidth label="Email *" type="email" margin="normal" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="First Name *" margin="normal" {...register("first_name")} error={!!errors.first_name} helperText={errors.first_name?.message} />
              <TextField fullWidth label="Last Name *" margin="normal" {...register("last_name")} error={!!errors.last_name} helperText={errors.last_name?.message} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="Password *" type="password" margin="normal" {...register("password")} error={!!errors.password} helperText={errors.password?.message} />
              <TextField fullWidth label="Phone" margin="normal" {...register("phone")} error={!!errors.phone} helperText={errors.phone?.message} />
            </Box>

            <TextField select fullWidth label="Branch" margin="normal" defaultValue="" {...register("branch_id")} error={!!errors.branch_id} helperText={errors.branch_id?.message}>
              <MenuItem value="">None</MenuItem>
              {branches?.results?.map((b) => (
                <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>
              ))}
            </TextField>

            {watchedRole === "trainer" && (
              <>
                <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 2, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
                  Trainer Details
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField fullWidth label="Specialization" margin="normal" {...register("specialization")} error={!!errors.specialization} helperText={errors.specialization?.message} />
                  <TextField fullWidth label="Years of Experience" margin="normal" {...register("years_of_experience")} error={!!errors.years_of_experience} helperText={errors.years_of_experience?.message} />
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField fullWidth label="Hourly Rate" margin="normal" {...register("hourly_rate")} error={!!errors.hourly_rate} helperText={errors.hourly_rate?.message} />
                  <TextField fullWidth label="Max Members" margin="normal" {...register("max_members")} error={!!errors.max_members} helperText={errors.max_members?.message} />
                </Box>
                <TextField fullWidth label="Bio" margin="normal" multiline rows={2} {...register("bio")} error={!!errors.bio} helperText={errors.bio?.message} />
                <TextField fullWidth label="Qualifications" margin="normal" multiline rows={2} {...register("qualifications")} error={!!errors.qualifications} helperText={errors.qualifications?.message} />
              </>
            )}

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Create {watchedRole ? ROLE_SINGULAR[watchedRole] || "Staff" : "Staff"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
