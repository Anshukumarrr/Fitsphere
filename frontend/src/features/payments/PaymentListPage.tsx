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
import { useCreatePayment, usePayments } from "../../hooks/useApi";
import PaginationBar from "../../components/common/PaginationBar";
import SearchInput from "../../components/common/SearchInput";

export default function PaymentListPage() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  if (search) params.search = search;
  const { data, isLoading } = usePayments(params);
  const createPayment = useCreatePayment();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (formData: Record<string, unknown>) => {
    await createPayment.mutateAsync(formData);
    reset();
    setOpen(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Payments
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search payments..." />
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Record Payment
          </Button>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Member</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : (
                data?.results?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.invoice_number}</TableCell>
                    <TableCell>{payment.member_name}</TableCell>
                    <TableCell>{payment.payment_type}</TableCell>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>
                      <Chip label={payment.status} color={statusColor(payment.status)} size="small" />
                    </TableCell>
                    <TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Member ID" margin="normal" type="number" {...register("member")} />
            <TextField fullWidth label="Amount" margin="normal" type="number" {...register("amount")} />
            <TextField fullWidth label="Type" margin="normal" select {...register("payment_type")}>
              <MenuItem value="membership">Membership</MenuItem>
              <MenuItem value="pt_package">PT Package</MenuItem>
              <MenuItem value="renewal">Renewal</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField fullWidth label="Method" margin="normal" select {...register("payment_method")}>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
            </TextField>
            <TextField fullWidth label="Description" margin="normal" multiline rows={2} {...register("description")} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Record Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
