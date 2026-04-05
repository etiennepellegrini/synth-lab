/**
 * Labeled range slider with value display.
 */
export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, suffix = '' }) {
  const displayValue = typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value;

  return (
    <div className="slider-group">
      <label>
        {label}: {displayValue}
        {suffix}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
