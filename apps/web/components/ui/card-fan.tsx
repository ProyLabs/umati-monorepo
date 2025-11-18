"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

interface CardFanProps {
  children: React.ReactNode;
}

const CardFan: React.FC<CardFanProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const childArray = React.Children.toArray(children);
  const total = childArray.length;

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // Tailwind md breakpoint
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const offset = containerWidth / (total + 1);
  const spread = 15;
  const curveDepth = 0.6;
  const middle = Math.floor((total - 1) / 2);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex justify-center mmax-h-[100dvh] max-w-7xl h-2/5 items-end overflow-clip select-none` }
    >
      {childArray.map((child, index) => {
        const normalizedIndex = index - middle;
        const translateX = normalizedIndex * offset;
        const translateY =
          Math.pow(Math.abs(normalizedIndex), 2) * curveDepth * 40; // distance downward from top
        const rotation =
          middle !== 0 ? (normalizedIndex / middle) * (spread / 2) : 0;
        const distanceFromCenter = Math.abs(normalizedIndex);
        const delay =
          distanceFromCenter === 0 ? 0 : 0.6 + distanceFromCenter * 0.15;

        return (
          <motion.div
            key={index}
            className={`${
               "absolute top-0 cursor-pointer scale-75 md:scale-100"
            }`}
            style={{
              zIndex: 50 - distanceFromCenter,
              transformOrigin: "bottom center",
            }}
            initial={{
              opacity: 0,
              scale: 0.8,
              y: -50,
              x: 0,
              rotate: 0,
            }}
            animate={
              // isMobile
              //   ? { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }
                // :
                 {
                    opacity: 1,
                    y: translateY,
                    x: translateX,
                    rotate: rotation,
                    scale: 1,
                  }
            }
            transition={{
              duration: 0.6,
              delay,
              type: "spring",
              stiffness: 100,
              damping: 14,
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
