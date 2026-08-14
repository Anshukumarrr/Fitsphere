import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { useUpdateBranch } from "../../hooks/useApi";
import { getError } from "../../hooks/setApiErrors";
import type { Branch } from "../../types";

interface BranchHoursRow {
  id: number;
  name: string;
  opening: string; // "HH:MM" or ""
  closing: string;
  is24x7: boolean; // 24x7 toggle state
}

interface BranchHoursDialogProps {
  open: boolean;
  branches: Branch[];
  onClose: () => void;
  onSaved: () => void;
}

/** "06:00:00" -> "06:00" for the native time input; "" when unset. */
function toTimeInput(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}

/** "HH:MM" or "HH:MM:SS" -> minutes since midnight; null if not set. */
function toMinutes(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export default function BranchHoursDialog({
  open,
  branches,
  onClose,
  onSaved,
}: BranchHoursDialogProps) {
  const updateBranch = useUpdateBranch();
  const [rows, setRows] = useState<BranchHoursRow[]>([]);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRows(
        branches.map((b) => {
          // Detect 24x7 from backend data: open===0 && close>=23:30, or open===close!=0
          const openMin = b.opening_time ? toMinutes(b.opening_time) : null;
          const closeMin = b.closing_time ? toMinutes(b.closing_time) : null;
          const is24x7 = openMin !== null && closeMin !== null && (
            (openMin === 0 && closeMin >= 23 * 60 + 30) ||
            (openMin === closeMin && openMin !== 0)
          );
          return {
            id: b.id,
            name: b.name,
            opening: is24x7 ? "" : toTimeInput(b.opening_time ?? null),
            closing: is24x7 ? "" : toTimeInput(b.closing_time ?? null),
            is24x7,
          };
        }),
      );
      setErrorMessage(null);
      setSaved(false);
    }
  }, [open, branches]);

  const setRow = (id: number, patch: Partial<BranchHoursRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    try {
      for (const row of rows) {
        let payload: { opening_time: string | null; closing_time: string | null };
        if (row.is24x7) {
          // 24x7 convention: 00:00:00 - 23:59:00
          payload = { opening_time: "00:00:00", closing_time: "23:59:00" };
        } else {
          payload = {
            opening_time: row.opening ? `${row.opening}:00` : null,
            closing_time: row.closing ? `${row.closing}:00` : null,
          };
        }
        await updateBranch.mutateAsync({
          id: row.id,
          payload,
        });
      }
      setSaved(true);
      onSaved();
      onClose();
    } catch (err) {
      setErrorMessage(getError(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        Operating Hours
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Toggle 24x7 for all-day open; leave empty for no hours. When 24x7 is on, time
            fields are disabled.
          </Typography>
          {rows.map((row) => (
            <Box
              key={row.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#E8E3D8", flex: 1, minWidth: 0 }}>
                {row.name}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={row.is24x7}
                    onChange={(e) => setRow(row.id, { is24x7: e.target.checked })}
                    color="primary"
                    size="small"
                  />
                }
                label="24x7"
                sx={{ mr: 2, minWidth: 80 }}
              />
              <TextField
                type="time"
                label="Opens"
                value={row.opening}
                onChange={(e) => setRow(row.id, { opening: e.target.value })}
                size="small"
                sx={{
                  width: 140,
                  "& input": {
                    colorScheme: "dark",
                    backgroundColor: row.is24x7 ? "rgba(255,255,255,0.05)" : undefined,
                    color: row.is24x7 ? "rgba(232,227,216,0.4)" : undefined,
                  },
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={row.is24x7}
              />
              <TextField
                type="time"
                label="Closes"
                value={row.closing}
                onChange={(e) => setRow(row.id, { closing: e.target.value })}
                size="small"
                sx={{
                  width: 140,
                  "& input": {
                    colorScheme: "dark",
                    backgroundColor: row.is24x7 ? "rgba(255,255,255,0.05)" : undefined,
                    color: row.is24x7 ? "rgba(232,227,216,0.4)" : undefined,
                  },
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={row.is24x7}
              />
            </Box>
          ))}
          {saved && <Alert severity="success">Hours saved.</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={updateBranch.isPending}>
          Cancel
        </Button>
        <Button variant="contained" disabled={updateBranch.isPending} onClick={handleSave}>
          {updateBranch.isPending ? "Saving..." : "Save hours"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}