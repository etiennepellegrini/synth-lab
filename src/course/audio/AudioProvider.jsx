import { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AudioEngine } from '../../lib/audio-engine.js';

const AudioCtx = createContext(null);

/**
 * AudioProvider wraps the shared audio-engine for use in the course.
 *
 * The course chapters create oscillators directly (not using Voice class),
 * so this provider exposes the underlying AudioContext and master gain
 * while managing the AudioEngine lifecycle.
 */
export function AudioProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const engineRef = useRef(null);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);

  const init = useCallback(async () => {
    if (engineRef.current) {
      // Already initialized, just resume
      if (ctxRef.current && ctxRef.current.state === 'suspended') {
        await ctxRef.current.resume();
      }
      setReady(true);
      return;
    }

    try {
      const engine = new AudioEngine();
      await engine.init();

      engineRef.current = engine;
      ctxRef.current = engine.context;
      masterRef.current = engine.masterGain;

      setReady(true);
    } catch (e) {
      console.warn('Web Audio not available', e);
    }
  }, []);

  // Handle mute state
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMasterMute(muted);
    }
  }, [muted]);

  const value = useMemo(
    () => ({
      // Expose refs in same format as original course
      ctx: ctxRef,
      master: masterRef,
      ready,
      init,
      muted,
      setMuted,
      // Also expose engine for advanced use cases
      engine: engineRef.current,
    }),
    [ready, muted, init]
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  const context = useContext(AudioCtx);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
