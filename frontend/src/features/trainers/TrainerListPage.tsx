import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBranches, useCreateTrainer, useTrainers } from "../../hooks/useApi";
import { setApiErrors } from "../../hooks/setApiErrors";
import PaginationBar from "../../components/common/PaginationBar";
import SearchInput from "../../components/common/SearchInput";

const trainerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  branch: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  qualifications: z.string().optional(),
  years_of_experience: z.string().optional(),
  hourly_rate: z.string().optional(),
  max_members: z.string().optional(),
});

type TrainerForm = z.infer<typeof trainerSchema>;

export default function TrainerListPage() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  if (search) params.search = search;
  const { data, isLoading } = useTrainers(params);
  const createTrainer = useCreateTrainer();
  const { data: branches } = useBranches();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<TrainerForm>({
    resolver: zodResolver(trainerSchema),
  });

  const onSubmit = async (formData: TrainerForm) => {
    try {
      setSubmitError(null);
      const payload: Record<string, unknown> = { ...formData };
      if (payload.branch) payload.branch = Number(payload.branch);
      else delete payload.branch;
      if (payload.years_of_experience) payload.years_of_experience = Number(payload.years_of_experience);
      if (payload.hourly_rate) payload.hourly_rate = Number(payload.hourly_rate);
      if (payload.max_members) payload.max_members = Number(payload.max_members);
      await createTrainer.mutateAsync(payload);
      reset();
      setOpen(false);
    } catch (err) {
      const apiError = setApiErrors(err, setError);
      if (apiError) setSubmitError(apiError);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Trainers
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search trainers..." />
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Add Trainer
          </Button>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Active Members</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : (
                data?.results?.map((trainer) => (
                    <TableRow key={trainer.id}>
                    <TableCell>{trainer.full_name}</TableCell>
                    <TableCell>{trainer.branch_name || "—"}</TableCell>
                    <TableCell>{trainer.specialization}</TableCell>
                    <TableCell>{trainer.years_of_experience} yrs</TableCell>
                    <TableCell>{trainer.session_rating}</TableCell>
                    <TableCell>{trainer.active_member_count}</TableCell>
                    <TableCell>{trainer.is_active ? "Active" : "Inactive"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
      </Card>

      <Dialog open={open} onClose={() => { setSubmitError(null); setOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Trainer</DialogTitle>
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

            <Typography variant="subtitle2" sx={{ color: "#E8E3D8", mt: 2, mb: 0.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.75rem" }}>
              Trainer Details
            </Typography>
            <TextField select fullWidth label="Branch" margin="normal" defaultValue="" {...register("branch")} error={!!errors.branch} helperText={errors.branch?.message}>
              <MenuItem value="">None</MenuItem>
              {branches?.results?.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField fullWidth label="Specialization" margin="normal" {...register("specialization")} error={!!errors.specialization} helperText={errors.specialization?.message} />
              <TextField fullWidth label="Years of Experience" margin="normal" {...register("years_of_experience")} error={!!errors.years_of_experience} helperText={errors.years_of_experience?.message} />
            </Box>
            <TextField fullWidth label="Bio" margin="normal" multiline rows={2} {...register("bio")} error={!!errors.bio} helperText={errors.bio?.message} />
            <TextField fullWidth label="Qualifications" margin="normal" multiline rows={2} {...register("qualifications")} error={!!errors.qualifications} helperText={errors.qualifications?.message} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Create Trainer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
