import { useState } from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useCreateRazorpayOrder, useVerifyRazorpayPayment } from "../../hooks/useApi";

interface Props {
  purchaseType: "membership_plan" | "pt_package" | "renewal";
  itemId: number;
  amount: number;
  planId?: number;
  label?: string;
  disabled?: boolean;
  onSuccess?: (paymentId: number) => void;
}

export default function RazorpayCheckoutButton({ purchaseType, itemId, amount, planId, label, disabled, onSuccess }: Props) {
  const [error, setError] = useState("");
  const createOrder = useCreateRazorpayOrder();
  const verifyPayment = useVerifyRazorpayPayment();

  const handleClick = async () => {
    setError("");
    try {
      const order = await createOrder.mutateAsync({
        purchase_type: purchaseType,
        item_id: itemId,
        ...(purchaseType === "renewal" && planId ? { plan_id: planId } : {}),
      });
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "FitSphere",
        order_id: order.order_id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const result = await verifyPayment.mutateAsync({
            payment_id: order.payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess?.(result.id);
        },
        modal: {
          ondismiss: () => setError("Payment cancelled."),
        },
        theme: { color: "#2d3436" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        setError(resp.error?.description || "Payment failed.");
      });
      rzp.open();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Something went wrong.");
    }
  };

  return (
    <>
      <Button variant="contained" onClick={handleClick} disabled={disabled || createOrder.isPending}>
        {label ?? `Pay ₹${amount.toLocaleString()}`}
      </Button>
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          message={error}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      )}
    </>
  );
}
