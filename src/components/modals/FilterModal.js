import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Slide,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ICONS from "@/utils/iconUtil";
import { forwardRef } from "react";
import useI18nLayout from "@/hooks/useI18nLayout";
import EmptyBusinessState from "../EmptyBusinessState";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const FilterDialog = ({ open, onClose, title, children }) => {
  const { dir } = useI18nLayout();


  const hasChildren =
    !!children &&
    (!Array.isArray(children) ||
      children.some((c) => c !== null && c !== false));

  return (
    <Dialog
      dir={dir}
      open={open}
      onClose={onClose}
      keepMounted
      fullWidth
      maxWidth="sm"
      slots={{
        transition: Transition
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            minHeight: "40vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.92 : 0.98),
            border: "1px solid",
            borderColor: "divider",
            boxShadow: (theme) => theme.palette.custom.shadow.shadow2,},
        }
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 0,
        }}
      >
        {title}
        <IconButton onClick={onClose}>
          <ICONS.close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2, flex: 1 }}>
        {hasChildren ? children : <EmptyBusinessState />}
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
