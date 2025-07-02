"use client";

import React, { createContext, useState, useContext } from "react";
import { Snackbar, Alert } from "@mui/material";

// Create Context
export const MessageContext = createContext();

// Provider Component
export const MessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null);

  const showMessage = (text, severity = "error") => {
    setMessage({ text, severity });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleClose = () => setMessage(null);

  return (
    <MessageContext.Provider value={{ message, showMessage }}>
      {children}

      <Snackbar
        open={Boolean(message)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={5000}
        sx={{ top: "60px !important" }}
      >
        {message && (
          <Alert
            variant="filled"
            severity={message.severity}
            onClose={handleClose}
          >
            {message.text || "An error occurred"}
          </Alert>        
        )}
      </Snackbar>
    </MessageContext.Provider>
  );
};

// Custom Hook to Use the Context
export const useMessage = () => useContext(MessageContext);
