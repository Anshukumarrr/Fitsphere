import { createTheme } from "@mui/material/styles";

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    display: true;
    data: true;
  }
}

declare module "@mui/material/styles" {
  interface TypographyVariants {
    display: React.CSSProperties;
    data: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    display?: React.CSSProperties;
    data?: React.CSSProperties;
  }
}

const gymTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#D4FF3F",
      light: "#E5FF80",
      dark: "#A8CC28",
      contrastText: "#0B0D0C",
    },
    secondary: {
      main: "#6B6F6C",
      light: "#8A8F8C",
      dark: "#4D504E",
      contrastText: "#E8E3D8",
    },
    error: {
      main: "#FF4B3E",
      light: "#FF7A6E",
      dark: "#CC261A",
    },
    background: {
      default: "#0B0D0C",
      paper: "#1A1D1B",
    },
    text: {
      primary: "#E8E3D8",
      secondary: "#6B6F6C",
    },
    divider: "#2A2D2B",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    display: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      lineHeight: 1.1,
    },
    data: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500,
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "0.02em",
    },
    h1: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      lineHeight: 1.1,
    },
    h2: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      lineHeight: 1.1,
    },
    h3: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      lineHeight: 1.1,
    },
    h4: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      lineHeight: 1.1,
    },
    h5: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      lineHeight: 1.2,
    },
    h6: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      lineHeight: 1.2,
    },
    button: {
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: "#2A2D2B #0B0D0C",
          fontFamily: '"Inter", sans-serif',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1A1D1B",
          border: "1px solid rgba(107,111,108,0.12)",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
          transition: "border-color 120ms ease-out, box-shadow 120ms ease-out",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "5%",
            width: "90%",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(232,227,216,0.06), transparent)",
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
            opacity: 0.03,
            pointerEvents: "none",
            mixBlendMode: "soft-light",
          },
          "&:hover": {
            borderColor: "rgba(107,111,108,0.25)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: "10px 24px",
          transition: "all 120ms ease-out",
          variants: [
            {
              props: { variant: "contained", color: "primary" },
              style: {
                background: "#D4FF3F",
                color: "#0B0D0C",
                fontWeight: 700,
                "&:hover": {
                  background: "#E5FF80",
                  transform: "scale(1.02)",
                },
              },
            },
            {
              props: { variant: "outlined", color: "primary" },
              style: {
                borderColor: "#D4FF3F",
                color: "#D4FF3F",
                "&:hover": {
                  borderColor: "#E5FF80",
                  backgroundColor: "rgba(212,255,63,0.08)",
                },
              },
            },
            {
              props: { variant: "contained", color: "error" },
              style: {
                background: "#FF4B3E",
                color: "#fff",
                "&:hover": {
                  background: "#FF7A6E",
                },
              },
            },
          ],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #2A2D2B",
          backgroundColor: "#0B0D0C",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#0B0D0C",
          borderBottom: "1px solid #2A2D2B",
          boxShadow: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "1px 6px",
          paddingLeft: 14,
          transition: "background-color 120ms ease-out",
          "&.Mui-selected": {
            backgroundColor: "rgba(255,255,255,0.04)",
          },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.02)",
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "#6B6F6C",
          minWidth: 34,
          transition: "color 120ms ease-out",
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: '"Inter", sans-serif',
          fontSize: "0.82rem",
          fontWeight: 400,
          transition: "color 120ms ease-out",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#0B0D0C",
            fontFamily: '"Inter", sans-serif',
            "& fieldset": {
              borderColor: "#2A2D2B",
            },
            "&:hover fieldset": {
              borderColor: "#6B6F6C",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#D4FF3F",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#6B6F6C",
            fontFamily: '"Inter", sans-serif',
            "&.Mui-focused": {
              color: "#D4FF3F",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.7rem",
          borderRadius: 4,
          height: 22,
        },
        filled: {
          "&.MuiChip-colorSuccess": {
            backgroundColor: "rgba(212,255,63,0.12)",
            color: "#D4FF3F",
            border: "1px solid rgba(212,255,63,0.25)",
          },
          "&.MuiChip-colorDefault": {
            backgroundColor: "rgba(107,111,108,0.1)",
            color: "#6B6F6C",
            border: "1px solid rgba(107,111,108,0.2)",
          },
          "&.MuiChip-colorError": {
            backgroundColor: "rgba(255,75,62,0.12)",
            color: "#FF4B3E",
            border: "1px solid rgba(255,75,62,0.25)",
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 600,
            color: "#6B6F6C",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: "0.65rem",
            fontFamily: '"Inter", sans-serif',
            borderBottom: "1px solid #2A2D2B",
            backgroundColor: "transparent",
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root": {
            position: "relative",
            transition: "background-color 120ms ease-out",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.02)",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: "#2A2D2B",
          fontFamily: '"Inter", sans-serif',
          color: "#E8E3D8",
        },
        alignRight: {
          fontFamily: '"JetBrains Mono", monospace',
          fontVariantNumeric: "tabular-nums",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(107,111,108,0.15)",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#2A2D2B",
        },
      },
    },
  },
});

export default gymTheme;
