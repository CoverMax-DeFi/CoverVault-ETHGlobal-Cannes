
import React from 'react';

interface PercentCircleProps {
  percentage: number;
  size: number;
  strokeWidth: number;
}

export const PercentCircle: React.FC<PercentCircleProps> = ({ 
  percentage, 
  size, 
  strokeWidth 
}) => {
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage <= 33) return "#f59e0b"; // amber-500
    if (percentage <= 66) return "#3b82f6"; // blue-500
    return "#10b981"; // emerald-500
  };
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#475569" // slate-600
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {/* Percentage text */}
      <div 
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
        style={{ color: getColor() }}
      >
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
};
