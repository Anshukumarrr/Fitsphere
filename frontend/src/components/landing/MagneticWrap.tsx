import Box from "@mui/material/Box";
import { motion } from "motion/react";
import { type ReactNode } from "react";
import { useMagneticHover } from "../../hooks/useMagneticHover";

export default function MagneticWrap({ children, radius = 6 }: { children: ReactNode; radius?: number }) {
  const { ref, x, y } = useMagneticHover(radius);
  return (
    <Box ref={ref} component={motion.div} style={{ x, y }} sx={{ display: "inline-flex" }}>
      {children}
    </Box>
  );
}
