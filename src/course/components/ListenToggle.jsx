import { useAudio } from '../audio/AudioProvider.jsx';

/**
 * Toggle button for enabling/disabling audio in interactive demos.
 */
export function ListenToggle({ on, onToggle, label }) {
  const audio = useAudio();

  return (
    <button
      className={`listen-btn ${on ? 'on' : ''}`}
      onClick={() => {
        if (!audio.ready) audio.init();
        onToggle(!on);
      }}
    >
      {on ? '🔊' : '🔇'} {label || (on ? 'Sound On' : 'Listen')}
    </button>
  );
}
