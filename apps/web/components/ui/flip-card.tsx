import { motion } from "framer-motion";
import { useState } from "react";

type FlipCardProps = {
  front: React.ReactNode;
  back: React.ReactNode;
  /** Controlled flipped state */
  flipped?: boolean;
  /** If you want clicking the card to toggle flip */
  onToggle?: () => void;
};

export const FlipCard = ({ front, back, flipped, onToggle }: FlipCardProps) => {
  // If `flipped` is provided, use controlled mode.
  // If not, fall back to internal state (uncontrolled mode).
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isFlipped = flipped !== undefined ? flipped : internalFlipped;

  const handleClick = () => {
    if (onToggle) {
      onToggle();
    } else if (flipped === undefined) {
      setInternalFlipped((prev) => !prev);
    }
  };

  return (
    <div
      className="relative w-full h-full"
      style={{ perspective: 1000 }}
      onClick={handleClick}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          {front}
        </div>

        {/* BACK */}
        <div
          className="absolute w-full h-full"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};
