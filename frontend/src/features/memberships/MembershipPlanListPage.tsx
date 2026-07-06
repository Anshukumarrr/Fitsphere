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
import { useCreateMembershipPlan, useMembershipPlans } from "../../hooks/useApi";
import PaginationBar from "../../components/common/PaginationBar";

export default function MembershipPlanListPage() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  const { data, isLoading } = useMembershipPlans(params);
  const createPlan = useCreateMembershipPlan();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (formData: Record<string, unknown>) => {
    await createPlan.mutateAsync(formData);
    reset();
    setOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Membership Plans
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Plan
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Billing Cycle</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading...</TableCell>
                </TableRow>
              ) : (
                data?.results?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.duration}</TableCell>
                    <TableCell>₹{plan.price}</TableCell>
                    <TableCell>{plan.billing_cycle}</TableCell>
                    <TableCell>{plan.is_active ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Membership Plan</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Name" margin="normal" {...register("name")} />
            <TextField fullWidth label="Description" margin="normal" multiline rows={2} {...register("description")} />
            <TextField fullWidth label="Duration (days)" margin="normal" type="number" {...register("duration_days")} />
            <TextField fullWidth label="Price" margin="normal" type="number" {...register("price")} />
            <TextField fullWidth label="Duration" margin="normal" select {...register("duration")}>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="half_yearly">Half Yearly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Create Plan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
