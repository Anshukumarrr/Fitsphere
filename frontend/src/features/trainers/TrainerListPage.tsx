import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
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
import { useCreateTrainer, useTrainers } from "../../hooks/useApi";

export default function TrainerListPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useTrainers();
  const createTrainer = useCreateTrainer();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (formData: Record<string, unknown>) => {
    await createTrainer.mutateAsync(formData);
    reset();
    setOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Trainers
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Trainer
        </Button>
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
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Trainer</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="User ID" margin="normal" type="number" {...register("user_id")} />
            <TextField fullWidth label="Specialization" margin="normal" {...register("specialization")} />
            <TextField fullWidth label="Bio" margin="normal" multiline rows={2} {...register("bio")} />
            <TextField fullWidth label="Qualifications" margin="normal" multiline rows={2} {...register("qualifications")} />
            <TextField fullWidth label="Years of Experience" margin="normal" type="number" {...register("years_of_experience")} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Create Trainer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
