import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#128199", // Deep blue
    },
    secondary: {
      main: "#ffcc00", // Golden yellow (from lanterns)
    },
    background: {
      default: "#f9f9f9", // Light background
      paper: "#ffffff",
    },
    text: {
      primary: "#033649", // Dark blue for headings
      secondary: "#555", // Grayish text
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: {
      fontSize: "3rem",
      fontWeight: "bold",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: "bold",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: "bold",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    h5: {
      fontSize: "1.3rem",
      fontWeight: "bold",
    },
    h6: {
      fontSize: "1.25rem",
    },
    body1: {
      fontSize: "1.175rem",
    },
    body2: {
      fontSize: "0.95rem",
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
