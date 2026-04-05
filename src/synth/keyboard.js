// ======================================================================
// Keyboard Module - Touch and QWERTY Input
// ======================================================================

import { noteOn, noteOff } from './synth-app.js';
import { state } from './synth-app.js';

// NOTE: Building keyboard HTML from controlled data (safe innerHTML usage)

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ======================================================================
// Keyboard Rendering
// ======================================================================

function buildKeyboard() {
  const whites = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blacks = [
    { note: 'C#', pos: 1 },
    { note: 'D#', pos: 2 },
    { note: 'F#', pos: 4 },
    { note: 'G#', pos: 5 },
    { note: 'A#', pos: 6 },
  ];

  let html = '';

  // White keys
  whites.forEach((n) => {
    const isActive = state.activeNote === n;
    html += `<div class="key-white ${isActive ? 'active' : ''}" data-note="${n}"><span class="key-label">${n}</span></div>`;
  });

  // Black keys
  blacks.forEach((b) => {
    const isActive = state.activeNote === b.note;
    const left = (b.pos / 7) * 100 - 4;
    html += `<div class="key-black ${isActive ? 'active' : ''}" data-note="${b.note}" style="left:${left}%"></div>`;
  });

  return html;
}

// ======================================================================
// Event Handlers
// ======================================================================

// Track if mouse is currently pressed on a key
let mouseDownOnKey = false;

// Track if document-level listeners have been added (prevent duplicates)
let documentListenersAdded = false;

export function initKeyboard() {
  const kb = document.getElementById('keyboard');
  if (!kb) return;

  kb.innerHTML = buildKeyboard();

  const keys = kb.querySelectorAll('.key-white, .key-black');

  keys.forEach((key) => {
    // --- Mouse Handling

    const handleMouseDown = (e) => {
      e.preventDefault();
      mouseDownOnKey = true;
      const note = key.dataset.note;
      noteOn(note, state.octave);
    };

    // --- Touch Handling

    const handleTouchStart = (e) => {
      e.preventDefault();
      const note = key.dataset.note;
      noteOn(note, state.octave);
    };

    key.addEventListener('mousedown', handleMouseDown);
    key.addEventListener('touchstart', handleTouchStart, { passive: false });
  });

  // --- Release Handlers
  // Only register document-level listeners once to prevent memory leak

  if (!documentListenersAdded) {
    const handleMouseUp = () => {
      // Only trigger noteOff if mouse was pressed on a key
      if (mouseDownOnKey && state.activeNote) {
        noteOff();
        mouseDownOnKey = false;
      }
    };

    const handleTouchEnd = () => {
      if (state.activeNote) {
        noteOff();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    documentListenersAdded = true;
  }
}

// ======================================================================
// QWERTY Keyboard Mapping
// ======================================================================

const QWERTY_MAP = {
  a: 'C',
  w: 'C#',
  s: 'D',
  e: 'D#',
  d: 'E',
  f: 'F',
  t: 'F#',
  g: 'G',
  y: 'G#',
  h: 'A',
  u: 'A#',
  j: 'B',
};

const activeQwertyKeys = new Set();

document.addEventListener('keydown', (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey) return;

  const key = e.key.toLowerCase();
  const note = QWERTY_MAP[key];

  if (note && !activeQwertyKeys.has(key)) {
    activeQwertyKeys.add(key);
    noteOn(note, state.octave);
  }

  // Octave change with Z/X
  if (key === 'z') {
    state.octave = Math.max(1, state.octave - 1);
    import('./synth-app.js').then((app) => app.render());
  }
  if (key === 'x') {
    state.octave = Math.min(7, state.octave + 1);
    import('./synth-app.js').then((app) => app.render());
  }
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();

  if (QWERTY_MAP[key] && activeQwertyKeys.has(key)) {
    activeQwertyKeys.delete(key);
    if (activeQwertyKeys.size === 0) {
      noteOff();
    }
  }
});
