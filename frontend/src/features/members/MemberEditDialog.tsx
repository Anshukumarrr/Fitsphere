import { useEffect } from "react";
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
import { useUpdateMember } from "../../hooks/useApi";
import type { Member } from "../../types";

const editSchema = z.object({
  gender: z.string().min(1, "Gender is required"),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  health_notes: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  member: Member | null;
  onClose: () => void;
}

export default function MemberEditDialog({ open, member, onClose }: Props) {
  const updateMember = useUpdateMember();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (member) {
      reset({
        gender: member.gender || "",
        date_of_birth: member.date_of_birth || "",
        emergency_contact_name: member.emergency_contact_name || "",
        emergency_contact_phone: member.emergency_contact_phone || "",
        health_notes: member.health_notes || "",
      });
    }
  }, [member, reset]);

  const onSubmit = async (formData: EditForm) => {
    if (!member) return;
    await updateMember.mutateAsync({ id: member.id, ...formData });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Member Profile</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 1, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
            Profile Details
          </Typography>
          <TextField select fullWidth label="Gender *" margin="normal" {...register("gender")} error={!!errors.gender} helperText={errors.gender?.message}>
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
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
