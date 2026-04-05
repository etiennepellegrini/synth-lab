import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../audio/AudioProvider.jsx';
import { NOTE_FREQS } from '../audio/helpers.js';
import { VolcaCallout } from '../components/VolcaCallout.jsx';
import { DiveDeeper } from '../components/DiveDeeper.jsx';
import { Slider } from '../components/Slider.jsx';

export function Chapter7() {
  const audio = useAudio();
  const [steps, setSteps] = useState(
    Array(16)
      .fill(0)
      .map((_, i) => ({ active: i % 4 === 0 || i === 7 || i === 11, note: 0 }))
  );
  const [playhead, setPlayhead] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeSteps, setActiveSteps] = useState(Array(16).fill(true));
  const intervalRef = useRef();
  const [showAS, setShowAS] = useState(false);
  const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', "C'"];

  useEffect(() => {
    if (playing) {
      const ms = (60000 / bpm) / 4;
      intervalRef.current = setInterval(() => {
        setPlayhead((p) => {
          let n = (p + 1) % 16;
          let s = 0;
          while (!activeSteps[n] && s < 16) {
            n = (n + 1) % 16;
            s++;
          }
          return n;
        });
      }, ms);
    } else {
      clearInterval(intervalRef.current);
      setPlayhead(-1);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, bpm, activeSteps]);

  // Play note when playhead hits an active step
  const prevPlayhead = useRef(-1);
  useEffect(() => {
    if (playhead >= 0 && playhead !== prevPlayhead.current && audio.ready && audio.ctx.current) {
      const step = steps[playhead];
      if (step.active) {
        const playNote = async () => {
          try {
            const ctx = audio.ctx.current;

            // Resume AudioContext if suspended (Safari)
            if (ctx.state === 'suspended') {
              await ctx.resume();
            }

            const freq = NOTE_FREQS[noteNames[step.note]] || 261.63;
            const osc = ctx.createOscillator();
            const filt = ctx.createBiquadFilter();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            filt.type = 'lowpass';
            filt.frequency.value = 2500;
            filt.Q.value = 1;
            const dur = Math.min((60 / bpm / 4) * 0.8, 0.3);
            g.gain.setValueAtTime(0.22, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.connect(filt);
            filt.connect(g);
            g.connect(audio.master.current);
            osc.start();
            osc.stop(ctx.currentTime + dur + 0.02);
          } catch (e) {
            // AudioContext may be closed or suspended
          }
        };

        playNote();
      }
    }
    prevPlayhead.current = playhead;
  }, [playhead, steps, audio.ready, bpm]);

  useEffect(() => () => setPlaying(false), []);

  const toggleStep = (i) => {
    const n = [...steps];
    n[i] = { ...n[i], active: !n[i].active };
    setSteps(n);
  };
  const toggleAS = (i) => {
    const n = [...activeSteps];
    n[i] = !n[i];
    setActiveSteps(n);
  };
  const cycleNote = (i) => {
    const n = [...steps];
    n[i] = { ...n[i], note: (n[i].note + 1) % noteNames.length };
    setSteps(n);
  };

  return (
    <div className="chapter-content">
      <p>
        A <strong>step sequencer</strong> loops through 16 steps automatically. On the Volca Keys
        you record in <strong>real time</strong>. <strong>Motion sequencing</strong> records knob
        movements into the pattern.
      </p>
      <div className="viz-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`wave-btn ${playing ? 'active' : ''}`}
              onClick={() => {
                if (!audio.ready) audio.init();
                setPlaying(!playing);
              }}
            >
              {playing ? '■ Stop' : '▶ Play'}
            </button>
            <button
              className={`wave-btn ${showAS ? 'active' : ''}`}
              style={
                showAS
                  ? {
                      borderColor: 'var(--amber)',
                      color: 'var(--amber)',
                      background: 'var(--amber-dim)',
                    }
                  : {}
              }
              onClick={() => setShowAS(!showAS)}
            >
              Active Step
            </button>
          </div>
          <div style={{ width: 160 }}>
            <Slider label="BPM" value={bpm} onChange={setBpm} min={60} max={200} step={1} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 4 }}>
          {steps.map((step, i) => {
            const isP = playhead === i;
            const isI = !activeSteps[i];

            if (showAS)
              return (
                <div
                  key={i}
                  onClick={() => toggleAS(i)}
                  style={{
                    height: 48,
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    background: isI ? 'var(--surface-3)' : 'var(--amber-dim)',
                    border: `1px solid ${isI ? 'var(--border)' : 'var(--amber)'}`,
                    color: isI ? 'var(--text-3)' : 'var(--amber)',
                    opacity: isI ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {i + 1}
                </div>
              );

            return (
              <div
                key={i}
                onClick={() => toggleStep(i)}
                style={{
                  height: 48,
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2,
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  background:
                    isP && step.active
                      ? 'var(--cyan)'
                      : step.active
                      ? 'var(--cyan-dim)'
                      : 'var(--surface-2)',
                  border: `1px solid ${isP ? 'var(--cyan)' : step.active ? 'var(--cyan)40' : 'var(--border)'}`,
                  color:
                    isP && step.active ? 'var(--bg)' : step.active ? 'var(--cyan)' : 'var(--text-3)',
                  opacity: isI ? 0.25 : 1,
                  boxShadow: isP && step.active ? '0 0 12px var(--cyan-dim)' : 'none',
                  transition: 'background 0.08s, box-shadow 0.08s',
                }}
              >
                <span>{i + 1}</span>
                {step.active && (
                  <span
                    style={{ fontSize: '0.55rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleNote(i);
                    }}
                  >
                    {noteNames[step.note]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 12, marginBottom: 0 }}>
          ↑ Press Play to hear it! Click steps to toggle, click note names to change pitch, use
          Active Step to skip steps.
        </p>
      </div>
      <p style={{ marginTop: 16 }}>
        The built-in <strong>delay effect</strong> adds lo-fi echo. <strong>TIME</strong> sets
        spacing, <strong>FEEDBACK</strong> controls repeats. Moving TIME while echoes sound warps
        their pitch like tape echo.
      </p>
      <VolcaCallout>
        <p>
          <strong>FUNC + PLAY</strong> = Active Step. <strong>REC</strong> during playback = record.
          Up to <strong>8 patterns</strong> saved. <strong>Flux mode</strong> (FUNC + step 15) =
          unquantized recording.
        </p>
      </VolcaCallout>
      <DiveDeeper>
        <p>
          <strong>Active Step creates polyrhythms:</strong> Disabling steps to create odd-length
          loops (5, 7, 11 steps) produces complex rhythmic results against the 4/4 grid.
        </p>
        <p>
          <strong>The delay as an instrument:</strong> At extreme feedback it self-oscillates,
          producing sound that persists after you stop playing. Many musicians treat it as a sound
          source, not just an effect.
        </p>
      </DiveDeeper>
    </div>
  );
}
