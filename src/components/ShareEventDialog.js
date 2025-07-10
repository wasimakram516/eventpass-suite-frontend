import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";

const ShareEventDialog = ({ open, onClose, event }) => {
  const { showMessage } = useMessage();
  const eventLink = event
    ? `${window.location.origin}/${
        event.eventType === "employee" ? "checkin" : "eventreg"
      }/event/${event.slug}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    showMessage("Event link copied to clipboard!", "success");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
        Share Event
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mt: 2 }}>
          Use the following link to share this event:
        </Typography>
        <TextField
          fullWidth
          value={eventLink}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Tooltip title="Copy to Clipboard">
                <IconButton onClick={handleCopyLink}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            ),
          }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareEventDialog;
