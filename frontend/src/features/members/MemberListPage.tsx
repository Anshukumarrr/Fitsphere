import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useCreateMember, useMembers } from "../../hooks/useApi";

export default function MemberListPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useMembers({ search });
  const createMember = useCreateMember();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (formData: Record<string, unknown>) => {
    await createMember.mutateAsync(formData);
    reset();
    setOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Members
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Member
        </Button>
      </Box>

      <TextField
        size="small"
        placeholder="Search members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 300 }}
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                data?.results?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.user?.first_name} {member.user?.last_name}
                    </TableCell>
                    <TableCell>{member.user?.email}</TableCell>
                    <TableCell>{member.branch_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.membership_status}
                        color={
                          member.membership_status === "active"
                            ? "success"
                            : member.membership_status === "expired"
                              ? "error"
                              : "warning"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{member.membership_end_date || "-"}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Member</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Username" margin="normal" {...register("username")} />
            <TextField fullWidth label="Email" margin="normal" {...register("email")} />
            <TextField fullWidth label="Password" type="password" margin="normal" {...register("password")} />
            <TextField fullWidth label="First Name" margin="normal" {...register("first_name")} />
            <TextField fullWidth label="Last Name" margin="normal" {...register("last_name")} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Create Member
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
