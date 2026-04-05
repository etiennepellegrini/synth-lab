import { useState, useEffect, useRef, useMemo } from 'react';
import { useAudio } from '../audio/AudioProvider.jsx';
import { VolcaCallout } from '../components/VolcaCallout.jsx';
import { DiveDeeper } from '../components/DiveDeeper.jsx';
import { Slider } from '../components/Slider.jsx';
import { ListenToggle } from '../components/ListenToggle.jsx';

export function Chapter5() {
  const audio = useAudio();
  const [lfoWave, setLfoWave] = useState('triangle');
  const [lfoRate, setLfoRate] = useState(3);
  const [target, setTarget] = useState('pitch');
  const [phase, setPhase] = useState(0);
  const [listening, setListening] = useState(false);
  const nodesRef = useRef(null);
  const animRef = useRef();

  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setPhase((p) => (p + dt * lfoRate) % 100);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [lfoRate]);

  // Audio: tone with LFO modulation
  useEffect(() => {
    if (listening && audio.ready && audio.ctx.current) {
      const ctx = audio.ctx.current;

      // Resume AudioContext if suspended (Safari)
      const initAudio = async () => {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const filt = ctx.createBiquadFilter();
        const g = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 220;
        filt.type = 'lowpass';
        filt.frequency.value = 3000;
        filt.Q.value = 2;
        g.gain.value = 0.22;

        const waveMap = { triangle: 'triangle', saw: 'sawtooth', square: 'square' };
        lfo.type = waveMap[lfoWave] || 'triangle';
        lfo.frequency.value = lfoRate;

        if (target === 'pitch') {
          lfoGain.gain.value = 30; // ±30 Hz pitch wobble
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
        } else if (target === 'filter') {
          lfoGain.gain.value = 2000;
          lfo.connect(lfoGain);
          lfoGain.connect(filt.frequency);
        } else {
          // amplitude
          lfoGain.gain.value = 0.1;
          lfo.connect(lfoGain);
          lfoGain.connect(g.gain);
        }

        osc.connect(filt);
        filt.connect(g);
        g.connect(audio.master.current);
        osc.start();
        lfo.start();
        nodesRef.current = { osc, lfo, lfoGain, filt, g };
      };

      initAudio();
      return () => {
        try {
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        } catch (e) {
          // AudioContext may be closed or suspended
        }
        setTimeout(() => {
          try {
            osc.stop();
            lfo.stop();
          } catch (e) {}
        }, 80);
        nodesRef.current = null;
      };
    }
  }, [listening, audio.ready, lfoWave, target]);

  // Update LFO rate in real time
  useEffect(() => {
    if (nodesRef.current) nodesRef.current.lfo.frequency.value = lfoRate;
  }, [lfoRate]);

  useEffect(() => () => setListening(false), []);

  const lfoValue = useMemo(() => {
    const t = phase % 1;
    switch (lfoWave) {
      case 'triangle':
        return 4 * Math.abs(t - 0.5) - 1;
      case 'saw':
        return 2 * t - 1;
      case 'square':
        return t < 0.5 ? 1 : -1;
      default:
        return 0;
    }
  }, [phase, lfoWave]);

  const width = 560,
    height = 220,
    m = 30;
  const trailPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 200; i++) {
      const t = (((phase - (200 - i) * 0.005) % 100) + 100) % 1;
      let y;
      switch (lfoWave) {
        case 'triangle':
          y = 4 * Math.abs(t - 0.5) - 1;
          break;
        case 'saw':
          y = 2 * t - 1;
          break;
        case 'square':
          y = t < 0.5 ? 1 : -1;
          break;
        default:
          y = 0;
      }
      pts.push({ x: i / 200, y });
    }
    return pts;
  }, [phase, lfoWave]);

  const targetLabels = { pitch: 'Pitch — Vibrato', filter: 'Filter Cutoff — Wah', amplitude: 'Volume — Tremolo' };
  const targetColors = { pitch: 'var(--cyan)', filter: 'var(--amber)', amplitude: 'var(--green)' };

  return (
    <div className="chapter-content">
      <p>
        An <strong>LFO</strong> (Low Frequency Oscillator) modulates other parameters, making them
        wobble rhythmically. Route it to <strong>pitch</strong> = vibrato. To{' '}
        <strong>filter cutoff</strong> = wah. To <strong>amplitude</strong> = tremolo.
      </p>
      <div className="viz-container">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)', marginRight: 4 }}>
            LFO:
          </span>
          {['saw', 'triangle', 'square'].map((w) => (
            <button key={w} className={`wave-btn ${lfoWave === w ? 'active' : ''}`} onClick={() => setLfoWave(w)}>
              {w.charAt(0).toUpperCase() + w.slice(1)}
            </button>
          ))}
          <span
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)', margin: '0 8px 0 16px' }}
          >
            TARGET:
          </span>
          {['pitch', 'filter', 'amplitude'].map((t) => (
            <button
              key={t}
              className={`wave-btn ${target === t ? 'active' : ''}`}
              style={
                target === t
                  ? { borderColor: targetColors[t], color: targetColors[t], background: targetColors[t] + '20' }
                  : {}
              }
              onClick={() => setTarget(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <ListenToggle on={listening} onToggle={setListening} />
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
          <text x={m} y={18} fontSize="9" fill="var(--text-3)">
            LFO Output
          </text>
          <g transform="translate(0,-20)">
            <line x1={m} y1={height * 0.3} x2={width - m} y2={height * 0.3} stroke="var(--surface-3)" strokeWidth="1" />
            {trailPoints.map((p, i) => {
              const x = m + p.x * (width - 2 * m);
              const y = height * 0.3 - p.y * 25;
              return i > 0 ? (
                <line
                  key={i}
                  x1={m + trailPoints[i - 1].x * (width - 2 * m)}
                  y1={height * 0.3 - trailPoints[i - 1].y * 25}
                  x2={x}
                  y2={y}
                  stroke="var(--cyan)"
                  strokeWidth="1.5"
                  opacity={i / 200}
                />
              ) : null;
            })}
          </g>
          <text x={m} y={height * 0.52} fontSize="9" fill="var(--text-3)">
            {targetLabels[target]}
          </text>
          <rect
            x={width * 0.2}
            y={height * 0.58}
            width={width * 0.6}
            height={30}
            rx="4"
            fill="var(--surface-2)"
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1={width * 0.5}
            y1={height * 0.58}
            x2={width * 0.5}
            y2={height * 0.58 + 30}
            stroke="var(--text-3)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <circle cx={width * 0.5 + lfoValue * width * 0.18} cy={height * 0.58 + 15} r="8" fill={targetColors[target]} opacity="0.9" />
          <circle cx={width * 0.5 + lfoValue * width * 0.18} cy={height * 0.58 + 15} r="12" fill={targetColors[target]} opacity="0.2" />
          <text x={width * 0.2 - 4} y={height * 0.58 + 19} textAnchor="end" fontSize="8" fill="var(--text-3)">
            Low
          </text>
          <text x={width * 0.8 + 4} y={height * 0.58 + 19} textAnchor="start" fontSize="8" fill="var(--text-3)">
            High
          </text>
        </svg>
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          <Slider label="LFO Rate" value={lfoRate} onChange={setLfoRate} min={0.5} max={15} step={0.1} suffix=" Hz" />
        </div>
        {target === 'amplitude' && (
          <p
            style={{
              color: 'var(--amber)',
              fontSize: '0.75rem',
              marginTop: 12,
              marginBottom: 0,
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⚠ The Volca Keys cannot route its LFO to amplitude. Shown here as a general synthesis
            concept.
          </p>
        )}
      </div>
      <VolcaCallout>
        <p>
          The Volca Keys LFO has saw, triangle, square waveforms. <strong>PITCH INT</strong>{' '}
          controls vibrato depth, <strong>CUTOFF INT</strong> controls filter wah depth. It cannot
          modulate amplitude.
        </p>
      </VolcaCallout>
      <DiveDeeper>
        <p>
          <strong>Free-running vs. retriggered LFO:</strong> Free-running keeps cycling regardless
          of notes (organic). Retriggered resets on each note (consistent). The Volca Keys lets you
          toggle this.
        </p>
        <p>
          <strong>Audio-rate modulation:</strong> Crank the Volca's LFO rate into audio frequencies
          for FM-like metallic effects.
        </p>
        <p>
          <strong>The modulation matrix concept:</strong> "Source → amount → destination" is the
          mental model that scales to every synth you'll ever use.
        </p>
      </DiveDeeper>
    </div>
  );
}
