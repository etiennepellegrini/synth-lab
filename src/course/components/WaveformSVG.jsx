import { pointsToPath } from '../audio/helpers.js';

/**
 * SVG visualization of a waveform with grid lines.
 */
export function WaveformSVG({
  points,
  width = 560,
  height = 180,
  color = 'var(--cyan)',
  strokeWidth = 2,
}) {
  const path = pointsToPath(points, width, height, 10);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* Horizontal center line */}
      <line
        x1="10"
        y1={height / 2}
        x2={width - 10}
        y2={height / 2}
        stroke="var(--surface-3)"
        strokeWidth="1"
      />
      {/* Vertical axis */}
      <line
        x1="10"
        y1="10"
        x2="10"
        y2={height - 10}
        stroke="var(--surface-3)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      {/* Waveform path */}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}
