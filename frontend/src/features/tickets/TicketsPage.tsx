import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
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
import { useAuth } from "../../hooks/useAuth";
import { useCreateTicket, useTickets, useUpdateTicket } from "../../hooks/useApi";
import PaginationBar from "../../components/common/PaginationBar";

const statusColor: Record<string, "info" | "warning" | "success" | "default"> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "default",
};

const priorityColor: Record<string, "success" | "warning" | "error" | "default"> = {
  low: "success",
  medium: "warning",
  high: "error",
  urgent: "error",
};

export default function TicketsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  const { data, isLoading } = useTickets(params);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const [open, setOpen] = useState(false);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const { register, handleSubmit, reset } = useForm();

  const tickets = data?.results ?? [];

  const onSubmit = async (formData: Record<string, unknown>) => {
    await createTicket.mutateAsync(formData);
    reset();
    setOpen(false);
  };

  const handleResolve = async (id: number) => {
    await updateTicket.mutateAsync({ id, status: "resolved", resolution_notes: resolveNotes });
    setResolveId(null);
    setResolveNotes("");
  };

  const handleAssign = async (id: number) => {
    await updateTicket.mutateAsync({ id, status: "in_progress", assigned_to: user?.id });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Tickets
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {user?.role === "member"
              ? "Raise and track your support tickets"
              : user?.role === "trainer"
                ? "View member tickets and raise your own"
                : user?.role === "gym_owner"
                  ? "Manage tickets from members and trainers"
                  : "Manage all platform tickets"}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Raise a Ticket
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Raised By</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">Loading...</TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No tickets found</TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>
                      #{ticket.id}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250 }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                        {ticket.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ticket.raised_by_name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                        {ticket.raised_by_role?.replace("_", " ")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.priority} size="small" color={priorityColor[ticket.priority]} />
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.status.replace("_", " ")} size="small" color={statusColor[ticket.status]} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ticket.assigned_to_name || "—"}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {ticket.status === "open" && ticket.can_resolve && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAssign(ticket.id)}
                          >
                            Accept
                          </Button>
                        )}
                        {ticket.can_resolve && ticket.status !== "resolved" && ticket.status !== "closed" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => setResolveId(ticket.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Raise a Ticket</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Title" margin="normal" required {...register("title", { required: true })} />
            <TextField fullWidth label="Description" margin="normal" multiline rows={3} required {...register("description", { required: true })} />
            <TextField fullWidth label="Category" margin="normal" select defaultValue="general" {...register("category")}>
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
              <MenuItem value="membership">Membership</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField fullWidth label="Priority" margin="normal" select defaultValue="medium" {...register("priority")}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={createTicket.isPending}>
              {createTicket.isPending ? "Submitting..." : "Submit Ticket"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveId !== null} onClose={() => setResolveId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Ticket</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Resolution Notes"
            margin="normal"
            multiline
            rows={3}
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
          />
          <Button
            variant="contained"
            color="success"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => resolveId && handleResolve(resolveId)}
            disabled={updateTicket.isPending}
          >
            {updateTicket.isPending ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
