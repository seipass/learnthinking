import { STOPWORDS, normalizeWord } from './vocabulary.js';

const MAX_EXAMPLE_LENGTH = 190;
const MAX_EXAMPLES_PER_WORD = 2;
const MAX_SAVED_EXAMPLE_WORDS = 250;
const MAX_BLOCKS = 60000;

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

/** Extract only fields explicitly marked as thinking or reasoning. Never mine ordinary chat text. */
export function extractThoughts(root) {
  const thoughts = [];
  const seenText = new Set();
  let source = 'その他';
  let recognized = false;
  const add = (text) => {
    if (typeof text !== 'string') return;
    const clean = text.trim();
    if (!clean || seenText.has(clean) || thoughts.length >= MAX_BLOCKS) return;
    seenText.add(clean);
    thoughts.push(clean);
  };
  const extractExplicit = (value, depth = 0) => {
    if (depth > 5 || value == null) return;
    if (typeof value === 'string') { add(value); return; }
    if (Array.isArray(value)) { for (const item of value) extractExplicit(item, depth + 1); return; }
    if (!isObject(value)) return;
    // Known thought summaries and typed reasoning content, not arbitrary metadata.
    for (const key of ['thinking', 'reasoning', 'summary_text', 'description', 'text']) {
      if (typeof value[key] === 'string') add(value[key]);
    }
    if (typeof value.summary === 'string') add(value.summary);
    if (typeof value.content === 'string' && (value.type === 'thinking' || value.type === 'reasoning')) add(value.content);
    for (const key of ['parts', 'content', 'summary', 'thoughts']) {
      if (typeof value[key] === 'object') extractExplicit(value[key], depth + 1);
    }
  };
  const visit = (node, depth = 0) => {
    if (depth > 12 || node == null) return;
    if (Array.isArray(node)) { for (const item of node) visit(item, depth + 1); return; }
    if (!isObject(node)) return;

    if (node.type === 'session_meta' || node.type === 'turn_context') return;
    if (node.type === 'response_item' && isObject(node.payload)) {
      source = 'Codex'; recognized = true;
      visit(node.payload, depth + 1); return;
    }
    if (node.type === 'event_msg' && isObject(node.payload)) {
      source = 'Codex'; recognized = true;
      if (['agent_reasoning', 'agent_reasoning_delta', 'reasoning'].includes(node.payload.type)) {
        extractExplicit(node.payload.text ?? node.payload.summary ?? node.payload);
      }
      return;
    }
    if (node.type === 'assistant' && isObject(node.message)) {
      source = 'Claude Code'; recognized = true;
      visit(node.message, depth + 1); return;
    }
    if (node.type === 'gemini' || (Array.isArray(node.messages) && typeof node.sessionId === 'string')) {
      source = 'Gemini CLI'; recognized = true;
    }
    if (node.type === 'part' && isObject(node.part)) { source = 'OpenCode'; recognized = true; visit(node.part, depth + 1); return; }

    const t = typeof node.type === 'string' ? node.type.toLowerCase() : '';
    if (['thinking', 'reasoning', 'reasoning_text', 'summary_text'].includes(t)) {
      recognized = true;
      if (t === 'thinking' && source === 'その他') source = 'Claude Code / 汎用';
      // For these explicit block types, the text/summary belongs to thinking.
      extractExplicit(node);
      return;
    }
    if (node.role === 'user' || t === 'user' || t === 'tool_result' || t === 'function_call_output') return;
    if (node.role === 'tool' || t === 'tool' || t === 'function_call') return;
    // Gemini has explicit thought summaries on model messages.
    if (node.thoughts != null && (t === 'gemini' || node.role === 'assistant' || node.role === 'model' || node.messages || !t)) {
      recognized = true;
      extractExplicit(node.thoughts);
    }
    if (typeof node.thinking === 'string' && (node.role === 'assistant' || node.role === 'model' || !node.role)) {
      recognized = true; add(node.thinking);
    }
    if (node.reasoning != null && (node.role === 'assistant' || node.role === 'model' || !node.role)) {
      recognized = true; extractExplicit(node.reasoning);
    }
    if (node.role === 'assistant' && isObject(node.reasoning_content)) { recognized = true; extractExplicit(node.reasoning_content); }
    if (typeof node.reasoning_content === 'string' && node.role === 'assistant') { recognized = true; add(node.reasoning_content); }
    // OpenAI-style and Claude-style nested content blocks.
    if (Array.isArray(node.content)) visit(node.content, depth + 1);
    if (Array.isArray(node.parts)) visit(node.parts, depth + 1);
    if (Array.isArray(node.messages)) visit(node.messages, depth + 1);
    if (isObject(node.message) && (node.role === 'assistant' || t === 'assistant')) visit(node.message, depth + 1);
    if (isObject(node.payload) && (t === 'message' || t === 'record')) visit(node.payload, depth + 1);
    // Gemini append-only patches may contain message updates.
    if (isObject(node.$patch) && (Array.isArray(node.$patch.updates) || Array.isArray(node.$patch.content))) visit(node.$patch.updates ?? node.$patch.content, depth + 1);
  };
  visit(root);
  return { thoughts, source, recognized };
}

export function parseSessionText(raw, filename = 'session.jsonl') {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('ファイルが空です。');
  const lower = filename.toLowerCase();
  let records;
  if (/\.(txt|md|markdown)$/.test(lower)) {
    // Text is opt-in: selecting a text file explicitly treats it as thinking text.
    return { thoughts: [raw], source: 'テキスト', recognized: true };
  }
  try {
    records = JSON.parse(raw);
  } catch {
    const lines = raw.split(/\r?\n/).filter(line => line.trim());
    const entries = [];
    let invalid = 0;
    for (const line of lines) {
      try { entries.push(JSON.parse(line)); } catch { invalid++; }
    }
    if (!entries.length || invalid > 0) throw new Error(`JSON形式を読み取れませんでした（不正な行: ${invalid}）。`);
    records = entries;
  }
  return extractThoughts(records);
}

export function cleanThinkingText(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/gi, ' ')
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, ' ')
    .replace(/(?:\.{0,2}\/|~\/)[\w./-]+/g, ' ')
    .replace(/\b[A-Za-z]+(?:_[A-Za-z0-9]+)+\b/g, ' ');
}

export function tokenize(text) {
  const clean = cleanThinkingText(text);
  const words = clean.match(/[a-z]+(?:['’][a-z]+)?/gi) || [];
  return words.map(normalizeWord).filter(word => word.length >= 3 && word.length <= 24 && !STOPWORDS.has(word));
}

function scrubExample(text) {
  return text
    .replace(/https?:\/\/\S+/gi, '[URL]')
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[メールアドレス]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{16,}|Bearer\s+[A-Za-z0-9._~+/=-]{12,})\b/g, '[伏せ字]');
}

export function analyzeThoughts(thoughts) {
  const counts = Object.create(null);
  const examples = Object.create(null);
  let totalWords = 0;
  for (const block of thoughts) {
    if (typeof block !== 'string') continue;
    // Sentences are the only material saved for contextual examples.
    const sentences = block.replace(/\s+/g, ' ').match(/[^.!?\n]+[.!?]?/g) || [];
    for (const sentence of sentences) {
      if (sentence.length < 12) continue;
      const found = tokenize(sentence);
      for (const word of found) {
        counts[word] = (counts[word] || 0) + 1;
        totalWords++;
        if (!examples[word]) examples[word] = [];
        if (examples[word].length < MAX_EXAMPLES_PER_WORD && !examples[word].includes(sentence.trim())) {
          // Trim before storage; never retain full source sessions.
          examples[word].push(scrubExample(sentence.trim()).slice(0, MAX_EXAMPLE_LENGTH));
        }
      }
    }
  }
  const leaders = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,MAX_SAVED_EXAMPLE_WORDS);
  const trimmedExamples = Object.fromEntries(leaders.filter(([w]) => examples[w]?.length).map(([w]) => [w, examples[w]]));
  return { counts: { ...counts }, examples: trimmedExamples, totalWords, uniqueWords: Object.keys(counts).length };
}

export function fingerprint(raw) {
  // Fast deterministic identifier; avoids keeping full session content in storage.
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) { hash ^= raw.charCodeAt(i); hash = Math.imul(hash,16777619); }
  return (hash >>> 0).toString(36) + '-' + raw.length;
}
