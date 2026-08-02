import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Receipt } from "@mui/icons-material";
import { useMyPayments, useMembershipPlans, usePTPackages } from "../../hooks/useApi";
import PaginationBar from "../../components/common/PaginationBar";
import RazorpayCheckoutButton from "./RazorpayCheckoutButton";

type DialogType = "membership_plan" | "pt_package" | null;

export default function MyPaymentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogType>(null);
  const params: Record<string, string> = {};
  if (page > 1) params.page = String(page);
  const { data, isLoading } = useMyPayments(params);
  const { data: planData } = useMembershipPlans({ is_active: "true" });
  const { data: pkgData } = usePTPackages({ is_active: "true" });
  const plans = planData?.results ?? [];
  const packages = pkgData?.results ?? [];
  const items = dialog === "membership_plan" ? plans : packages;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">My Payment History</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={() => setDialog("membership_plan")}>
            Buy Membership
          </Button>
          <Button variant="outlined" onClick={() => setDialog("pt_package")}>
            Buy PT Package
          </Button>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Receipt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : data?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "#8A8F8C", fontStyle: "italic" }}>
                    No payments yet.
                  </TableCell>
                </TableRow>
              ) : (
                data?.results?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paid_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>
                      {payment.invoice_number}
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {payment.payment_type.replace("_", " ")}
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      ₹{Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {payment.payment_method === "upi" ? "UPI" : payment.payment_method.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={payment.status === "completed" ? "success" : payment.status === "failed" ? "error" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View / Print Receipt">
                        <IconButton size="small" onClick={() => navigate({ to: "/my-payments/$paymentId/receipt", params: { paymentId: String(payment.id) } })}>
                          <Receipt fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && <PaginationBar count={data.count} page={page} onChange={(_, v) => setPage(v)} />}
      </Card>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dialog === "membership_plan" ? "Choose a Membership Plan" : "Choose a PT Package"}
        </DialogTitle>
        <DialogContent>
          {items.length === 0 ? (
            <Typography sx={{ py: 2, textAlign: "center", color: "#8A8F8C" }}>
              No items available.
            </Typography>
          ) : (
            <List>
              {items.map((item: any) => (
                <ListItemButton key={item.id} sx={{ borderRadius: 1, mb: 1 }}>
                  <ListItemText
                    primary={item.name}
                    secondary={`₹${Number(item.price).toLocaleString()} — ${dialog === "membership_plan" ? `${item.duration_days} days` : `${item.number_of_sessions} sessions`}`}
                  />
                  <RazorpayCheckoutButton
                    purchaseType={dialog!}
                    itemId={item.id}
                    amount={Number(item.price)}
                    onSuccess={(paymentId) => {
                      setDialog(null);
                      navigate({ to: "/my-payments/$paymentId/receipt", params: { paymentId: String(paymentId) } });
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
