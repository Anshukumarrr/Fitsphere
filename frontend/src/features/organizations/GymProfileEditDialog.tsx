import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
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
import { useUpdateGymProfile } from "../../hooks/useApi";
import { getError } from "../../hooks/setApiErrors";
import type { GymProfile } from "../../types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface ImageFieldProps {
  label: string;
  preview: string | null;
  circle?: boolean;
  onChange: (file: File | null) => void;
}

function ImageField({ label, preview, circle, onChange }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Avatar
          src={preview || undefined}
          variant={circle ? "circular" : "rounded"}
          sx={{
            width: circle ? 72 : 140,
            height: circle ? 72 : 88,
            bgcolor: "#1f1e1c",
            color: "#8A8F8C",
          }}
        >
          {circle ? "G" : ""}
        </Avatar>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <Button variant="outlined" onClick={() => inputRef.current?.click()}>
          Upload image
        </Button>
      </Box>
    </Box>
  );
}

interface GymProfileEditDialogProps {
  open: boolean;
  profile: GymProfile | undefined;
  onClose: () => void;
  onSaved: () => void;
  /** Show the "gym is active" toggle — gym_owner only (backend ignores it otherwise). */
  showActiveSwitch?: boolean;
}

export default function GymProfileEditDialog({
  open,
  profile,
  onClose,
  onSaved,
  showActiveSwitch = false,
}: GymProfileEditDialogProps) {
  const update = useUpdateGymProfile();

  const [form, setForm] = useState({ name: "", owner_name: "", description: "", is_active: true });
  const [initDone, setInitDone] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Seed the form + previews from the fetched profile each time the dialog opens.
  useEffect(() => {
    if (open && profile && !initDone) {
      setForm({
        name: profile.name ?? "",
        owner_name: profile.owner_name ?? "",
        description: profile.description ?? "",
        is_active: profile.is_active ?? true,
      });
      setBannerPreview(profile.banner_image_url || null);
      setPicturePreview(profile.picture_image_url || null);
      setBannerFile(null);
      setPictureFile(null);
      setErrorMessage(null);
      setInitDone(true);
    }
    if (!open) {
      setInitDone(false);
      setErrorMessage(null);
    }
  }, [open, profile, initDone]);

  const setFilePreview = (
    file: File | null,
    setter: (f: File | null) => void,
    preview: (s: string | null) => void,
  ) => {
    if (file && file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Image too large (max 5 MB).");
      return;
    }
    setter(file);
    preview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("owner_name", form.owner_name);
    fd.append("description", form.description);
    fd.append("is_active", String(form.is_active));
    if (bannerFile) fd.append("banner_image", bannerFile);
    if (pictureFile) fd.append("profile_image", pictureFile);

    try {
      await update.mutateAsync(fd);
      onSaved();
      onClose();
    } catch (err) {
      setErrorMessage(getError(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Edit Gym Profile
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <ImageField
            label="Cover / banner image"
            preview={bannerPreview}
            onChange={(f) => setFilePreview(f, setBannerFile, setBannerPreview)}
          />
          <ImageField
            label="Profile picture"
            preview={picturePreview}
            circle
            onChange={(f) => setFilePreview(f, setPictureFile, setPicturePreview)}
          />

          <TextField
            label="Gym name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Gym owner"
            value={form.owner_name}
            onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            multiline
            minRows={3}
            fullWidth
            helperText="Shown on the public landing page."
          />

          {showActiveSwitch && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
              }
              label="Gym is active — visible on the public landing page"
            />
          )}

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={update.isPending}>
          Cancel
        </Button>
        <Button variant="contained" disabled={update.isPending} onClick={handleSave}>
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}