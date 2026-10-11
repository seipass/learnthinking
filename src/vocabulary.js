/** Small, editable offline glossary. Unknown words can be given custom meanings. */
const ENTRIES = [
  ['approach','取り組み方・方法','名詞'],['analyze','分析する','動詞'],['analysis','分析','名詞'],
  ['verify','確かめる・検証する','動詞'],['ensure','確実にする','動詞'],['consider','検討する','動詞'],
  ['identify','特定する','動詞'],['resolve','解決する','動詞'],['implement','実装する','動詞'],
  ['implementation','実装','名詞'],['existing','既存の','形容詞'],['potential','潜在的な・可能性のある','形容詞'],
  ['requirement','要件','名詞'],['behavior','動作・振る舞い','名詞'],['relevant','関連する','形容詞'],
  ['determine','判断する・決定する','動詞'],['context','文脈・背景','名詞'],['clarify','明確にする','動詞'],
  ['validate','妥当性を確認する','動詞'],['assumption','前提・仮定','名詞'],['issue','問題・論点','名詞'],
  ['handle','対処する','動詞'],['response','応答','名詞'],['source','情報源・出所','名詞'],
  ['request','要求・依頼','名詞'],['inspect','詳しく調べる','動詞'],['format','形式','名詞'],
  ['extract','抽出する','動詞'],['parse','解析する','動詞'],['confirm','確認する','動詞'],
  ['consistent','一貫した','形容詞'],['necessary','必要な','形容詞'],['infer','推測する','動詞'],
  ['detect','検出する','動詞'],['preserve','保持する','動詞'],['avoid','避ける','動詞'],
  ['obtain','得る','動詞'],['check','調べる・確認する','動詞'],['reproduce','再現する','動詞'],
  ['compare','比較する','動詞'],['evaluate','評価する','動詞'],['prefer','優先する・好む','動詞'],
  ['reliable','信頼できる','形容詞'],['possible','可能な','形容詞'],['update','更新する','動詞'],
  ['support','支援する・対応する','動詞'],['structure','構造','名詞'],['available','利用できる','形容詞'],
  ['specific','具体的な・特定の','形容詞'],['appropriate','適切な','形容詞'],['function','機能・関数','名詞'],
  ['output','出力','名詞'],['input','入力','名詞'],['dependency','依存関係','名詞'],
  ['missing','欠けている','形容詞'],['fallback','代替手段','名詞'],['pattern','型・傾向','名詞'],
  ['internal','内部の','形容詞'],['external','外部の','形容詞'],['candidate','候補','名詞'],
  ['evidence','根拠・証拠','名詞'],['construct','組み立てる','動詞'],['proceed','進める','動詞'],
  ['reasoning','推論・思考過程','名詞'],['indicate','示す','動詞'],['interaction','やり取り','名詞'],
  ['improve','改善する','動詞'],['attempt','試みる','動詞'],['likely','可能性が高い','形容詞'],
  ['certain','確かな','形容詞'],['result','結果','名詞'],['discrepancy','食い違い','名詞'],
  ['component','構成要素','名詞'],['document','文書','名詞'],['entire','全体の','形容詞'],
  ['summary','要約','名詞'],['intention','意図','名詞'],['strategy','戦略','名詞'],
  ['isolate','切り分ける','動詞'],['boundary','境界','名詞'],['error','誤り・エラー','名詞'],
  ['safe','安全な','形容詞'],['repeated','繰り返された','形容詞'],['frequency','頻度','名詞'],
  ['ambiguous','曖昧な','形容詞'],['explicit','明示的な','形容詞'],['implicit','暗黙の','形容詞'],
  ['incremental','段階的な','形容詞'],['constraint','制約','名詞'],['robust','堅牢な','形容詞'],
  ['focus','集中する・焦点','動詞・名詞'],['target','対象・目標','名詞'],['confidence','確信・信頼度','名詞'],
  ['efficient','効率的な','形容詞'],['lightweight','軽量な','形容詞'],['practical','実用的な','形容詞'],
  ['additional','追加の','形容詞'],['multiple','複数の','形容詞'],['maintain','維持する','動詞'],
  ['retrieve','取得する','動詞'],['apply','適用する','動詞'],['test','検証する・試験','動詞・名詞'],
  ['display','表示する','動詞'],['workflow','作業の流れ','名詞'],['modify','修正する','動詞'],
  ['generate','生成する','動詞'],['complex','複雑な','形容詞'],['accurate','正確な','形容詞'],
  ['understand','理解する','動詞'],['investigate','調査する','動詞'],['decide','決める','動詞'],
  ['review','見直す・確認する','動詞'],['return','返す','動詞'],['expect','予期する','動詞'],
  ['include','含める','動詞'],['exclude','除外する','動詞'],['assess','評価する','動詞'],
  ['derive','導き出す','動詞'],['observe','観察する','動詞'],['distinguish','区別する','動詞'],
  ['reference','参照・参考','名詞'],['definition','定義','名詞'],['scenario','想定場面','名詞'],
  ['edge','端・境界','名詞'],['case','事例・場合','名詞'],['failure','失敗・障害','名詞'],
  ['success','成功','名詞'],['priority','優先度','名詞'],['option','選択肢','名詞'],
  ['solution','解決策','名詞'],['alternative','代案','名詞'],['detail','詳細','名詞'],
  ['step','手順・段階','名詞'],['sequence','順序','名詞'],['process','処理・過程','名詞'],
  ['method','方法','名詞'],['reason','理由・推論する','名詞・動詞'],['suggest','提案する','動詞'],
  ['explain','説明する','動詞'],['describe','説明する・描写する','動詞'],['assume','仮定する','動詞'],
  ['match','一致する','動詞'],['correct','正しい・修正する','形容詞・動詞'],['incorrect','誤った','形容詞'],
  ['simple','単純な','形容詞'],['direct','直接的な','形容詞'],['initial','最初の','形容詞'],
  ['final','最終の','形容詞'],['previous','前の','形容詞'],['current','現在の','形容詞'],
  ['original','元の','形容詞'],['common','一般的な・共通の','形容詞'],['unique','固有の','形容詞'],
  ['separate','分ける・別の','動詞・形容詞'],['combine','結合する','動詞'],['collect','集める','動詞'],
  ['count','数える','動詞'],['filter','絞り込む','動詞'],['sort','並べ替える','動詞'],
  ['store','保存する','動詞'],['load','読み込む','動詞'],['remove','削除する','動詞'],
  ['select','選ぶ','動詞'],['change','変更する','動詞'],['create','作る','動詞'],
  ['provide','提供する','動詞'],['contain','含む','動詞'],['represent','表す','動詞'],
  ['require','必要とする','動詞'],['allow','許可する','動詞'],['prevent','防ぐ','動詞'],
  ['estimate','見積もる','動詞'],['reduce','減らす','動詞'],['increase','増やす','動詞'],
  ['expand','広げる','動詞'],['limit','制限する','動詞'],['default','初期設定・標準','名詞'],
  ['state','状態','名詞'],['data','データ','名詞'],['value','値・価値','名詞'],
  ['property','性質・属性','名詞'],['object','対象・物体','名詞'],['array','配列','名詞'],
  ['record','記録','名詞'],['session','作業記録','名詞'],['message','メッセージ','名詞'],
  ['token','単位・トークン','名詞'],['model','モデル','名詞'],['system','仕組み','名詞'],
  ['user','利用者','名詞'],['assistant','補助者','名詞'],['tool','道具','名詞'],
  ['text','文章','名詞'],['file','ファイル','名詞'],['path','経路・パス','名詞'],
  ['line','行','名詞'],['content','内容','名詞'],['feature','機能・特徴','名詞'],
  ['design','設計','名詞'],['performance','性能','名詞'],['security','安全性','名詞'],
  ['privacy','プライバシー','名詞'],['risk','リスク','名詞'],['tradeoff','両立しない条件の調整','名詞']
];
export const DICTIONARY = Object.fromEntries(ENTRIES.map(([word, ja, pos]) => [word, { ja, pos }]));

export const STOPWORDS = new Set(`a an the and or but so if then else as at by for from in into on onto of off out over under up down to with without within between through during before after above below against across around among about is are was were be been being am do does did doing done have has had having can could may might must shall should will would it its itself this that these those there here they them their theirs he him his she her hers we us our ours i me my mine you your yours who whom whose which what where when why how not no yes nor than too very more most less least much many few all any each every both either neither other another same such only own also just even still already yet again ever never always often sometimes usually perhaps maybe probably certainly therefore however although though because since while until unless whether once twice one two three four five six seven eight nine ten first second third last next now today tomorrow yesterday something anything everything nothing someone anyone everyone nobody some several enough quite really almost rather instead indeed actually basically generally simply mostly especially particularly somewhat well okay ok please thanks thank hello hi hey thing things stuff way ways get got getting make made making go goes going went gone come came coming take took taken taking give gave given giving let lets use using used seems seem seemed look looks looking see saw seen seeing know knew known knowing think thought thinking can't cannot won't don't doesn't didn't isn't aren't wasn't weren't i've i'd i'll we're they're you're it's that's there's here's let's hasn't haven't hadn't should've wouldn't couldn't i'm we'll you'll they'll via per etc eg ie vs n/a http https www com org net localhost` .split(/\s+/));

export const IRREGULAR = { went:'go', gone:'go', made:'make', taken:'take', found:'find', built:'build', written:'write', seen:'see', given:'give', kept:'keep', known:'know', chose:'choose', chosen:'choose', tried:'try', considered:'consider', identified:'identify', verified:'verify', clarified:'clarify', analyzed:'analyze', analysed:'analyze', implemented:'implement', resolved:'resolve', ensured:'ensure', handled:'handle', checked:'check', compared:'compare', evaluated:'evaluate', improved:'improve', extracted:'extract', detected:'detect', preserved:'preserve', applied:'apply', studies:'study', errors:'error', issues:'issue', assumptions:'assumption', requirements:'requirement', options:'option', solutions:'solution', patterns:'pattern', components:'component', constraints:'constraint', dependencies:'dependency', scenarios:'scenario', processes:'process', strategies:'strategy', methods:'method', changes:'change', values:'value', features:'feature', results:'result', summaries:'summary' };

export function normalizeWord(raw) {
  const word = raw.toLowerCase().replace(/['’]s$/, '').replace(/[’']/g,'');
  if (IRREGULAR[word]) return IRREGULAR[word];
  if (DICTIONARY[word]) return word;
  const candidates = [];
  if (word.endsWith('ies') && word.length > 5) candidates.push(word.slice(0,-3)+'y');
  if (word.endsWith('ing') && word.length > 6) { candidates.push(word.slice(0,-3), word.slice(0,-3)+'e'); }
  if (word.endsWith('ed') && word.length > 5) { candidates.push(word.slice(0,-2),word.slice(0,-1),word.slice(0,-3)); }
  if (word.endsWith('es') && word.length > 5) candidates.push(word.slice(0,-2),word.slice(0,-1));
  if (word.endsWith('s') && word.length > 4) candidates.push(word.slice(0,-1));
  return candidates.find(candidate => DICTIONARY[candidate]) || word;
}

export const DEMO_THOUGHTS = [
  'First, identify the requirement and consider the most reliable approach. We should verify the existing behavior before we implement the solution. The main issue is the ambiguous input format. A robust strategy will handle missing fields and preserve the original context.',
  'We need to analyze the structure and determine which data is relevant. Compare possible approaches, evaluate each assumption, and validate the result. This should ensure consistent behavior across multiple scenarios.',
  'Inspect the input carefully. Detect the pattern, extract the relevant fields, and avoid an incorrect assumption. A practical implementation should be reliable, efficient, and easy to maintain.',
  'Consider the potential edge case: the response may be missing or the format may change. We should verify the result, preserve the context, and provide an appropriate fallback.',
  'The initial approach is simple, but we need a robust solution. Identify the issue, clarify the requirement, compare the options, and implement the necessary update.',
  'Before making a change, analyze the existing behavior and verify the expected output. A consistent approach should handle the request and resolve the issue.',
  'Evaluate the possible solution with a specific test. The result should confirm the assumption. If there is a discrepancy, inspect the structure and improve the implementation.',
  'A reliable strategy is to avoid unnecessary complexity. Determine the relevant requirement, validate the input, and implement the appropriate solution.',
];
