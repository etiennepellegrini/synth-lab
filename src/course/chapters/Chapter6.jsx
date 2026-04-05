import { useState } from 'react';
import { VolcaCallout } from '../components/VolcaCallout.jsx';
import { DiveDeeper } from '../components/DiveDeeper.jsx';

export function Chapter6() {
  const [activeBlock, setActiveBlock] = useState(null);

  const blocks = [
    {
      id: 'vco',
      label: 'VCO',
      sub: '×3 Oscillators',
      x: 60,
      y: 80,
      color: 'var(--cyan)',
      desc: 'Three analog oscillators generate the raw waveform. VOICE knob sets configuration and waveform.',
    },
    {
      id: 'vcf',
      label: 'VCF',
      sub: 'Filter',
      x: 240,
      y: 80,
      color: 'var(--amber)',
      desc: 'Single 12dB/oct low-pass filter. All three voices share it — the paraphonic limitation.',
    },
    {
      id: 'vca',
      label: 'VCA',
      sub: 'Amplifier',
      x: 420,
      y: 80,
      color: 'var(--green)',
      desc: 'Controls final volume. Envelope shapes it. All three voices share this too.',
    },
  ];

  const modSources = [
    {
      id: 'eg',
      label: 'EG',
      sub: 'Envelope',
      x: 200,
      y: 200,
      color: 'var(--red)',
      desc: 'Modulates VCA (volume), VCO pitch (EG INT), and VCF cutoff (CUTOFF EG INT).',
    },
    {
      id: 'lfo',
      label: 'LFO',
      sub: 'Low Freq Osc',
      x: 360,
      y: 200,
      color: '#a78bfa',
      desc: 'Modulates pitch (PITCH INT) and filter cutoff (CUTOFF INT). Three waveforms, adjustable rate.',
    },
  ];

  const width = 560,
    height = 280;

  return (
    <div className="chapter-content">
      <p>
        In <strong>subtractive synthesis</strong>, the signal flows: <strong>Oscillator</strong> →{' '}
        <strong>Filter</strong> → <strong>Amplifier</strong>. The LFO and Envelope modulate these
        stages.
      </p>
      <p>
        The Volca Keys is <strong>paraphonic</strong>: 3 oscillators share one filter and one
        amplifier. You get chords, but can't shape each note independently.
      </p>
      <div className="viz-container">
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-3)',
            marginBottom: 12,
          }}
        >
          CLICK A BLOCK TO LEARN MORE
        </p>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-3)" />
            </marker>
            <marker
              id="modarrow"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="6"
              markerHeight="5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-3)" opacity="0.5" />
            </marker>
          </defs>
          <line x1="150" y1="90" x2="228" y2="90" stroke="var(--text-3)" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="330" y1="90" x2="408" y2="90" stroke="var(--text-3)" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="510" y1="90" x2="545" y2="90" stroke="var(--text-3)" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="548" y="94" fontSize="9" fill="var(--text-3)">
            OUT
          </text>
          <path
            d="M240,195 L260,120"
            stroke="var(--text-3)"
            strokeWidth="1"
            strokeDasharray="4,3"
            markerEnd="url(#modarrow)"
            opacity="0.5"
          />
          <path
            d="M220,195 L120,115"
            stroke="var(--text-3)"
            strokeWidth="1"
            strokeDasharray="4,3"
            markerEnd="url(#modarrow)"
            opacity="0.5"
          />
          <path
            d="M250,200 L420,120"
            stroke="var(--text-3)"
            strokeWidth="1"
            strokeDasharray="4,3"
            markerEnd="url(#modarrow)"
            opacity="0.4"
          />
          <path
            d="M380,195 L290,120"
            stroke="var(--text-3)"
            strokeWidth="1"
            strokeDasharray="4,3"
            markerEnd="url(#modarrow)"
            opacity="0.5"
          />
          <path
            d="M400,195 L120,110"
            stroke="var(--text-3)"
            strokeWidth="1"
            strokeDasharray="4,3"
            markerEnd="url(#modarrow)"
            opacity="0.3"
          />
          {blocks.map((b) => (
            <g
              key={b.id}
              onClick={() => setActiveBlock(activeBlock === b.id ? null : b.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={b.x}
                y={b.y - 28}
                width={90}
                height={56}
                rx="8"
                fill={activeBlock === b.id ? b.color + '25' : 'var(--surface-2)'}
                stroke={activeBlock === b.id ? b.color : 'var(--border)'}
                strokeWidth={activeBlock === b.id ? 2 : 1}
              />
              <text x={b.x + 45} y={b.y - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill={b.color}>
                {b.label}
              </text>
              <text x={b.x + 45} y={b.y + 14} textAnchor="middle" fontSize="8" fill="var(--text-3)">
                {b.sub}
              </text>
            </g>
          ))}
          {modSources.map((b) => (
            <g
              key={b.id}
              onClick={() => setActiveBlock(activeBlock === b.id ? null : b.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={b.x - 40}
                y={b.y - 20}
                width={80}
                height={40}
                rx="20"
                fill={activeBlock === b.id ? b.color + '25' : 'var(--surface-2)'}
                stroke={activeBlock === b.id ? b.color : 'var(--border)'}
                strokeWidth={activeBlock === b.id ? 2 : 1}
                strokeDasharray="4,2"
              />
              <text x={b.x} y={b.y - 2} textAnchor="middle" fontSize="12" fontWeight="600" fill={b.color}>
                {b.label}
              </text>
              <text x={b.x} y={b.y + 12} textAnchor="middle" fontSize="7" fill="var(--text-3)">
                {b.sub}
              </text>
            </g>
          ))}
          <line x1="30" y1="260" x2="60" y2="260" stroke="var(--text-3)" strokeWidth="2" />
          <text x="64" y="263" fontSize="8" fill="var(--text-3)">
            Audio signal
          </text>
          <line x1="140" y1="260" x2="170" y2="260" stroke="var(--text-3)" strokeWidth="1" strokeDasharray="4,3" />
          <text x="174" y="263" fontSize="8" fill="var(--text-3)">
            Modulation
          </text>
        </svg>
        {activeBlock && (
          <div
            style={{
              background: 'var(--surface-2)',
              borderRadius: 8,
              padding: '12px 16px',
              marginTop: 12,
              borderLeft: `3px solid ${[...blocks, ...modSources].find((b) => b.id === activeBlock)?.color}`,
            }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: 0 }}>
              {[...blocks, ...modSources].find((b) => b.id === activeBlock)?.desc}
            </p>
          </div>
        )}
      </div>
      <VolcaCallout>
        <p>
          The <strong>VOICE</strong> knob sets oscillator config + waveform. Everything downstream
          stays the same.
        </p>
      </VolcaCallout>
      <DiveDeeper>
        <p>
          <strong>Monophonic vs. paraphonic vs. polyphonic:</strong> Mono = 1 note. Poly = full
          duplicate signal path per voice. Paraphonic = multiple oscillators, shared filter/amp. The
          Volca Keys is paraphonic.
        </p>
        <p>
          <strong>"VC" = Voltage Controlled.</strong> In analog synthesis, everything is controlled
          by voltages. The Volca uses a digital CPU to generate control voltages via a 10-bit DAC,
          driving genuine analog circuitry.
        </p>
      </DiveDeeper>
    </div>
  );
}
