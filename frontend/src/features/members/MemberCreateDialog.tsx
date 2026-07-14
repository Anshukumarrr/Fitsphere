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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useCreateMember, useMembershipPlans } from "../../hooks/useApi";
import { setApiErrors } from "../../hooks/setApiErrors";

const memberSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  plan: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  health_notes: z.string().optional(),
});

type MemberForm = z.infer<typeof memberSchema>;

interface Props {
  open: boolean;
  branchId: number | null;
  onClose: () => void;
}

export default function MemberCreateDialog({ open, branchId, onClose }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMember = useCreateMember();
  const { data: plansData } = useMembershipPlans();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
  });

  const onSubmit = async (formData: MemberForm) => {
    if (!branchId) return;
    try {
      setSubmitError(null);
      const payload: Record<string, unknown> = { ...formData, branch: branchId };
      if (payload.plan) {
        payload.plan = Number(payload.plan);
      } else {
        delete payload.plan;
      }
      await createMember.mutateAsync(payload);
      reset();
      onClose();
    } catch (err: unknown) {
      const apiError = setApiErrors(err, setError);
      if (apiError) setSubmitError(apiError);
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Member</DialogTitle>
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
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="WhatsApp Number" margin="normal" {...register("whatsapp_number")} error={!!errors.whatsapp_number} helperText={errors.whatsapp_number?.message} />
          </Box>

          <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 2, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
            Membership & Member Details
          </Typography>
          <TextField select fullWidth label="Membership Plan" margin="normal" defaultValue="" {...register("plan")} error={!!errors.plan} helperText={errors.plan?.message}>
            <MenuItem value="">No Plan</MenuItem>
            {plansData?.results?.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name} ({p.duration_days} days)</MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Gender *" margin="normal" defaultValue="" {...register("gender")} error={!!errors.gender} helperText={errors.gender?.message}>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField fullWidth label="Date of Birth" type="date" margin="normal" slotProps={{ inputLabel: { shrink: true } }} {...register("date_of_birth")} error={!!errors.date_of_birth} helperText={errors.date_of_birth?.message} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="Emergency Contact Name" margin="normal" {...register("emergency_contact_name")} error={!!errors.emergency_contact_name} helperText={errors.emergency_contact_name?.message} />
            <TextField fullWidth label="Emergency Contact Phone" margin="normal" {...register("emergency_contact_phone")} error={!!errors.emergency_contact_phone} helperText={errors.emergency_contact_phone?.message} />
          </Box>
          <TextField fullWidth label="Health Notes" margin="normal" multiline rows={2} {...register("health_notes")} error={!!errors.health_notes} helperText={errors.health_notes?.message} />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Create Member
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
