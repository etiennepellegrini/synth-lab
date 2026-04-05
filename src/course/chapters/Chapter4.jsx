import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAudio } from '../audio/AudioProvider.jsx';
import { VolcaCallout } from '../components/VolcaCallout.jsx';
import { DiveDeeper } from '../components/DiveDeeper.jsx';
import { Slider } from '../components/Slider.jsx';

export function Chapter4() {
  const audio = useAudio();
  const [attack, setAttack] = useState(0.05);
  const [decay, setDecay] = useState(0.2);
  const [sustain, setSustain] = useState(0.6);
  const [release, setRelease] = useState(0.4);
  const [gateOn, setGateOn] = useState(false);
  const [envLevel, setEnvLevel] = useState(0);
  const [envPhase, setEnvPhase] = useState('idle');
  const animRef = useRef();
  const envRef = useRef({ level: 0, phase: 'idle' });
  const audioNodesRef = useRef(null);

  // Envelope simulation (visual + audio gain control)
  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const e = envRef.current;

      if (e.phase === 'attack') {
        e.level += dt / Math.max(attack, 0.01);
        if (e.level >= 1) {
          e.level = 1;
          e.phase = 'decay';
        }
      } else if (e.phase === 'decay') {
        e.level -= (dt / Math.max(decay, 0.01)) * (1 - sustain);
        if (e.level <= sustain) {
          e.level = sustain;
          e.phase = 'sustain';
        }
      } else if (e.phase === 'sustain') {
        e.level = sustain;
      } else if (e.phase === 'release') {
        e.level -= (dt / Math.max(release, 0.01)) * Math.max(e.level, 0.01);
        if (e.level < 0.005) {
          e.level = 0;
          e.phase = 'idle';
        }
      }

      // Update audio gain to match envelope
      if (audioNodesRef.current) {
        audioNodesRef.current.gain.gain.value = e.level * 0.3;
      }

      setEnvLevel(e.level);
      setEnvPhase(e.phase);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [attack, decay, sustain, release]);

  const triggerGate = useCallback(
    (on) => {
      setGateOn(on);
      if (on) {
        envRef.current.phase = 'attack';
        // Start audio
        if (audio.ready && audio.ctx.current && !audioNodesRef.current) {
          const ctx = audio.ctx.current;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = 220;
          g.gain.value = 0;
          osc.connect(g);
          g.connect(audio.master.current);
          osc.start();
          audioNodesRef.current = { osc, gain: g };
        }
      } else {
        if (envRef.current.phase !== 'idle') envRef.current.phase = 'release';
      }
    },
    [audio.ready]
  );

  // Stop audio when envelope reaches idle
  useEffect(() => {
    if (envPhase === 'idle' && audioNodesRef.current) {
      const nodes = audioNodesRef.current;
      audioNodesRef.current = null;
      try {
        nodes.osc.stop();
      } catch (e) {}
    }
  }, [envPhase]);

  useEffect(
    () => () => {
      if (audioNodesRef.current) {
        try {
          audioNodesRef.current.osc.stop();
        } catch (e) {}
      }
      audioNodesRef.current = null;
    },
    []
  );

  const width = 560,
    height = 160,
    m = 30;
  const totalTime = attack + decay + 0.4 + release;
  const scale = (width - 2 * m) / totalTime;

  const envPath = useMemo(() => {
    const x0 = m,
      x1 = m + attack * scale,
      x2 = x1 + decay * scale,
      x3 = x2 + 0.4 * scale,
      x4 = x3 + release * scale;
    const yT = m,
      yB = height - m,
      yS = yB - sustain * (yB - yT);
    return `M${x0},${yB} L${x1},${yT} L${x2},${yS} L${x3},${yS} L${x4},${yB}`;
  }, [attack, decay, sustain, release, scale]);

  const x1 = m + attack * scale,
    x2 = x1 + decay * scale,
    x3 = x2 + 0.4 * scale;
  const phaseColors = {
    idle: 'var(--text-3)',
    attack: 'var(--green)',
    decay: 'var(--amber)',
    sustain: 'var(--cyan)',
    release: 'var(--red)',
  };

  return (
    <div className="chapter-content">
      <p>
        Real sounds aren't constant — they <strong>evolve over time</strong>.{' '}
        <strong>Envelopes</strong> shape how a parameter changes from key press to key release.
      </p>
      <p>
        The standard model is <strong>ADSR</strong>: <strong>Attack</strong>, <strong>Decay</strong>
        , <strong>Sustain</strong>, <strong>Release</strong>.
      </p>
      <div className="viz-container">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
          <line x1={m} y1={height - m} x2={width - m} y2={height - m} stroke="var(--surface-3)" strokeWidth="1" />
          <path d={envPath} fill="none" stroke="var(--cyan)" strokeWidth="2.5" strokeLinejoin="round" />
          <path
            d={`${envPath} L${m + (attack + decay + 0.4 + release) * scale},${height - m} Z`}
            fill="var(--cyan)"
            opacity="0.06"
          />
          <text x={(m + x1) / 2} y={height - m + 16} textAnchor="middle" fontSize="9" fill="var(--green)">
            A
          </text>
          <text x={(x1 + x2) / 2} y={height - m + 16} textAnchor="middle" fontSize="9" fill="var(--amber)">
            D
          </text>
          <text x={(x2 + x3) / 2} y={height - m + 16} textAnchor="middle" fontSize="9" fill="var(--cyan)">
            S
          </text>
          <text
            x={(x3 + m + (attack + decay + 0.4 + release) * scale) / 2}
            y={height - m + 16}
            textAnchor="middle"
            fontSize="9"
            fill="var(--red)"
          >
            R
          </text>
          <circle cx={m + 6} cy={height - m - envLevel * (height - 2 * m)} r="5" fill={phaseColors[envPhase]} opacity="0.9" />
          <line
            x1={m + 6}
            y1={height - m}
            x2={m + 6}
            y2={height - m - envLevel * (height - 2 * m)}
            stroke={phaseColors[envPhase]}
            strokeWidth="2"
            opacity="0.4"
          />
        </svg>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <Slider label="Attack" value={attack} onChange={setAttack} min={0.01} max={1.5} step={0.01} suffix="s" />
          <Slider label="Decay" value={decay} onChange={setDecay} min={0.01} max={1} step={0.01} suffix="s" />
          <Slider label="Sustain" value={sustain} onChange={setSustain} min={0} max={1} step={0.01} />
          <Slider label="Release" value={release} onChange={setRelease} min={0.01} max={2} step={0.01} suffix="s" />
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            className={`wave-btn ${gateOn ? 'active' : ''}`}
            style={{ padding: '10px 24px', fontSize: '0.85rem' }}
            onMouseDown={() => {
              if (!audio.ready) audio.init();
              triggerGate(true);
            }}
            onMouseUp={() => triggerGate(false)}
            onTouchStart={(e) => {
              e.preventDefault();
              if (!audio.ready) audio.init();
              triggerGate(true);
            }}
            onTouchEnd={() => triggerGate(false)}
          >
            {gateOn ? '◉ Key Held — listen to the envelope!' : '○ Hold to Play (with sound!)'}
          </button>
          <span
            style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: phaseColors[envPhase] }}
          >
            {envPhase.toUpperCase()}
          </span>
        </div>
      </div>
      <VolcaCallout>
        <p>
          The Volca Keys envelope has <strong>ATTACK</strong>, <strong>DECAY/RELEASE</strong>{' '}
          (single knob), and <strong>SUSTAIN</strong>. Two <strong>EG INT</strong> knobs route it to
          VCO pitch and VCF cutoff.
        </p>
      </VolcaCallout>
      <DiveDeeper>
        <p>
          <strong>Envelope → filter cutoff</strong> is one of the most important routings. Fast
          attack + moderate decay = the filter opens briefly at note start = classic percussive
          "pluck." The Volca's <strong>CUTOFF EG INT</strong> controls this.
        </p>
        <p>
          <strong>Envelope → pitch</strong> (VCO EG INT): small amounts add subtle pitch
          transients, large amounts create laser/zap effects.
        </p>
        <p>
          <strong>The Volca's linked Decay/Release</strong> means you can't have fast decay with
          long release. A common trade-off on affordable synths.
        </p>
      </DiveDeeper>
    </div>
  );
}
