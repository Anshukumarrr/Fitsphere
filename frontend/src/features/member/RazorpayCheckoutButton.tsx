import { useState } from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useCreateRazorpayOrder, useVerifyRazorpayPayment } from "../../hooks/useApi";

interface Props {
  purchaseType: "membership_plan" | "pt_package";
  itemId: number;
  amount: number;
  label?: string;
  disabled?: boolean;
  onSuccess?: (paymentId: number) => void;
}

let sdkPromise: Promise<void> | null = null;

/** Loads the Razorpay checkout SDK exactly once, on demand. */
function loadRazorpaySdk(): Promise<void> {
  if ((window as unknown as Record<string, unknown>).Razorpay) {
    return Promise.resolve();
  }
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null; // allow retry
        reject(new Error("Failed to load payment SDK. Check your connection."));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export default function RazorpayCheckoutButton({ purchaseType, itemId, amount, label, disabled, onSuccess }: Props) {
  const [error, setError] = useState("");
  const createOrder = useCreateRazorpayOrder();
  const verifyPayment = useVerifyRazorpayPayment();

  const handleClick = async () => {
    setError("");
    try {
      // Load the Razorpay SDK lazily — never block the landing/app load on it.
      await loadRazorpaySdk();
      const order = await createOrder.mutateAsync({
        purchase_type: purchaseType,
        item_id: itemId,
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
        {createOrder.isPending ? "Processing..." : (label ?? `Pay ₹${amount.toLocaleString()}`)}
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
