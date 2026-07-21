import { useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  CloudUpload,
  Download,
  Error as ErrorIcon,
  ExpandMore,
  Warning,
} from "@mui/icons-material";
import { useBulkImportMembers } from "../../hooks/useApi";
import type { BulkImportResult } from "../../types";

const SAMPLE_CSV = `first_name,last_name,email,phone,gender,date_of_birth,branch_name,plan_name,emergency_contact_name,emergency_contact_phone,whatsapp_number,health_notes
John,Doe,john@example.com,+919876543210,male,1995-06-15,Main Branch,Monthly,Jane Doe,+919876543211,+919876543210,
Jane,Smith,jane@example.com,+919876543211,female,1998-03-22,Main Branch,,,John Smith,+919876543210,Asthma`;

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImport = useBulkImportMembers();

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      alert("Please select a CSV or XLSX file.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await bulkImport.mutateAsync(formData);
      setResult(res);
      setErrorsOpen(res.errors.length > 0);
    } catch {
      alert("Upload failed. Check the file and try again.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setErrorsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fitsphere_member_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!result || result.errors.length === 0) return;
    const header = "row,field,value,message\n";
    const rows = result.errors.map((e) => `${e.row},"${e.field}","${e.value}","${e.message}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasResult = result !== null;
  const hasErrors = result?.errors && result.errors.length > 0;
  const allCreated = hasResult && result.created === result.total;

  if (hasResult) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Import Results</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {file?.name}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Card sx={{ flex: 1, p: 3, textAlign: "center", bgcolor: allCreated ? "rgba(76,175,80,0.08)" : "transparent" }}>
            {allCreated
              ? <CheckCircle sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
              : <Warning sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
            }
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{result.created}</Typography>
            <Typography variant="body2" color="text.secondary">Created</Typography>
          </Card>
          {result.skipped > 0 && (
            <Card sx={{ flex: 1, p: 3, textAlign: "center" }}>
              <Warning sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{result.skipped}</Typography>
              <Typography variant="body2" color="text.secondary">Skipped</Typography>
            </Card>
          )}
          {hasErrors && (
            <Card sx={{ flex: 1, p: 3, textAlign: "center", bgcolor: "rgba(244,67,54,0.08)" }}>
              <ErrorIcon sx={{ fontSize: 40, color: "error.main", mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{result.errors.length}</Typography>
              <Typography variant="body2" color="text.secondary">Errors</Typography>
            </Card>
          )}
        </Box>

        {hasErrors && (
          <Card sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, cursor: "pointer" }} onClick={() => setErrorsOpen(!errorsOpen)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ErrorIcon color="error" fontSize="small" />
                <Typography variant="subtitle2">{result.errors.length} error(s) — click to expand</Typography>
              </Box>
              <ExpandMore sx={{ transform: errorsOpen ? "rotate(180deg)" : "none", transition: "0.2s" }} />
            </Box>
            <Collapse in={errorsOpen}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Field</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.errors.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{e.row}</TableCell>
                        <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.8rem" }}>{e.field || "-"}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{e.value || "-"}</TableCell>
                        <TableCell sx={{ color: "error.main" }}>{e.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ p: 2 }}>
                <Button size="small" startIcon={<Download />} variant="outlined" onClick={downloadErrorReport}>
                  Download Error Report (CSV)
                </Button>
              </Box>
            </Collapse>
          </Card>
        )}

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleReset}>Import Another File</Button>
          <Button variant="outlined" onClick={() => window.history.back()}>Back to Members</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Import Members</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a CSV or Excel file to bulk-add existing members to the portal. Each row creates a user account + member profile.
      </Typography>

      <Card
        sx={{
          p: 6,
          textAlign: "center",
          border: "2px dashed",
          borderColor: file ? "primary.main" : "#2A2D2B",
          bgcolor: file ? "rgba(212,255,63,0.03)" : "transparent",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": { borderColor: "primary.main", bgcolor: "rgba(212,255,63,0.03)" },
          mb: 3,
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          hidden
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        <CloudUpload sx={{ fontSize: 48, color: file ? "primary.main" : "#6B6F6C", mb: 2 }} />
        {file ? (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>{file.name}</Typography>
            <Typography variant="body2" color="text.secondary">{(file.size / 1024).toFixed(1)} KB — click to change</Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Drop your file here or click to browse</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Supports CSV and XLSX files up to 5MB</Typography>
          </>
        )}
      </Card>

      <Box sx={{ mb: 3 }}>
        <Button startIcon={<Download />} size="small" variant="outlined" onClick={downloadSample}>
          Download Sample CSV Template
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>Expected Columns:</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {["first_name*", "last_name*", "email*", "phone", "gender", "date_of_birth", "branch_name", "plan_name", "emergency_contact_name", "emergency_contact_phone", "whatsapp_number", "health_notes"].map((col) => (
            <Chip key={col} label={col} size="small" variant="outlined" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.72rem" }} />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          * required columns. Columns can be in any order.
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        disabled={!file || bulkImport.isPending}
        onClick={handleUpload}
        startIcon={<CloudUpload />}
        sx={{ minWidth: 200 }}
      >
        {bulkImport.isPending ? "Importing..." : "Upload & Import"}
      </Button>
    </Box>
  );
}
