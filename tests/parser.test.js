import test from 'node:test';
import assert from 'node:assert/strict';
import { extractThoughts, parseSessionText, analyzeThoughts, tokenize, fingerprint } from '../src/parser.js';

test('Claude Code: thinking only, excluding final answer and tool result', () => {
  const rows=[
    {type:'user',message:{content:'Verify the behavior please'}},
    {type:'assistant',message:{role:'assistant',content:[{type:'thinking',thinking:'We should verify the existing behavior and inspect the context.'},{type:'text',text:'The result has been verified.'}]}},
    {type:'tool',message:{content:[{type:'thinking',thinking:'A tool should not count.'}]}}
  ];
  const out=extractThoughts(rows);
  assert.equal(out.source,'Claude Code');assert.equal(out.thoughts.length,1);assert.match(out.thoughts[0],/existing behavior/);
});

test('Codex: response reasoning summary and reasoning event only', () => {
  const rows=[
    {type:'session_meta',payload:{base_instructions:'Do not parse user content'}},
    {type:'response_item',payload:{type:'reasoning',summary:[{type:'summary_text',text:'Determine the reliable approach and validate the result.'}]}},
    {type:'response_item',payload:{type:'message',role:'assistant',content:[{type:'output_text',text:'The response is final.'}]}},
    {type:'event_msg',payload:{type:'agent_reasoning',text:'Consider the additional constraint.'}},
    {type:'event_msg',payload:{type:'user_message',message:'A separate instruction'}}
  ];
  const out=parseSessionText(rows.map(x=>JSON.stringify(x)).join('\n'),'rollout.jsonl');
  assert.equal(out.source,'Codex');assert.equal(out.thoughts.length,2);assert.ok(!out.thoughts.join(' ').includes('final'));
});

test('Gemini: thoughts only, not main content', () => {
  const data={sessionId:'abc',messages:[{type:'user',content:'A question'},{type:'gemini',content:'A public answer',thoughts:[{subject:'Plan',description:'Inspect the input and compare approaches.'}]}]};
  const out=parseSessionText(JSON.stringify(data),'session.json');
  assert.equal(out.source,'Gemini CLI');assert.deepEqual(out.thoughts,['Inspect the input and compare approaches.']);
});

test('OpenCode: reasoning part, no ordinary message text', () => {
  const data=[{type:'part',part:{type:'reasoning',text:'Analyze the potential issue and resolve it.'}},{type:'part',part:{type:'text',text:'The visible final response.'}}];
  const out=extractThoughts(data);assert.equal(out.source,'OpenCode');assert.deepEqual(out.thoughts,['Analyze the potential issue and resolve it.']);
});

test('encrypted reasoning cannot be extracted', () => {
  const out=extractThoughts([{type:'response_item',payload:{type:'reasoning',encrypted_content:'hidden'}}]);
  assert.deepEqual(out.thoughts,[]);
});

test('rejects malformed JSONL and empty content', () => {
  assert.throws(()=>parseSessionText('{"type":"thinking","text":"fine"}\nBAD','bad.jsonl'));
  assert.throws(()=>parseSessionText('','empty.txt'));
});

test('accepts plain text explicitly and deduplicates repeated blocks', () => {
  assert.equal(parseSessionText('An appropriate approach to verify.','notes.md').thoughts.length,1);
  assert.equal(extractThoughts([{type:'thinking',text:'Check it.'},{type:'thinking',text:'Check it.'}]).thoughts.length,1);
});

test('English tokens, noise filtering and morphology', () => {
  const tokens=tokenize('Verifying the existing behaviors in `user_id` https://example.com with a reliable approach.');
  assert.ok(tokens.includes('existing'));assert.ok(tokens.includes('reliable'));assert.ok(tokens.includes('approach'));
  assert.ok(!tokens.includes('https'));assert.ok(!tokens.includes('the'));
});

test('counts repeated vocabulary and limits examples', () => {
  const out=analyzeThoughts(['Verify the input. Verify the output. Verify the existing behavior.']);
  assert.equal(out.counts.verify,3);assert.equal(out.examples.verify.length,2);
});

test('stable fingerprints', () => { assert.equal(fingerprint('alpha'),fingerprint('alpha'));assert.notEqual(fingerprint('alpha'),fingerprint('beta')); });
