const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../bck-games.js');
test('nine games, five languages and bounded geometry',()=>{
  assert.equal(Object.keys(G.games).length,9);
  for(const lang of Object.keys(G.languages))for(const g of Object.values(G.games))assert.notEqual(G.translate(g.instruction,lang),g.instruction);
  assert.deepEqual(G.overlap(30,100,60,100),{x:60,width:70});
  assert.deepEqual(G.overlap(0,10,20,10),{x:20,width:0});
  assert.equal(G.angleDistance(359,1),2);
  assert.equal(G.clamp(120,0,100),100);
  assert.equal(G.clamp(-1,0,100),0);
  assert.equal(G.chooseGame(['a','b'],{a:0,b:100},()=>0),'b');
  assert.equal(G.chooseGame(['a','b'],{},()=>.8),'b');
});
