"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

const nodes: Node[] = [
  { id: "input", label: "Job URL", x: 0, y: 0 },
  { id: "analyze", label: "AI Analyze", x: 120, y: -40 },
  { id: "tailor", label: "Tailor Resume", x: 240, y: 0 },
  { id: "apply", label: "Auto Apply", x: 360, y: -40 },
  { id: "done", label: "Landed!", x: 480, y: 0 },
];

const connections = [
  { from: "input", to: "analyze" },
  { from: "analyze", to: "tailor" },
  { from: "tailor", to: "apply" },
  { from: "apply", to: "done" },
];

export function AgentWorkflowAnimation() {
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % nodes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[300px] hidden lg:block">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 550 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Connection Lines */}
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from)!;
          const toNode = nodes.find(n => n.id === conn.to)!;
          const isActive = nodes.indexOf(fromNode) < activeNode;
          
          return (
            <g key={i}>
              {/* Background line */}
              <line
                x1={fromNode.x + 30}
                y1={fromNode.y + 30}
                x2={toNode.x + 30}
                y2={toNode.y + 30}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              {/* Animated progress line */}
              {isActive && (
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  x1={fromNode.x + 30}
                  y1={fromNode.y + 30}
                  x2={toNode.x + 30}
                  y2={toNode.y + 30}
                  stroke="#FACC15"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const isActive = i <= activeNode;
          const isCurrent = i === activeNode;
          
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {/* Glow effect for active nodes */}
              {isActive && (
                <motion.circle
                  cx="30"
                  cy="30"
                  r="35"
                  fill="url(#glowGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isCurrent ? 0.4 : 0.2 }}
                  transition={{ duration: 0.5 }}
                />
              )}
              
              {/* Node circle */}
              <motion.circle
                cx="30"
                cy="30"
                r="28"
                fill={isActive ? "#1A1A1A" : "#0A0A0A"}
                stroke={isActive ? "#FACC15" : "rgba(255,255,255,0.1)"}
                strokeWidth="2"
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  borderColor: isActive ? "#FACC15" : "rgba(255,255,255,0.1)"
                }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Inner glow for active */}
              {isCurrent && (
                <motion.circle
                  cx="30"
                  cy="30"
                  r="20"
                  fill="#FACC15"
                  opacity="0.2"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              
              {/* Icon placeholder - first letter */}
              <text
                x="30"
                y="35"
                textAnchor="middle"
                fill={isActive ? "#FACC15" : "#6B6B6B"}
                fontSize="14"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {node.label.charAt(0)}
              </text>
              
              {/* Label */}
              <text
                x="30"
                y="70"
                textAnchor="middle"
                fill={isActive ? "#E4E2DD" : "#6B6B6B"}
                fontSize="11"
                fontWeight="500"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Gradient definitions */}
        <defs>
          <radialGradient id="glowGradient" cx="30" cy="30" r="35">
            <stop offset="0%" stopColor="#FACC15" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Status Text */}
      <motion.div
        key={activeNode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-sm text-[#FACC15] font-mono">
          {activeNode === 0 && "Paste any job URL"}
          {activeNode === 1 && "AI analyzing requirements..."}
          {activeNode === 2 && "Tailoring your resume..."}
          {activeNode === 3 && "Submitting application..."}
          {activeNode === 4 && "Application sent!"}
        </p>
      </motion.div>
    </div>
  );
}
