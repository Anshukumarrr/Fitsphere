import { useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useGymProfile, useUpdateGymProfile } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function getError(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === "object") {
    const detail = (data as Record<string, unknown>).detail;
    if (typeof detail === "string") return detail;
    const first = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === "string") return first;
  }
  return "Something went wrong. Please try again.";
}

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

export default function GymProfilePage() {
  const { user } = useAuth();
  const canEdit = user?.role === "gym_owner" || user?.role === "receptionist";

  const { data: profile, isLoading } = useGymProfile({ enabled: canEdit });
  const update = useUpdateGymProfile();

  const [form, setForm] = useState({ name: "", owner_name: "", description: "" });
  const [initDone, setInitDone] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Seed the form and previews from the fetched profile once.
  if (profile && !initDone) {
    setForm({
      name: profile.name ?? "",
      owner_name: profile.owner_name ?? "",
      description: profile.description ?? "",
    });
    setBannerPreview(profile.banner_image_url || null);
    setPicturePreview(profile.picture_image_url || null);
    setInitDone(true);
  }

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
    setNotice(null);
    if (!canEdit) return;

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("owner_name", form.owner_name);
    fd.append("description", form.description);
    if (bannerFile) fd.append("banner_image", bannerFile);
    if (pictureFile) fd.append("profile_image", pictureFile);

    try {
      await update.mutateAsync(fd);
      setBannerFile(null);
      setPictureFile(null);
      setNotice("Gym profile saved.");
    } catch (err) {
      setErrorMessage(getError(err));
    }
  };

  if (!canEdit) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="warning">Only the gym owner or receptionist can edit the gym profile.</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Gym Profile
      </Typography>
      <Card sx={{ p: { xs: 2, md: 4 }, background: "#151515", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {notice && <Alert severity="success">{notice}</Alert>}

          <Box>
            <Button
              variant="contained"
              disabled={update.isPending}
              onClick={handleSave}
            >
              {update.isPending ? "Saving..." : "Save profile"}
            </Button>
          </Box>
        </Box>
      </Card>
    </Container>
  );
}