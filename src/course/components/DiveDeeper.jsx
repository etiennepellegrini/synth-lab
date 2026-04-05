import { useState } from 'react';

/**
 * Collapsible "Dive Deeper" section for advanced content.
 */
export function DiveDeeper({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dive-deeper">
      <button className="dive-deeper-toggle" onClick={() => setOpen(!open)}>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
        Dive Deeper
      </button>
      {open && <div className="dive-deeper-body">{children}</div>}
    </div>
  );
}
