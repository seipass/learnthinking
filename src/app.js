import { DICTIONARY, DEMO_THOUGHTS } from './vocabulary.js';
import { parseSessionText, analyzeThoughts, fingerprint } from './parser.js';
import { loadState, saveState, EMPTY_STATE, demoState, vocabularyFromSessions, learningStatus, isDue, reviewWord, sanitizeState } from './store.js';

const ICONS = {
  home:'<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m7 11 5-4 5 4v6H7z"/>',
  book:'<path d="M4 19.5C4 18 5 17 7 17h13V4H7C5 4 4 5 4 7v12.5ZM4 19.5C4 21 5 22 7 22h13v-5"/><path d="M8 8h8M8 12h6"/>',
  layers:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h6M8 16h4"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3z"/>',
  settings:'<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  upload:'<path d="M12 16V3m0 0L7 8m5-5 5 5M4 16v4h16v-4"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  brain:'<path d="M10 5C7 3 3 6 4 9c-3 2-2 6 1 7-1 4 3 6 6 3V5Zm4 0c3-2 7 1 6 4 3 2 2 6-1 7 1 4-3 6-6 3V5Z"/>',
  chart:'<path d="M4 20V10M10 20V5M16 20v-8M22 20V3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  close:'<path d="M5 5l14 14M19 5 5 19"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7M10 11v6m4-6v6"/>',
  file:'<path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h7"/>',
  download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  shield:'<path d="M12 3 4 6v5c0 6 3.5 9 8 11 4.5-2 8-5 8-11V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  keyboard:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.1M10 9h.1M14 9h.1M18 9h.1M6 13h.1M10 13h.1M14 13h.1M18 13h.1M7 16h10"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nfmt = n => new Intl.NumberFormat('ja-JP').format(n);
const dateText = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ja-JP',{year:'numeric',month:'short',day:'numeric'}); };
const statusText = { new:'未学習', learning:'学習中', mastered:'習得済み' };
let state = loadState();
const ui = { page: 'dashboard', query:'', filter:'all', source:'all', sort:'frequency', limit:20, studyDeck:[], studyIndex:0, revealed:false, showAll:false, modal:null, selectedWord:null, selectedSession:null, importInfo:null };
const main = document.getElementById('main');
const modalRoot = document.getElementById('modal-root');
const toastEl = document.getElementById('toast');
let toastTimeout;

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3500);
}
function persist() {
  try { saveState(state); return true; }
  catch { toast('保存容量に達しました。設定から不要なセッションを削除してください。'); return false; }
}
function allWords() { return vocabularyFromSessions(state.sessions, ui.source); }
function masteryCount(words = allWords()) { return words.filter(row => learningStatus(state, row.word) === 'mastered').length; }
function dueWords(words = allWords()) { return words.filter(row => { const e = state.learning[row.word]; return (!e || e.status !== 'mastered' || isDue(e)) && isDue(e); }); }
function isDemo() { return state.sessions.length && state.sessions.every(s => s.demo); }
function saveAndRender() { persist(); render(); }
function pageHeader(eyebrow,title,subtitle,right='') { return `<div class="page-header"><div><div class="page-eyebrow">${eyebrow}</div><h1 class="page-heading">${title}</h1><p class="page-subtitle">${subtitle}</p></div>${right}</div>`; }
function demoNotice() { return isDemo() ? `<div class="demo-notice">${icon('info')}<span>現在はサンプルデータを表示しています。自分のログを読み込むとサンプルは自動的に入れ替わります。</span><button class="text-link" data-action="import-modal">追加する ${icon('arrow')}</button></div>` : ''; }
function statCard(label,value,unit,ic,color) { return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-symbol ${color}">${icon(ic)}</span></div><div class="stat-value">${nfmt(value)}<span class="stat-unit">${unit}</span></div></div>`; }
function sourceIcon(source) { return source==='Claude Code'?'C':source==='Gemini CLI'?'G':source==='Codex'?'⌘':source==='OpenCode'?'O':source==='サンプル'?'✳':'T'; }
function sourceClass(source) { return source.includes('Claude')?'claude':source.includes('Gemini')?'gemini':source.includes('Codex')?'codex':''; }
function emptyBlock(title,message,ic='book',action='import-modal',button='ログを読み込む') { return `<div class="empty"><div class="empty-icon">${icon(ic)}</div><h3>${title}</h3><p>${message}</p>${action?`<button class="btn btn-primary btn-small" data-action="${action}">${button}</button>`:''}</div>`; }
function wordRow(row,index) {
  const status = learningStatus(state,row.word), entry = state.learning[row.word];
  const meaning = entry?.meaning || DICTIONARY[row.word]?.ja || '意味を登録できます';
  return `<tr><td class="word-cell"><button data-action="word-detail" data-word="${row.word}">${esc(row.word)}</button></td><td>${esc(meaning)}</td><td><span class="frequency-pill">${nfmt(row.count)} 回</span></td><td><span class="status ${status}">${statusText[status]}</span></td><td><div class="table-actions"><button class="btn-icon" data-action="word-detail" data-word="${row.word}" title="詳細を見る" aria-label="${row.word}の詳細">${icon('chevron')}</button></div></td></tr>`;
}
function wordsTable(words) { return `<div class="panel list-panel"><table class="word-table"><thead><tr><th>単語</th><th>日本語の意味</th><th>出現頻度</th><th>学習状況</th><th></th></tr></thead><tbody>${words.map(wordRow).join('')}</tbody></table>${words.length?'':emptyBlock('単語が見つかりません','検索条件を変えるか、ログを追加してください。','search',null)}</div>`; }
function dashboardPage() {
  const words=allWords(), sessions=state.sessions, thoughts=sessions.reduce((sum,s)=>sum+s.thoughtsCount,0), due=dueWords(words);
  const top=words.slice(0,6), max=top[0]?.count || 1, first=words.find(w=>learningStatus(state,w.word)==='new') || words[0];
  return `${pageHeader('YOUR LEARNING SPACE','おかえりなさい 👋','AIの思考を読むたびに、あなたの語彙が育っていきます。')}${demoNotice()}
    <section class="hero"><div class="hero-copy"><span class="hero-tag">✦ &nbsp; LEARN FROM THINKING</span><h2>AIの思考から、<br>まだ知らない英単語へ。</h2><p>普段使っているAIの思考ログから頻出語を見つけて、<br>自分だけの単語帳を育てましょう。</p><button class="btn btn-white" data-action="import-modal">${icon('upload')} 思考ログを読み込む ${icon('arrow')}</button></div><div class="hero-orbit"></div><div class="hero-art" aria-hidden="true"><div class="sheet"> <div class="sheet-lines"></div><div class="sheet-lines short"></div><div class="sheet-lines"></div></div><span class="star">✧</span><div class="float-badge">✦ Vocabulary +1</div></div></section>
    <section class="stats-grid" aria-label="学習の概要">${statCard('見つかった単語',words.length,'語','book','purple')}${statCard('思考ブロック',thoughts,'件','brain','blue')}${statCard('習得済みの単語',masteryCount(words),'語','check','green')}${statCard('今日の復習候補',due.length,'語','clock','orange')}</section>
    <section class="dashboard-grid"><div class="panel"><div class="panel-heading"><div><h3>よく登場する単語</h3><p>思考ログ内の出現回数を集計</p></div><button class="text-link" data-nav="words">すべて見る ${icon('chevron')}</button></div>${top.length?`<div class="bars">${top.map(row=>`<div class="bar-row"><span class="bar-name">${esc(row.word)}</span><span class="bar-track"><span class="bar-fill" style="display:block;width:${Math.max(3,row.count/max*100).toFixed(1)}%"></span></span><span class="bar-count">${nfmt(row.count)}</span></div>`).join('')}</div>`:emptyBlock('データがありません','思考ログを追加すると集計が表示されます。','chart',null)}</div>
    <div class="panel"><div class="panel-heading"><div><h3>今日の一単語</h3><p>頻出語から少しずつ覚えましょう</p></div><span class="word-bubble">DAILY PICK</span></div>${first?`<div class="study-mini"><span class="mini-caption">VOCABULARY #${String(words.indexOf(first)+1).padStart(3,'0')}</span><span class="mini-pill">${nfmt(first.count)} 回登場</span><h4>${esc(first.word)}</h4><p class="jp-meaning">${esc(state.learning[first.word]?.meaning || DICTIONARY[first.word]?.ja || '単語帳で意味を追加できます')}</p><span class="mini-art" aria-hidden="true">✳</span><button class="btn btn-primary btn-small" data-action="start-study">${icon('layers')} この単語を覚える</button></div>`:emptyBlock('単語を追加しましょう','サンプルを使って学習を始められます。','spark','load-demo','サンプルを試す')}</div></section>
    <div class="section-heading"><h3>頻出単語の一覧</h3><button class="text-link" data-nav="words">単語帳を開く ${icon('chevron')}</button></div>${words.length?wordsTable(words.slice(0,6)):emptyBlock('まだ単語がありません','まずはセッションのファイルを読み込んでください。','book','import-modal','ファイルを選ぶ')}
    <div class="footer-note">PRIVATE BY DESIGN • LEARNING AT YOUR OWN PACE</div>`;
}
function wordsPage() {
  let words=allWords();
  const sourceList=['all',...new Set(state.sessions.map(s=>s.source))];
  const total=words.length;
  if(ui.query.trim()) { const q=ui.query.toLowerCase().trim(); words=words.filter(w=>w.word.includes(q)||((state.learning[w.word]?.meaning||DICTIONARY[w.word]?.ja||'').toLowerCase().includes(q))); }
  if(ui.filter!=='all')words=words.filter(w=>learningStatus(state,w.word)===ui.filter);
  if(ui.sort==='alpha')words.sort((a,b)=>a.word.localeCompare(b.word));
  else if(ui.sort==='rare')words.sort((a,b)=>a.count-b.count||a.word.localeCompare(b.word));
  const shown=words.slice(0,ui.limit);
  return `${pageHeader('MY VOCABULARY','あなたの単語帳',`思考ログから見つかった ${nfmt(total)} 語を、自分のペースで覚えましょう。`,`<button class="btn btn-outline btn-small" data-action="csv-export">${icon('download')} 一覧を書き出す</button>`)}${demoNotice()}
    <div class="filterbar"><label class="search-box">${icon('search')}<input id="word-search" type="search" placeholder="単語や意味を検索" value="${esc(ui.query)}" autocomplete="off" aria-label="単語検索"></label><select class="select" id="source-select" aria-label="対象ハーネス">${sourceList.map(src=>`<option value="${esc(src)}" ${ui.source===src?'selected':''}>${src==='all'?'すべてのハーネス':esc(src)}</option>`).join('')}</select><select class="select" id="sort-select" aria-label="並び順"><option value="frequency" ${ui.sort==='frequency'?'selected':''}>頻度が多い順</option><option value="rare" ${ui.sort==='rare'?'selected':''}>頻度が少ない順</option><option value="alpha" ${ui.sort==='alpha'?'selected':''}>アルファベット順</option></select></div>
    <div class="filterbar"><div class="segments" role="group" aria-label="学習状況">${[['all','すべて'],['new','未学習'],['learning','学習中'],['mastered','習得済み']].map(([key,label])=>`<button data-action="filter" data-filter="${key}" class="${ui.filter===key?'active':''}">${label}</button>`).join('')}</div><span class="inline-note">${nfmt(words.length)} 語を表示</span></div>
    ${wordsTable(shown)}${shown.length<words.length?`<div class="pagination"><span>${shown.length} / ${words.length} 語</span><button class="btn btn-outline btn-small" data-action="more-words">もっと見る ${icon('chevron')}</button></div>`:''}`;
}
function buildStudyDeck(all = false, firstWord = null) {
  const words=allWords();
  let candidates=all ? words : dueWords(words);
  if(firstWord) candidates=[...candidates.filter(w=>w.word===firstWord),...candidates.filter(w=>w.word!==firstWord)];
  ui.studyDeck=candidates.slice(0,all?100:20).map(row=>row.word);
  ui.studyIndex=0;ui.revealed=false;ui.showAll=all;
}
function studyPage() {
  if (!ui.studyDeck.length && !ui.showAll && ui.studyIndex===0) buildStudyDeck();
  const words=allWords();const totalDue=dueWords(words).length;
  const word=ui.studyDeck[ui.studyIndex];
  const row=word?words.find(w=>w.word===word):null;
  const meaning=word?(state.learning[word]?.meaning || DICTIONARY[word]?.ja || '意味は未登録です。単語帳から登録できます。'):'';
  const done=ui.studyIndex >= ui.studyDeck.length;
  return `${pageHeader('SMART REVIEW','フラッシュカード','英単語を見て意味を思い出し、答え合わせをしましょう。')}${demoNotice()}
  <div class="study-layout"><div class="study-card">${word&&!done?`<div class="study-progress"><span>復習セッション</span><span>${ui.studyIndex+1} / ${ui.studyDeck.length}</span></div><div class="progress-track"><div class="progress-fill" style="width:${((ui.studyIndex)/ui.studyDeck.length*100).toFixed(1)}%"></div></div><div class="card-kind">WORD • ${nfmt(row?.count||0)} APPEARANCES</div><div class="study-word">${esc(word)}</div><div class="study-hint">${ui.revealed?'意味と実際の使用例':'この単語の意味を思い出してみましょう'}</div><div class="study-reveal">${ui.revealed?`<div class="study-meaning">${esc(meaning)}</div>${row?.examples?.length?`<p class="study-example">“${esc(row.examples[0])}”</p>`:''}`:`<div class="study-hint">${icon('eye')} &nbsp; 答えを見る準備はできましたか？</div>`}</div><div class="study-buttons">${ui.revealed?`<button class="btn btn-outline" data-action="study-grade" data-grade="again">${icon('refresh')} もう一度 <span class="keycap">1</span></button><button class="btn btn-primary" data-action="study-grade" data-grade="yes">${icon('check')} 覚えた <span class="keycap">2</span></button>`:`<button class="btn btn-primary" data-action="study-reveal">${icon('eye')} 答えを見る <span class="keycap">Space</span></button>`}</div>`:`<div style="margin:auto;position:relative;z-index:1"><div class="empty-icon">${icon('star')}</div><h2>${words.length?'今日の復習はおしまいです！':'学習する単語がありません'}</h2><p class="study-tip">${words.length?'お疲れさまでした。ほかの単語も自由に復習できます。':'セッションを読み込んで単語を追加しましょう。'}</p><button class="btn btn-primary mt16" data-action="${words.length?'study-all':'import-modal'}">${words.length?'すべての単語から復習':'ログを追加する'}</button></div>`}</div>
  <aside class="study-side"><div class="panel"><div class="panel-heading"><h3>学習の記録</h3>${icon('chart')}</div><div class="summary-list"><div class="summary-line"><span>今回のカード</span><strong>${ui.studyDeck.length} 語</strong></div><div class="summary-line"><span>完了したカード</span><strong>${Math.min(ui.studyIndex,ui.studyDeck.length)} 語</strong></div><div class="summary-line"><span>復習待ち</span><strong>${totalDue} 語</strong></div><div class="summary-line"><span>習得済み</span><strong>${masteryCount(words)} 語</strong></div></div><div class="mt24"><button class="btn btn-soft btn-small full" data-action="study-restart">${icon('refresh')} 復習を最初から</button></div></div>
  <div class="panel"><div class="panel-heading"><h3>学習のヒント</h3>${icon('spark')}</div><p class="study-tip">出現頻度が高い単語から優先的に出題します。<br><br>「<strong>覚えた</strong>」を選ぶと復習間隔が少しずつ長くなります。「<strong>もう一度</strong>」は10分後が復習の目安です。</p><div class="mt16"><span class="keycap">Space</span> <span class="inline-note">答えを見る</span><br><span class="keycap">1</span> <span class="keycap">2</span> <span class="inline-note">復習結果を記録</span></div></div></aside></div>`;
}
function sessionsPage() {
  const sessions=state.sessions;
  return `${pageHeader('YOUR SOURCES','セッション管理','読み込んだログの一覧と集計結果を確認できます。',`<button class="btn btn-primary btn-small" data-action="import-modal">${icon('plus')} ログを追加</button>`)}${demoNotice()}
    <div class="panel" style="margin-bottom:20px"><div class="panel-heading"><div><h3>新しいログを読み込む</h3><p>複数のファイルやフォルダーをまとめて選択できます</p></div></div>${importZone()}<div class="helper-list"><span class="helper-chip">Codex</span><span class="helper-chip">Claude Code</span><span class="helper-chip">Gemini CLI</span><span class="helper-chip">OpenCode</span><span class="helper-chip">JSON / JSONL / TXT / MD</span></div></div>
    <div class="section-heading"><h3>読み込み済みのセッション <span class="inline-note">(${sessions.length} 件)</span></h3></div><div class="stack">${sessions.length?sessions.map(s=>`<div class="session-row"><div class="session-left"><span class="source-avatar ${sourceClass(s.source)}">${esc(sourceIcon(s.source))}</span><div><div class="session-name" title="${esc(s.name)}">${esc(s.name)}</div><div class="session-meta">${esc(s.source)} · ${dateText(s.importedAt)} ${s.demo?'· サンプル':''}</div></div></div><div class="session-right"><div class="session-number">${nfmt(s.uniqueWords)} 語<small>思考 ${nfmt(s.thoughtsCount)} ブロック</small></div><button class="btn-icon" data-action="delete-session" data-id="${esc(s.id)}" aria-label="${esc(s.name)}を削除" title="削除">${icon('trash')}</button></div></div>`).join(''):emptyBlock('まだセッションがありません','ログを読み込むと、ここに一覧が表示されます。','folder',null)}</div>`;
}
function importZone() { return `<div class="import-zone" data-dropzone><div class="drop-symbol">${icon('upload')}</div><h4>ここにファイルをドラッグ＆ドロップ</h4><p>セッションの思考部分だけを取り出して集計します</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary btn-small" data-action="pick-files">${icon('file')} ファイルを選択</button><button class="btn btn-outline btn-small" data-action="pick-folder">${icon('folder')} フォルダーを選択</button></div></div>`; }
function settingsPage() {
  const count=state.sessions.length,words=allWords().length;
  return `${pageHeader('PREFERENCES','設定とデータ','学習データの書き出し、読み込み、削除を管理します。')}
  <div class="settings-grid"><section class="panel"><div class="panel-heading"><h3>データの管理</h3>${icon('download')}</div><div class="settings-row"><div><div class="settings-label">学習データのバックアップ</div><div class="settings-help">セッションの集計結果と復習履歴を保存</div></div><button class="btn btn-outline btn-small" data-action="json-export">保存</button></div><div class="settings-row"><div><div class="settings-label">バックアップの復元</div><div class="settings-help">以前保存したファイルから復元</div></div><button class="btn btn-outline btn-small" data-action="restore-pick">選択</button></div><div class="settings-row"><div><div class="settings-label">単語帳を書き出す</div><div class="settings-help">表計算ソフトで開ける形式</div></div><button class="btn btn-outline btn-small" data-action="csv-export">保存</button></div></section>
  <section class="panel"><div class="panel-heading"><h3>プライバシー</h3>${icon('shield')}</div><p class="study-tip">セッションファイルはこのブラウザの中で解析します。外部サービスへの送信やサーバーへの保存は行いません。</p><p class="study-tip">読み込み後は、単語の集計・短い使用例・学習履歴だけをブラウザ内に保存します。使用例に機密情報が残る可能性があるため、共有する端末ではご注意ください。</p><div class="summary-list"><div class="summary-line"><span>保存中のセッション</span><strong>${count} 件</strong></div><div class="summary-line"><span>集計済みの単語</span><strong>${words} 語</strong></div></div></section>
  <section class="panel danger-panel"><div class="panel-heading"><h3>データをリセット</h3>${icon('trash')}</div><p class="study-tip">登録済みのセッションと学習履歴をすべて削除します。元には戻せません。</p><button class="btn btn-danger btn-small" data-action="clear-all">${icon('trash')} すべて削除</button></section>
  <section class="panel"><div class="panel-heading"><h3>対応形式について</h3>${icon('info')}</div><p class="study-tip">Codex の推論要約、Claude Code の thinking、Gemini CLI の思考要約、OpenCode の reasoning など、ファイルに記録された文字列を集計します。</p><p class="study-tip">暗号化された思考内容や、ファイルに保存されていない思考は読み取れません。TXT・MD はファイル全体を思考本文として扱います。</p><button class="btn btn-soft btn-small" data-action="load-demo">${icon('spark')} サンプルを表示</button></section></div>
  <input type="file" id="restore-input" accept=".json" hidden />`;
}
function render() {
  const page=ui.page;
  const titles={dashboard:'ダッシュボード',words:'単語帳',study:'フラッシュカード',sessions:'セッション',settings:'設定とデータ'};
  document.getElementById('breadcrumb-current').textContent=titles[page];
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
  document.getElementById('nav-word-count').textContent=nfmt(allWords().length);
  main.innerHTML=({dashboard:dashboardPage,words:wordsPage,study:studyPage,sessions:sessionsPage,settings:settingsPage}[page])();
  document.querySelectorAll('[data-icon]').forEach(el=>{ el.innerHTML=icon(el.dataset.icon); });
  renderModal();
}
function navigate(page) {
  if(!['dashboard','words','study','sessions','settings'].includes(page))return;
  if(page==='study')buildStudyDeck();
  if(page==='words')ui.limit=20;
  ui.page=page;location.hash=page;
  document.getElementById('sidebar').classList.remove('open');document.getElementById('mobile-overlay')?.classList.remove('show');
  render();scrollTo({top:0,behavior:'smooth'});
}
function meaningOf(word) { return state.learning[word]?.meaning || DICTIONARY[word]?.ja || ''; }
function highlightExample(text, word) {
  const safe=esc(text);
  const regex=new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:s|ed|ing)?)\\b`,'gi');
  return safe.replace(regex,'<mark>$1</mark>');
}
function renderModal() {
  if(!ui.modal){modalRoot.innerHTML='';return;}
  let body='';
  if(ui.modal==='import') {
    body=`<div class="modal-header"><h2>思考ログを読み込む</h2><button class="modal-close" data-action="close-modal" aria-label="閉じる">${icon('close')}</button></div><p class="modal-copy">Codex、Claude Code、Gemini CLI、OpenCode などのセッションファイルを選択してください。<br>解析はブラウザの中で行われます。</p>${importZone()}<p class="note mt16">※ ファイルに平文の思考や要約が含まれている場合のみ抽出します。思考が記録されていないファイルは取り込みません。</p>`;
  } else if(ui.modal==='word') {
    const row=allWords().find(w=>w.word===ui.selectedWord); if(!row){ui.modal=null;modalRoot.innerHTML='';return;}
    const word=row.word,status=learningStatus(state,word),custom=state.learning[word]?.meaning ?? '';
    body=`<div class="modal-header"><div><div class="page-eyebrow">VOCABULARY DETAIL</div><h2 style="font-size:28px">${esc(word)}</h2></div><button class="modal-close" data-action="close-modal" aria-label="閉じる">${icon('close')}</button></div><div class="detail-count"><div class="detail-stat"><strong>${nfmt(row.count)}</strong><span>出現回数</span></div><div class="detail-stat"><strong>${nfmt(row.sessionCount)}</strong><span>登場したセッション</span></div><div class="detail-stat"><strong>${statusText[status]}</strong><span>学習状況</span></div></div><label class="field-label" for="meaning-edit">日本語の意味 ${DICTIONARY[word]?'（初期登録あり）':''}</label><input class="field-input" id="meaning-edit" placeholder="自分なりの訳を書いてください" value="${esc(custom||DICTIONARY[word]?.ja||'')}" maxlength="160"><div class="section-heading"><h3>実際の使用例</h3></div>${row.examples.length?row.examples.map(x=>`<div class="quote">${highlightExample(x,word)}</div>`).join(''):'<p class="note">この単語の使用例は保存されていません。</p>'}<div class="section-heading"><h3>登場したセッション</h3></div><div class="summary-list">${row.sessions.slice(0,10).map(s=>`<div class="summary-line"><span>${esc(s.name)}</span><strong>${nfmt(s.count)} 回</strong></div>`).join('')}</div><div class="modal-actions"><button class="btn btn-outline btn-small" data-action="save-meaning">${icon('check')} 意味を保存</button><button class="btn ${status==='mastered'?'btn-outline':'btn-primary'} btn-small" data-action="toggle-mastered">${icon(status==='mastered'?'refresh':'star')} ${status==='mastered'?'学習中に戻す':'習得済みにする'}</button></div>`;
  } else if(ui.modal==='clear') {
    body=`<div class="modal-header"><h2>すべて削除しますか？</h2><button class="modal-close" data-action="close-modal" aria-label="閉じる">${icon('close')}</button></div><p class="modal-copy">セッションと学習履歴をすべて削除します。この操作は元に戻せません。必要なら先にバックアップしてください。</p><div class="modal-actions"><button class="btn btn-outline" data-action="close-modal">キャンセル</button><button class="btn btn-danger" data-action="confirm-clear">すべて削除する</button></div>`;
  } else if(ui.modal==='delete') {
    const s=state.sessions.find(x=>x.id===ui.selectedSession);
    body=`<div class="modal-header"><h2>セッションを削除</h2><button class="modal-close" data-action="close-modal" aria-label="閉じる">${icon('close')}</button></div><p class="modal-copy">「${esc(s?.name||'このセッション')}」の集計データを削除します。ほかのセッションや学習履歴は残ります。</p><div class="modal-actions"><button class="btn btn-outline" data-action="close-modal">キャンセル</button><button class="btn btn-danger" data-action="confirm-delete">削除する</button></div>`;
  }
  modalRoot.innerHTML=`<div class="modal-backdrop" data-backdrop><div class="modal" role="dialog" aria-modal="true" aria-label="${ui.modal==='word'?'単語の詳細':'操作'}">${body}</div></div>`;
}
function downloadFile(filename, content, mime) {
  const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function exportCsv() {
  const head=['word','meaning','frequency','status','sessions'];
  const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const rows=allWords().map(w=>[w.word,meaningOf(w.word),w.count,learningStatus(state,w.word),w.sessionCount]);
  downloadFile('learnthinking-words.csv','\ufeff'+[head,...rows].map(line=>line.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('単語帳を書き出しました。');
}
async function importFiles(files) {
  const accepted=Array.from(files).filter(f=>/\.(jsonl|json|txt|md|markdown)$/i.test(f.name));
  if(!accepted.length){toast('対応するファイル（JSON、JSONL、TXT、MD）が見つかりません。');return;}
  let imported=0,skipped=0;const errors=[];
  for(const file of accepted){
    try {
      if(file.size>35*1024*1024){errors.push(`${file.name}: 35MBを超えています`);continue;}
      const raw=await file.text(),id=fingerprint(raw);
      if(state.sessions.some(s=>s.id===id)){skipped++;continue;}
      const parsed=parseSessionText(raw,file.name);
      if(!parsed.thoughts.length){errors.push(`${file.name}: 読み取り可能な思考本文がありません`);continue;}
      const analysis=analyzeThoughts(parsed.thoughts);
      if(!analysis.uniqueWords){errors.push(`${file.name}: 集計対象の英単語がありません`);continue;}
      if(isDemo()){state=EMPTY_STATE();}
      state.sessions.push({ id, name:file.webkitRelativePath||file.name, source:parsed.source, importedAt:new Date().toISOString(), thoughtsCount:parsed.thoughts.length, demo:false, ...analysis });
      imported++;
    } catch(err){errors.push(`${file.name}: ${err.message||'読み込みエラー'}`);}
  }
  if(imported){persist();ui.modal=null;ui.source='all';ui.studyDeck=[];render();}
  const parts=[];if(imported)parts.push(`${imported} 件のセッションを追加しました`);if(skipped)parts.push(`${skipped} 件は重複のためスキップ`);if(errors.length)parts.push(`${errors.length} 件を読み込めませんでした`);
  if(parts.length)toast(parts.join(' / '));
  if(errors.length){ui.importInfo=errors;showImportErrors(errors);}
}
function showImportErrors(errors){
  // Visible details without transmitting or persisting rejected file contents.
  const summary=errors.slice(0,8).map(e=>`• ${e}`).join('\n');
  if(errors.length) {console.warn('LearnThinking import notes:',summary); if(!state.sessions.length)toast(errors[0]);}
}
async function restoreBackup(file){
  if(!file)return;
  try {
    if(file.size>15*1024*1024)throw new Error('15MB以内のバックアップを選んでください。');
    const data=JSON.parse(await file.text());
    if(data.version!==1||!Array.isArray(data.sessions))throw new Error('LearnThinkingのバックアップ形式を確認できませんでした。');
    state=sanitizeState(data);persist();ui.source='all';render();toast('バックアップを復元しました。');
  }catch(e){toast(e.message||'バックアップを読み込めませんでした。');}
}
function setWordStatus(word,mastered){const previous=state.learning[word]||{};state.learning[word]={...previous,status:mastered?'mastered':'learning',interval:mastered?7:0,dueAt:new Date(Date.now()+(mastered?7*86400000:0)).toISOString(),correct:previous.correct||0,incorrect:previous.incorrect||0};}
function clickAction(button){
  const action=button.dataset.action;
  switch(action){
    case 'import-modal':ui.modal='import';renderModal();break;
    case 'close-modal':ui.modal=null;renderModal();break;
    case 'pick-files':document.getElementById('file-input').click();break;
    case 'pick-folder':document.getElementById('folder-input').click();break;
    case 'load-demo':state=demoState();ui.source='all';ui.modal=null;saveAndRender();toast('サンプルデータを読み込みました。');break;
    case 'word-detail':ui.selectedWord=button.dataset.word;ui.modal='word';renderModal();break;
    case 'save-meaning':{
      const word=ui.selectedWord,meaning=document.getElementById('meaning-edit')?.value.trim()||'';
      state.learning[word]={...(state.learning[word]||{}),meaning};persist();ui.modal=null;render();toast('意味を保存しました。');break;
    }
    case 'toggle-mastered':{
      const word=ui.selectedWord;
      const meaning=document.getElementById('meaning-edit')?.value.trim()||'';
      setWordStatus(word,learningStatus(state,word)!=='mastered');state.learning[word].meaning=meaning;
      ui.modal=null;saveAndRender();toast('学習状況を更新しました。');break;
    }
    case 'filter':ui.filter=button.dataset.filter;ui.limit=20;render();break;
    case 'more-words':ui.limit+=30;render();break;
    case 'start-study':ui.page='study';buildStudyDeck(false,allWords().find(w=>learningStatus(state,w.word)==='new')?.word);location.hash='study';render();break;
    case 'study-reveal':ui.revealed=true;render();break;
    case 'study-grade':{
      const word=ui.studyDeck[ui.studyIndex];if(!word||!ui.revealed)break;
      reviewWord(state,word,button.dataset.grade==='yes');ui.studyIndex++;ui.revealed=false;saveAndRender();break;
    }
    case 'study-all':buildStudyDeck(true);render();break;
    case 'study-restart':buildStudyDeck();render();break;
    case 'delete-session':ui.selectedSession=button.dataset.id;ui.modal='delete';renderModal();break;
    case 'confirm-delete':state.sessions=state.sessions.filter(s=>s.id!==ui.selectedSession);ui.modal=null;ui.source='all';saveAndRender();toast('セッションを削除しました。');break;
    case 'clear-all':ui.modal='clear';renderModal();break;
    case 'confirm-clear':state=EMPTY_STATE();ui.modal=null;ui.source='all';ui.studyDeck=[];saveAndRender();toast('すべてのデータを削除しました。');break;
    case 'csv-export':exportCsv();break;
    case 'json-export':downloadFile('learnthinking-backup.json',JSON.stringify(state,null,2),'application/json');toast('バックアップを書き出しました。');break;
    case 'restore-pick':document.getElementById('restore-input')?.click();break;
  }
}
// Event delegation keeps dynamic pages interactive without inserting untrusted HTML.
document.addEventListener('click',event=>{
  const nav=event.target.closest('[data-nav]');
  if(nav){navigate(nav.dataset.nav);return;}
  const button=event.target.closest('[data-action]');
  if(button){clickAction(button);return;}
  if(event.target.matches('[data-backdrop]')){ui.modal=null;renderModal();}
});
document.addEventListener('input',event=>{
  if(event.target.id==='word-search'){
    const pos=event.target.selectionStart;ui.query=event.target.value;ui.limit=20;render();
    const next=document.getElementById('word-search');next.focus();try{next.setSelectionRange(pos,pos);}catch{}
  }
});
document.addEventListener('change',event=>{
  if(event.target.id==='source-select'){ui.source=event.target.value;ui.studyDeck=[];render();}
  if(event.target.id==='sort-select'){ui.sort=event.target.value;render();}
  if(event.target.id==='restore-input'){restoreBackup(event.target.files[0]);event.target.value='';}
});
for(const [id] of [['file-input'],['folder-input']]){
  document.getElementById(id).addEventListener('change',event=>{importFiles(event.target.files);event.target.value='';});
}
document.addEventListener('dragover',event=>{if(event.target.closest('[data-dropzone]')){event.preventDefault();event.target.closest('[data-dropzone]').classList.add('dragging');}});
document.addEventListener('dragleave',event=>{if(event.target.closest('[data-dropzone]'))event.target.closest('[data-dropzone]').classList.remove('dragging');});
document.addEventListener('drop',event=>{const zone=event.target.closest('[data-dropzone]');if(zone){event.preventDefault();zone.classList.remove('dragging');importFiles(event.dataTransfer.files);}});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&ui.modal){ui.modal=null;renderModal();return;}
  if(ui.page!=='study'||ui.modal||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  if((event.code==='Space'||event.key===' ')&&!ui.revealed){event.preventDefault();clickAction({dataset:{action:'study-reveal'}});}
  if(ui.revealed&&(event.key==='1'||event.key==='2'))clickAction({dataset:{action:'study-grade',grade:event.key==='1'?'again':'yes'}});
});
document.getElementById('top-import').addEventListener('click',()=>{ui.modal='import';renderModal();});
document.getElementById('mobile-menu').addEventListener('click',()=>{
  document.getElementById('sidebar').classList.toggle('open');document.getElementById('mobile-overlay').classList.toggle('show');
});
const overlay=document.createElement('div');overlay.id='mobile-overlay';overlay.className='mobile-overlay';overlay.addEventListener('click',()=>{document.getElementById('sidebar').classList.remove('open');overlay.classList.remove('show');});document.body.append(overlay);
window.addEventListener('hashchange',()=>{const hash=location.hash.slice(1);if(hash!==ui.page&&['dashboard','words','study','sessions','settings'].includes(hash))navigate(hash);});
const initialHash=location.hash.slice(1);if(['dashboard','words','study','sessions','settings'].includes(initialHash))ui.page=initialHash;
render();
