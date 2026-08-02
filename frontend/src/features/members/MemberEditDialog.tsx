import { useEffect, useState } from "react";
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
import { setApiErrors } from "../../hooks/setApiErrors";

const editSchema = z.object({
  gender: z.string().min(1, "Gender is required"),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  health_notes: z.string().optional(),
  membership_end_date: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  member: Member | null;
  onClose: () => void;
}

export default function MemberEditDialog({ open, member, onClose }: Props) {
  const updateMember = useUpdateMember();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
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
        whatsapp_number: member.whatsapp_number || "",
        health_notes: member.health_notes || "",
        membership_end_date: member.membership_end_date || "",
      });
    }
  }, [member, reset]);

  const onSubmit = async (formData: EditForm) => {
    if (!member) return;
    try {
      setSubmitError(null);
      // Empty optional date inputs submit as "" — DRF rejects "" with 400,
      // and sending null would deactivate the member's active membership row
      // via the backend sync helper. Omit the field entirely when empty.
      const payload: { id: number } & Record<string, unknown> = { id: member.id, ...formData };
      if (!formData.membership_end_date) delete payload.membership_end_date;
      await updateMember.mutateAsync(payload);
      reset();
      onClose();
    } catch (err) {
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
      <DialogTitle>Edit Member Profile</DialogTitle>
      <DialogContent>
        {submitError && (
          <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>
            {submitError}
          </Typography>
        )}
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
            <TextField fullWidth label="WhatsApp Number" margin="normal" {...register("whatsapp_number")} error={!!errors.whatsapp_number} helperText={errors.whatsapp_number?.message} />
          </Box>
          <TextField fullWidth label="Health Notes" margin="normal" multiline rows={2} {...register("health_notes")} error={!!errors.health_notes} helperText={errors.health_notes?.message} />
          <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 2, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
            Membership
          </Typography>
          <TextField fullWidth label="Membership End Date" type="date" margin="normal" slotProps={{ inputLabel: { shrink: true } }} {...register("membership_end_date")} error={!!errors.membership_end_date} helperText={errors.membership_end_date?.message} />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={updateMember.isPending}>
            {updateMember.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
