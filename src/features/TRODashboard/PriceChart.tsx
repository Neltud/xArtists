import React from "react";

/**
 * PriceChart: SVG line chart for price history.
 * Props:
 *   - data: number[] (price points)
 *   - width, height: chart size
 */
const PriceChart: React.FC<{ data: number[]; width?: number; height?: number }> = ({
  data,
  width = 320,
  height = 100,
}) => {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 16) + 8;
    const y = height - 8 - ((v - min) / (max - min || 1)) * (height - 24);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ background: "#f8f7fc", borderRadius: 8 }}>
      <polyline
        fill="none"
        stroke="#5a3be7"
        strokeWidth="2"
        points={points}
      />
      <circle
        cx={width - 8}
        cy={height - 8 - ((data[data.length - 1] - min) / (max - min || 1)) * (height - 24)}
        r="4"
        fill="#5a3be7"
      />
    </svg>
  );
};

export default PriceChart;
