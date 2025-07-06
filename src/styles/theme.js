import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#128199",
    },
    secondary: {
      main: "#ffcc00",
    },
    background: {
      default: "#f9f9f9",
      paper: "#ffffff",
    },
    text: {
      primary: "#033649",
      secondary: "#555",
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif", // default for body
    h1: {
      fontFamily: "'Comfortaa', cursive",
      fontSize: "3rem",
      fontWeight: "700",
    },
    h2: {
      fontFamily: "'Comfortaa', cursive",
      fontSize: "2rem",
      fontWeight: "700",
    },
    h3: {
      fontFamily: "'Comfortaa', cursive",
      fontSize: "1.75rem",
      fontWeight: "700",
    },
    h4: {
      fontFamily: "'Comfortaa', cursive",
      fontSize: "1.5rem",
      fontWeight: "700",
    },
    h5: {
      fontFamily: "'Comfortaa', cursive",
      fontSize: "1.3rem",
      fontWeight: "700",
    },
    h6: {
      fontFamily: "'Comfortaa', cursive",
      fontSize: "1.25rem",
    },
    body1: {
      fontSize: "1.075rem",
      fontFamily: "'Poppins', sans-serif",
    },
    body2: {
      fontSize: "0.95rem",
      fontFamily: "'Poppins', sans-serif",
    },
    subtitle1: {
      fontSize: "0.9rem",
      fontWeight: "600",
    },
    subtitle2: {
      fontSize: "0.8rem",
      fontWeight: "500",
    },
    button: {
      textTransform: "uppercase",
      fontWeight: "bold",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          fontSize: "1rem",
          padding: "10px 20px",
        },
        containedPrimary: {
          backgroundColor: "#0077b6",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#005f8d",
          },
        },
        containedSecondary: {
          backgroundColor: "#ffcc00",
          color: "#333",
          "&:hover": {
            backgroundColor: "#e6b800",
          },
        },
      },
    },
  },
});

export default theme;
