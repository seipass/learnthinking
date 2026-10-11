import test from 'node:test';
import assert from 'node:assert/strict';
import { demoState, EMPTY_STATE, vocabularyFromSessions, reviewWord, isDue, sanitizeState } from '../src/store.js';

test('demo data is populated and tagged',()=>{const s=demoState();assert.ok(s.sessions[0].uniqueWords>5);assert.equal(s.sessions[0].demo,true);});
test('aggregate repeated words from multiple sessions',()=>{
  const sessions=[{name:'a',source:'Codex',counts:{verify:3,inspect:1},examples:{verify:['A verified line.']}},{name:'b',source:'Claude Code',counts:{verify:2},examples:{}}];
  const all=vocabularyFromSessions(sessions);
  assert.equal(all[0].count,5);assert.equal(all[0].sessionCount,2);
  assert.equal(vocabularyFromSessions(sessions,'Claude Code')[0].count,2);
});
test('review advances intervals and schedules unknown words sooner',()=>{
  const state=EMPTY_STATE(),now=Date.UTC(2026,9,11);
  reviewWord(state,'verify',true,now);assert.equal(state.learning.verify.interval,1);assert.equal(isDue(state.learning.verify,now),false);
  reviewWord(state,'verify',true,now);assert.equal(state.learning.verify.interval,3);
  reviewWord(state,'verify',true,now);assert.equal(state.learning.verify.status,'mastered');
  reviewWord(state,'verify',false,now);assert.equal(state.learning.verify.interval,0);assert.equal(state.learning.verify.status,'learning');
});
test('restored data ignores malformed vocabulary properties',()=>{
  const dirty={version:1,sessions:[{id:'a',counts:{verify:2,'<bad>':17},examples:{verify:['Valid text']}}],learning:{verify:{status:'mastered',meaning:'確かめる'},'<bad>':{status:'mastered'}}};
  const clean=sanitizeState(dirty);assert.equal(clean.sessions[0].counts.verify,2);assert.equal(clean.sessions[0].counts['<bad>'],undefined);assert.equal(clean.learning['<bad>'],undefined);
});
