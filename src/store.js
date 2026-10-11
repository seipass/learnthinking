import { DEMO_THOUGHTS } from './vocabulary.js';
import { analyzeThoughts } from './parser.js';

export const STORAGE_KEY = 'learnthinking.v1';
export const EMPTY_STATE = () => ({ version: 1, sessions: [], learning: {} });

export function demoState() {
  const a = analyzeThoughts(DEMO_THOUGHTS);
  return { version: 1, sessions: [{ id: 'demo', name: 'サンプルの思考ログ', source: 'サンプル', importedAt: new Date().toISOString(), thoughtsCount: DEMO_THOUGHTS.length, demo: true, ...a }], learning: {} };
}

function safeSession(session) {
  if (!session || typeof session !== 'object' || typeof session.id !== 'string') return null;
  const counts = {};
  for (const [word,n] of Object.entries(session.counts || {})) {
    if (/^[a-z]{3,24}$/.test(word) && Number.isSafeInteger(n) && n > 0) counts[word] = n;
  }
  const examples = {};
  for (const [word,arr] of Object.entries(session.examples || {})) {
    if (counts[word] && Array.isArray(arr)) examples[word] = arr.filter(x => typeof x === 'string').slice(0,2).map(x => x.slice(0,190));
  }
  return { id: session.id.slice(0,120), name: String(session.name || '名称未設定').slice(0,180), source: String(session.source || 'その他').slice(0,80), importedAt: typeof session.importedAt === 'string' ? session.importedAt : new Date().toISOString(), thoughtsCount: Number(session.thoughtsCount) || 0, totalWords: Object.values(counts).reduce((a,b) => a+b,0), uniqueWords: Object.keys(counts).length, demo: !!session.demo, counts, examples };
}

export function sanitizeState(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.sessions)) return EMPTY_STATE();
  const learning = {};
  if (value.learning && typeof value.learning === 'object') {
    for (const [word,entry] of Object.entries(value.learning)) {
      if (!/^[a-z]{3,24}$/.test(word) || !entry || typeof entry !== 'object') continue;
      learning[word] = {
        status: ['new','learning','mastered'].includes(entry.status) ? entry.status : 'new',
        dueAt: typeof entry.dueAt === 'string' ? entry.dueAt : '',
        interval: Math.max(0, Math.min(365, Number(entry.interval) || 0)),
        correct: Math.max(0, Number(entry.correct) || 0),
        incorrect: Math.max(0, Number(entry.incorrect) || 0),
        meaning: typeof entry.meaning === 'string' ? entry.meaning.slice(0,160) : ''
      };
    }
  }
  return { version:1, sessions: value.sessions.slice(0,600).map(safeSession).filter(Boolean), learning };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : demoState();
  } catch { return demoState(); }
}

export function saveState(state, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function vocabularyFromSessions(sessions, selectedSource = 'all') {
  const grouped = new Map();
  for (const session of sessions) {
    if (selectedSource !== 'all' && session.source !== selectedSource) continue;
    for (const [word, count] of Object.entries(session.counts)) {
      if (!grouped.has(word)) grouped.set(word, { word, count: 0, sessionCount: 0, examples: [], sessions: [] });
      const row = grouped.get(word);
      row.count += count;
      row.sessionCount++;
      row.sessions.push({ name: session.name, source: session.source, count });
      for (const example of (session.examples?.[word] || [])) {
        if (row.examples.length < 3 && !row.examples.includes(example)) row.examples.push(example);
      }
    }
  }
  return Array.from(grouped.values()).sort((a,b) => b.count-a.count || a.word.localeCompare(b.word));
}

export function learningStatus(state, word) { return state.learning[word]?.status || 'new'; }
export function isDue(entry, now = Date.now()) { return !entry?.dueAt || new Date(entry.dueAt).getTime() <= now; }

export function reviewWord(state, word, remembered, now = Date.now()) {
  const old = state.learning[word] || { interval:0, correct:0, incorrect:0 };
  // 1 -> 3 -> 7 -> 14 -> 30 -> 60 day intervals for a remembered word.
  const interval = remembered ? (old.interval === 0 ? 1 : old.interval === 1 ? 3 : Math.min(60, old.interval * 2 + 1)) : 0;
  const dueAt = new Date(now + (remembered ? interval * 86400000 : 10 * 60000)).toISOString();
  state.learning[word] = { ...old, interval, dueAt, status: remembered && interval >= 7 ? 'mastered' : 'learning', correct: (old.correct||0) + Number(remembered), incorrect: (old.incorrect||0) + Number(!remembered) };
  return state.learning[word];
}
