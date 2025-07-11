export default function getStartIconSpacing(dir) {
  return {
    "& .MuiButton-startIcon": {
      marginRight: dir === "rtl" ? 0 : "0.5rem",
      marginLeft: dir === "rtl" ? "0.5rem" : 0,
    },
  };
}
