"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

interface GlobalWireProps {
  containerRef: React.RefObject<HTMLElement>;
  startY?: number;
}

export function GlobalWire({ containerRef, startY = 200 }: GlobalWireProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  return (
    <motion.svg
      className="fixed left-8 top-0 w-[2px] h-full pointer-events-none z-40"
      style={{ opacity }}
    >
      <motion.path
        d={`M 1 ${startY} L 1 ${typeof window !== 'undefined' ? window.innerHeight * 3 : 2000}`}
        stroke="url(#wireGradient)"
        strokeWidth="2"
        fill="none"
        style={{ pathLength }}
      />
      <defs>
        <linearGradient id="wireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FACC15" stopOpacity="0" />
          <stop offset="20%" stopColor="#FACC15" stopOpacity="1" />
          <stop offset="80%" stopColor="#FACC15" stopOpacity="1" />
          <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function SectionWire({ 
  progress, 
  color = "#FACC15" 
}: { 
  progress: MotionValue<number>; 
  color?: string;
}) {
  return (
    <motion.div
      className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#FACC15] to-transparent"
      style={{
        opacity: progress,
        boxShadow: `0 0 10px ${color}`,
      }}
    />
  );
}

export function ConnectionDot({ 
  delay = 0 
}: { 
  delay?: number 
}) {
  return (
    <motion.div
      className="absolute -left-1.5 w-4 h-4 rounded-full bg-[#FACC15] shadow-[0_0_15px_#FACC15]"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1.2, 1], 
        opacity: [0, 1, 1] 
      }}
      transition={{
        duration: 0.5,
        delay,
        times: [0, 0.5, 1],
        ease: "easeOut"
      }}
    />
  );
}

export function PulsingIndicator() {
  return (
    <div className="relative w-3 h-3">
      <div className="absolute inset-0 rounded-full bg-[#FACC15] animate-ping opacity-75" />
      <div className="absolute inset-0 rounded-full bg-[#FACC15]" />
    </div>
  );
}
