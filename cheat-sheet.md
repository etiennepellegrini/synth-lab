# Volca Keys — Cheat Sheet

## Knob Map

| Knob | Section | Function | Motion Rec? |
|---|---|---|:---:|
| **VOICE** | VCO | Oscillator mode (Poly / Unison / Octave / Fifth / Unison Ring / Poly Ring) | ✗ |
| **OCTAVE** | VCO | Keyboard register (32' to 1') | ✓ |
| **DETUNE** | VCO | Spread between oscillators (center = unison) | ✓ |
| **PORTAMENTO** | VCO | Glide speed between notes | ✓ |
| **VCO EG INT** | VCO | Envelope → pitch amount (center = none) | ✓ |
| **CUTOFF** | VCF | Filter cutoff frequency | ✓ |
| **PEAK** | VCF | Filter resonance (self-oscillates at max) | ✗ |
| **CUTOFF EG INT** | VCF | Envelope → filter cutoff amount (center = none) | ✓ |
| **ATTACK** | EG | Envelope attack time | ✓ |
| **DECAY/RELEASE** | EG | Envelope decay + release time (single knob controls both) | ✓ |
| **SUSTAIN** | EG | Envelope sustain level (held while key is pressed) | ✓ |
| **LFO RATE** | LFO | LFO speed | ✓ |
| **LFO PITCH INT** | LFO | LFO → oscillator pitch amount (vibrato) | ✓ |
| **LFO CUTOFF INT** | LFO | LFO → filter cutoff amount (wah) | ✓ |
| **DELAY TIME** | Delay | Echo delay time | ✓ |
| **DELAY FEEDBACK** | Delay | Echo repeats / regeneration | ✓ |
| **TEMPO** | — | Sequencer BPM | — |
| **VOLUME** | — | Output level | — |

## Voice Modes

| Mode | Waveform | Oscillator Config |
|---|---|---|
| Poly | Saw | 3 independent pitches (chords) |
| Unison | Saw | 3 oscillators, same pitch (fat lead) |
| Octave | Saw | 2 at root + 1 octave up |
| Fifth | Saw | 2 at root + 1 fifth up |
| Unison Ring | Square | 3 ring-modulated, same pitch |
| Poly Ring | Square | 3 ring-modulated, independent pitch |

## Key Combos

| Action | Combo |
|---|---|
| Clear current pattern | FUNC + Step 16 |
| Save pattern | FUNC → MEMORY → Step 1-8 |
| Load/switch pattern | FUNC → Step 1-8 (during playback: seamless switch) |
| Set MIDI channel | Hold MEMORY at power-on → Step 1-16 |
| Active Step mode | FUNC + PLAY (during playback) |
| Flux mode toggle | FUNC + Step 15 |
| Delay tempo sync | FUNC + Step 14 |
| LFO trigger sync | FUNC + Step 11 |
| Playback speed: normal | FUNC + Step 1 |
| Playback speed: ½ | FUNC + Step 2 |
| Playback speed: ¼ | FUNC + Step 3 |
| Erase step during rec | FUNC + Step key (while recording) |
| Motion recording | Press REC during playback, turn knobs |
| Clear motion for a knob | FUNC + turn the knob (during rec) |
| Step Trigger | Touch keyboard during playback (repeats note at clock div) |
| Disable auto power-off | Hold FUNC at power-on → press keyboard button 1 |
| Factory reset sequences | Hold FUNC + MEMORY at power-on → press REC |
| Reset panel processor | Hold REC + MEMORY while powering on |

## Signal Chain

```
[VCO ×3] ──→ [VCF 12dB LP] ──→ [VCA] ──→ [Delay] ──→ OUT
   ↑              ↑                ↑
  EG(pitch)     EG(cutoff)       EG(amp)
  LFO(pitch)    LFO(cutoff)
```

## Filter Specs

- Type: 12dB/octave low-pass (Korg 700S diode ring circuit)
- Self-oscillates at high Peak settings
- No keyboard tracking (self-oscillation pitch is static)
- Cutoff and CUTOFF EG INT are controllable via MIDI CC
- Peak (resonance) is NOT controllable via MIDI

## LFO Notes

- Waveforms: Sawtooth, Triangle, Square
- Rate goes into audio range (FM-like effects at high speeds)
- Can modulate: pitch (PITCH INT) and filter cutoff (CUTOFF INT)
- Cannot modulate: amplitude (no tremolo on this synth)
- Trigger sync toggleable (FUNC + Step 11): restart LFO on each note, or let it free-run

## MIDI CC Reference

> **Note:** Verify these CC numbers against [Korg's official MIDI implementation chart](http://i.korg.com/uploads/Support/USA_volcakeys_MIDI_Chart_E.pdf) — the numbers below are based on community documentation and may contain errors.

| CC# | Parameter |
|---|---|
| 11 | Expression |
| 40 | Voice |
| 41 | Octave |
| 42 | Detune |
| 43 | VCO EG INT |
| 44 | Cutoff |
| 45 | VCF EG INT |
| 46 | LFO Rate |
| 47 | LFO Pitch INT |
| 48 | LFO Cutoff INT |
| 49 | Delay Hi Pass Cutoff |
| 50 | Delay Time |
| 51 | Delay Feedback |

## Quick Troubleshooting

- **No sound**: Check volume. Check headphone connection (internal speaker disconnects when jack is inserted). Make sure you're touching the ribbon keyboard firmly.
- **Pitch is wrong**: Self-tuning runs at power-on. Wait a few seconds. If pitch has drifted, stop all sound for ~10 seconds and the auto-tuning will correct.
- **Pattern won't save**: Make sure you're doing FUNC → MEMORY → step key (not just MEMORY → step).
- **Weird behavior**: Reset panel processor by holding REC + MEMORY while powering on.
- **Ground loop hum**: Common when daisy-chaining power or connecting to multiple devices. Use an audio isolator cable if needed.
- **Sync issues**: Ensure audio cables are stereo (TRS), check sync polarity in global parameters.
