"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

interface CardFanProps {
  children: React.ReactNode;
}

const CardFan: React.FC<CardFanProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const childArray = React.Children.toArray(children);
  const total = childArray.length;

  // Measure container width
  useEffect(() => {
    const updateWidth = () => setContainerWidth(containerRef.current?.offsetWidth || 0);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const offset = containerWidth / (total + 1);
  const spread = 15;
  const curveDepth = 0.7;

  const middle = Math.floor((total - 1) / 2);

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center items-end h-87.5 w-full overflow-visible max-w-7xl"
    >
      {childArray.map((child, index) => {
        const normalizedIndex = index - middle;

        const translateX = normalizedIndex * offset;
        const translateY = Math.pow(normalizedIndex, 2) * curveDepth * 50;
        const rotation = (normalizedIndex / middle) * (spread / 2);

        // Animation timing:
        // Center card first → others later based on distance from middle
        const distanceFromCenter = Math.abs(normalizedIndex);
        const delay = distanceFromCenter === 0 ? 0 : 0.6 + distanceFromCenter * 0.15;

        return (
          <motion.div
            key={index}
            className="absolute -bottom-10 md:-bottom-20 cursor-pointer"
            style={{
              zIndex: 100 - distanceFromCenter,
            }}
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 100,
              x: 0,
              rotate: 0,
            }}
            animate={{
              opacity: 1,
              y: translateY,
              x: translateX,
              rotate: rotation,
              scale: 1,
            }}
            transition={{
              duration: 0.6,
              delay,
              type: "spring",
              stiffness: 100,
              damping: 14,
            }}
            whileHover={{
              scale: 1.08,
              y: translateY - 10,
              transition: { type: "spring", stiffness: 250 },
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
};

export default CardFan;
