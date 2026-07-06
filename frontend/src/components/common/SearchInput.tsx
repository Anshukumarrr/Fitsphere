import { useCallback, useEffect, useRef, useState } from "react";
import { TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { setLocal(value); }, [value]);

  const debouncedOnChange = useCallback(
    (val: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(val), 400);
    },
    [onChange],
  );

  return (
    <TextField
      size="small"
      value={local}
      onChange={(e) => { setLocal(e.target.value); debouncedOnChange(e.target.value); }}
      placeholder={placeholder}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
          ),
        },
      }}
      sx={{ minWidth: 260 }}
    />
  );
}
