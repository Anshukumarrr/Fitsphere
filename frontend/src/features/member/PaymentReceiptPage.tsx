import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { useMyPayment } from "../../hooks/useApi";

export default function PaymentReceiptPage() {
  const { paymentId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { data: payment, isLoading } = useMyPayment(Number(paymentId));

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (!payment) return <Typography sx={{ py: 4, textAlign: "center" }}>Payment not found.</Typography>;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .receipt-card { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <Box sx={{ maxWidth: 600, mx: "auto", mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }} className="no-print">
          <Typography variant="h5">Payment Receipt</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate({ to: "/my-payments" })}>Back</Button>
            <Button variant="contained" onClick={() => window.print()}>Download PDF</Button>
          </Box>
        </Box>

        <Card className="receipt-card" sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>FitSphere</Typography>
            <Typography variant="body2" color="text.secondary">Payment Receipt</Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Invoice</Typography>
            <Typography fontWeight={600} sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{payment.invoice_number}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Date</Typography>
            <Typography>{new Date(payment.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Member</Typography>
            <Typography>{payment.member_name}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Type</Typography>
            <Typography sx={{ textTransform: "capitalize" }}>{payment.payment_type.replace("_", " ")}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Description</Typography>
            <Typography>{payment.description || "—"}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Amount</Typography>
            <Typography fontWeight={700} sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "1.2rem" }}>
              ₹{Number(payment.amount).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Method</Typography>
            <Typography sx={{ textTransform: "capitalize" }}>{payment.payment_method === "upi" ? "UPI" : payment.payment_method.replace("_", " ")}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Typography color={payment.status === "completed" ? "success.main" : "error.main"} fontWeight={600}>{payment.status}</Typography>
          </Box>

          {payment.gateway_payment_id && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>{payment.gateway_payment_id}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
            Thank you for your payment!
          </Typography>
        </Card>
      </Box>
    </>
  );
}
