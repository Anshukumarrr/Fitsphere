import {
  Box,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMyPayments } from "../../hooks/useApi";

export default function MyPaymentsPage() {
  const { data, isLoading } = useMyPayments();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        My Payment History
      </Typography>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading...</TableCell>
                </TableRow>
              ) : data?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: "#6B6F6C", fontStyle: "italic" }}>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
