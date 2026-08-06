import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useCodeCheckIn } from "../../hooks/useApi";

export default function MemberCheckInPanel() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const checkIn = useCodeCheckIn();

  const handleCheckIn = async () => {
    if (!code.trim()) return;
    setMessage(null);
    try {
      await checkIn.mutateAsync({ code: code.trim() });
      setCode("");
      setMessage({ type: "success", text: "Checked in! Let's get to work." });
    } catch (err: any) {
      setMessage({
        type: "error",
        text:
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Check-in failed. Try again.",
      });
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ py: 2.5 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Anton", sans-serif', fontSize: "0.8rem", letterSpacing: "0.08em", color: "#8A8F8C", mb: 1.5 }}>
          Daily Check-In
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Enter your check-in code"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setMessage(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleCheckIn(); }}
            sx={{ flex: 1, maxWidth: 320 }}
          />
          <Button
            variant="contained"
            onClick={handleCheckIn}
            disabled={!code.trim() || checkIn.isPending}
            sx={{ whiteSpace: "nowrap" }}
          >
            {checkIn.isPending ? "Checking..." : "Check In"}
          </Button>
        </Box>
        {message && (
          <Alert
            severity={message.type}
            sx={{ mt: 1.5 }}
          >
            {message.text}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}