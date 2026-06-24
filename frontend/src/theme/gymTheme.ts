import { createTheme } from "@mui/material/styles";

const gymTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FF6D00",
      light: "#FF9E40",
      dark: "#C43E00",
      contrastText: "#000",
    },
    secondary: {
      main: "#00E676",
      light: "#69F0AE",
      dark: "#00B248",
      contrastText: "#000",
    },
    background: {
      default: "#0A0A0A",
      paper: "#141414",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0",
    },
    divider: "#2A2A2A",
    error: {
      main: "#FF1744",
    },
    warning: {
      main: "#FF9100",
    },
    info: {
      main: "#00B0FF",
    },
    success: {
      main: "#00E676",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: "#2A2A2A #0A0A0A",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #2A2A2A",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: () => ({
          borderRadius: 8,
          padding: "10px 24px",
          variants: [
            {
              props: { variant: "contained", color: "primary" },
              style: {
                background: "linear-gradient(135deg, #FF6D00 0%, #FF9100 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #C43E00 0%, #FF6D00 100%)",
                },
              },
            },
            {
              props: { variant: "contained", color: "secondary" },
              style: {
                background: "linear-gradient(135deg, #00E676 0%, #69F0AE 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #00B248 0%, #00E676 100%)",
                },
              },
            },
            {
              props: { variant: "outlined", color: "primary" },
              style: {
                borderColor: "#FF6D00",
                "&:hover": {
                  borderColor: "#FF9E40",
                  backgroundColor: "rgba(255,109,0,0.08)",
                },
              },
            },
          ],
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #2A2A2A",
          backgroundColor: "#0D0D0D",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#0F0F0F",
          borderBottom: "1px solid #2A2A2A",
          boxShadow: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 8px",
          "&.Mui-selected": {
            backgroundColor: "rgba(255,109,0,0.15)",
            "& .MuiListItemIcon-root": {
              color: "#FF6D00",
            },
            "& .MuiListItemText-primary": {
              color: "#FF6D00",
              fontWeight: 700,
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "#808080",
          minWidth: 40,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#1A1A1A",
            "& fieldset": {
              borderColor: "#333",
            },
            "&:hover fieldset": {
              borderColor: "#FF6D00",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FF6D00",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#808080",
            "&.Mui-focused": {
              color: "#FF6D00",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 700,
            color: "#FF6D00",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.75rem",
            borderBottom: "2px solid #FF6D00",
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root": {
            "&:hover": {
              backgroundColor: "rgba(255,109,0,0.05)",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: "#2A2A2A",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid #FF6D00",
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
  },
});

export default gymTheme;
