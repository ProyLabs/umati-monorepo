"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

interface CardFanProps {
  children: React.ReactNode;
}

const CardFan: React.FC<CardFanProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const childArray = React.Children.toArray(children);
  const total = childArray.length;

  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // Tailwind md breakpoint
      setContainerWidth(containerRef.current?.offsetWidth || 0);
    };
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
      className={`relative w-full max-w-7xl ${
        isMobile ? "flex justify-center items-center gap-3" : "flex justify-center items-end"
      } h-87.5 overflow-visible`}
    >
      {childArray.map((child, index) => {
        const normalizedIndex = index - middle;
        const translateX = normalizedIndex * offset;
        const translateY = Math.pow(normalizedIndex, 2) * curveDepth * 50;
        const rotation = (normalizedIndex / middle) * (spread / 2);
        const distanceFromCenter = Math.abs(normalizedIndex);
        const delay = distanceFromCenter === 0 ? 0 : 0.6 + distanceFromCenter * 0.15;

        return (
          <motion.div
            key={index}
            className={`${
              isMobile
                ? "relative cursor-pointer"
                : "absolute -bottom-10 md:-bottom-20 cursor-pointer"
            }`}
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
            animate={
              isMobile
                ? { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }
                : { opacity: 1, y: translateY, x: translateX, rotate: rotation, scale: 1 }
            }
            transition={{
              duration: 0.6,
              delay,
              type: "spring",
              stiffness: 100,
              damping: 14,
            }}
            whileHover={
              isMobile
                ? {  }
                : { y: translateY - 10, transition: { type: "spring", stiffness: 250 } }
            }
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
};

export default CardFan;
