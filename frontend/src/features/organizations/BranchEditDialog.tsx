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
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { useUpdateBranch } from "../../hooks/useApi";
import { getError } from "../../hooks/setApiErrors";
import type { Branch } from "../../types";

interface BranchEditDialogProps {
  open: boolean;
  branches: Branch[];
  onClose: () => void;
  onSaved: () => void;
}

interface BranchForm {
  name: string;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_active: boolean;
}

const EMPTY_FORM: BranchForm = {
  name: "",
  contact_email: "",
  contact_phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  is_active: true,
};

function toForm(b: Branch): BranchForm {
  return {
    name: b.name ?? "",
    contact_email: b.contact_email ?? "",
    contact_phone: b.contact_phone ?? "",
    address_line1: b.address_line1 ?? "",
    address_line2: b.address_line2 ?? "",
    city: b.city ?? "",
    state: b.state ?? "",
    postal_code: b.postal_code ?? "",
    country: b.country ?? "",
    is_active: b.is_active ?? true,
  };
}

export default function BranchEditDialog({
  open,
  branches,
  onClose,
  onSaved,
}: BranchEditDialogProps) {
  const updateBranch = useUpdateBranch();
  const [branchId, setBranchId] = useState<number | "">("");
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && branches.length > 0) {
      const first = branches[0];
      setBranchId(first.id);
      setForm(toForm(first));
      setErrorMessage(null);
    }
  }, [open, branches]);

  const handleBranchChange = (id: number) => {
    const b = branches.find((x) => x.id === id);
    setBranchId(id);
    if (b) setForm(toForm(b));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    if (branchId === "") return;
    try {
      await updateBranch.mutateAsync({ id: branchId, payload: form });
      onSaved();
      onClose();
    } catch (err) {
      setErrorMessage(getError(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Edit Branch Details
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            select
            label="Branch"
            value={branchId}
            onChange={(e) => handleBranchChange(Number(e.target.value))}
            fullWidth
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Branch name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Contact email"
            value={form.contact_email}
            onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Contact phone"
            value={form.contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Address line 1"
            value={form.address_line1}
            onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Address line 2"
            value={form.address_line2}
            onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
            fullWidth
          />
          <TextField
            label="City"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            fullWidth
          />
          <TextField
            label="State"
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Postal code"
            value={form.postal_code}
            onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Country"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
            }
            label="Branch is active"
          />

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={updateBranch.isPending}>
          Cancel
        </Button>
        <Button variant="contained" disabled={updateBranch.isPending || branchId === ""} onClick={handleSave}>
          {updateBranch.isPending ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}