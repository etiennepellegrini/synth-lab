import { useState, useEffect } from 'react';
import { AudioProvider, useAudio } from './audio/AudioProvider.jsx';
import { Chapter1 } from './chapters/Chapter1.jsx';
import { Chapter2 } from './chapters/Chapter2.jsx';
import { Chapter3 } from './chapters/Chapter3.jsx';
import { Chapter4 } from './chapters/Chapter4.jsx';
import { Chapter5 } from './chapters/Chapter5.jsx';
import { Chapter6 } from './chapters/Chapter6.jsx';
import { Chapter7 } from './chapters/Chapter7.jsx';

const chapters = [
  {
    num: 1,
    title: 'What Is Sound?',
    subtitle: 'Vibrations, waveforms & the basics',
    component: Chapter1,
  },
  {
    num: 2,
    title: 'Oscillators & Waveforms',
    subtitle: 'The raw ingredients of synthesis',
    component: Chapter2,
  },
  {
    num: 3,
    title: 'Filters',
    subtitle: 'Sculpting tone with frequency',
    component: Chapter3,
  },
  {
    num: 4,
    title: 'Envelopes',
    subtitle: 'Shaping sound over time',
    component: Chapter4,
  },
  {
    num: 5,
    title: 'LFO & Modulation',
    subtitle: 'Adding movement and expression',
    component: Chapter5,
  },
  {
    num: 6,
    title: 'Signal Flow',
    subtitle: 'How it all connects',
    component: Chapter6,
  },
  {
    num: 7,
    title: 'Sequencer & Effects',
    subtitle: 'Making patterns and adding space',
    component: Chapter7,
  },
];

function App() {
  const [cur, setCur] = useState(0);
  const audio = useAudio();
  const ch = chapters[cur];
  const C = ch.component;

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove '#'
      if (hash.startsWith('chapter-')) {
        const chapterNum = parseInt(hash.split('-')[1], 10);
        if (chapterNum >= 1 && chapterNum <= chapters.length) {
          setCur(chapterNum - 1);
          window.scrollTo(0, 0);
        }
      }
    };

    // Handle initial hash on load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when chapter changes via UI
  const goToChapter = (index) => {
    setCur(index);
    window.location.hash = `chapter-${index + 1}`;
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: 'var(--amber)',
              }}
            >
              SYNTHESIS FUNDAMENTALS
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-3)',
                marginTop: 2,
              }}
            >
              A course for the Korg Volca Keys
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {audio.ready && (
              <button
                className={`audio-btn ${audio.muted ? 'audio-off' : 'audio-on'}`}
                onClick={() => audio.setMuted(!audio.muted)}
                style={{ marginRight: 8 }}
              >
                {audio.muted ? '🔇 Muted' : '🔊 Audio'}
              </button>
            )}
            {chapters.map((c, i) => (
              <button
                key={i}
                className={`nav-btn ${i === cur ? 'active' : ''}`}
                onClick={() => goToChapter(i)}
                title={c.title}
              >
                {c.num}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px', width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--amber)',
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}
          >
            CHAPTER {ch.num} OF {chapters.length}
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: 4,
              lineHeight: 1.2,
            }}
          >
            {ch.title}
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>{ch.subtitle}</p>
        </div>
        <C key={cur} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
          }}
        >
          {cur > 0 ? (
            <button
              className="wave-btn"
              onClick={() => goToChapter(cur - 1)}
              style={{ padding: '10px 20px' }}
            >
              ← {chapters[cur - 1].title}
            </button>
          ) : (
            <div />
          )}
          {cur < chapters.length - 1 ? (
            <button
              className="wave-btn"
              onClick={() => goToChapter(cur + 1)}
              style={{
                padding: '10px 20px',
                borderColor: 'var(--amber)',
                color: 'var(--amber)',
              }}
            >
              {chapters[cur + 1].title} →
            </button>
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--green)',
                alignSelf: 'center',
              }}
            >
              ✓ Course complete — time to play!
            </span>
          )}
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)' }}>
          Interactive synthesis course with Web Audio. Best experienced with headphones.
        </p>
      </footer>
    </div>
  );
}

export default function CourseApp() {
  return (
    <AudioProvider>
      <App />
    </AudioProvider>
  );
}
