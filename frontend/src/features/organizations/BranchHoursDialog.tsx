import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
        branches.map((b) => ({
          id: b.id,
          name: b.name,
          opening: toTimeInput(b.opening_time ?? null),
          closing: toTimeInput(b.closing_time ?? null),
        })),
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
        await updateBranch.mutateAsync({
          id: row.id,
          payload: {
            // TimeField accepts "HH:MM:SS"; null clears the value.
            opening_time: row.opening ? `${row.opening}:00` : null,
            closing_time: row.closing ? `${row.closing}:00` : null,
          },
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
            Sets the OPEN NOW / CLOSED badges and 24x7 detection on this page and the public
            landing profile. Leave a field empty to mark it as not set.
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
              <TextField
                type="time"
                label="Opens"
                value={row.opening}
                onChange={(e) => setRow(row.id, { opening: e.target.value })}
                size="small"
                sx={{ width: 140, "& input": { colorScheme: "dark" } }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="time"
                label="Closes"
                value={row.closing}
                onChange={(e) => setRow(row.id, { closing: e.target.value })}
                size="small"
                sx={{ width: 140, "& input": { colorScheme: "dark" } }}
                slotProps={{ inputLabel: { shrink: true } }}
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