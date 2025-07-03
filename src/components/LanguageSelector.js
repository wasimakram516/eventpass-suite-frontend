import { Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSelector = ({ top, right }) => {
  const { language, toggleLanguage } = useLanguage();
  console.log(top,right);
  
  const isFloating = typeof top !== "undefined" && typeof right !== "undefined";

  return (
    <Box
      sx={{
        position: isFloating ? "absolute" : "relative",
        top: isFloating ? top : "auto",
        right: isFloating ? right : "auto",
        display: "inline-block",
        zIndex: 10,
        width: "66px",
        height: "50px",
      }}
    >
      {/* Inactive Button (Behind) */}
      <motion.div
        initial={{ opacity: 0.5, y: 10, x: 10 }}
        animate={{ opacity: 0.5, y: 10, x: 10 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          width: "100%",
          zIndex: 1,
          pointerEvents: "none", 
        }}
      >
        <Button
          variant="contained"
          sx={{
            width: "100%",
            backgroundColor: "#6CA8D9",
            color: "white",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "none",
            px: 2,
          }}
        >
          {language === "en" ? "العربية" : "English"}
        </Button>
      </motion.div>

      {/* Active Button (On Top) */}
      <motion.div
        key={language} 
        initial={{ y: 8 }}
        animate={{ y: 0 }}
        exit={{ y: -8 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          width: "100%",
          zIndex: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={toggleLanguage}
          sx={{
            width: "100%",
            backgroundColor: "#0077B6",
            color: "white",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "none",
            px: 2,
          }}
        >
          {language === "en" ? "English" : "العربية"}
        </Button>
      </motion.div>
    </Box>
  );
};

export default LanguageSelector;
