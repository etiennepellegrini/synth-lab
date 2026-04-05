/**
 * Volca Keys-specific callout box highlighting relevant hardware features.
 */
export function VolcaCallout({ children }) {
  return (
    <div className="volca-callout">
      <div className="volca-callout-title">⬡ On Your Volca Keys</div>
      {children}
    </div>
  );
}
