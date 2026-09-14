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
test('difficulty presets stay bounded, fair and reward-reachable',()=>{
  assert.equal(G.skillGames.length,6);
  assert.equal(G.difficulty({difficulty:'rigged'}),'Standard');
  const levels=['Easy','Standard','Hard'];
  for(const difficulty of levels){
    const c={difficulty,duration:7},r=G.rules(c),b=G.board(c);
    assert.equal(b.size%6,0);
    assert.ok(r.pieces*r.pinGap<360,'Enough placement space for every piece');
    assert.equal(G.threshold('Pin the Bite',c,7),r.pieces,'Top tier remains reachable');
    assert.ok(G.threshold('Tap Speed',c,999)<=70,'Never requires more than 10 taps per second');
    const starts=[...Object.keys(b.ladders),...Object.keys(b.snakes)];
    assert.equal(new Set(starts).size,starts.length);
    for(const [a,z] of Object.entries(b.ladders)){assert.ok(+a<z&&+a>=1&&z<b.size);assert.ok(!starts.includes(String(z)))}
    for(const [a,z] of Object.entries(b.snakes)){assert.ok(+a>z&&+a<b.size&&z>=1);assert.ok(!starts.includes(String(z)))}
  }
  assert.ok(G.rules({difficulty:'Easy'}).pourSpeed<G.rules({difficulty:'Hard'}).pourSpeed);
  assert.ok(G.threshold('Tap Speed',{difficulty:'Easy'},35)<G.threshold('Tap Speed',{difficulty:'Hard'},35));
  for(const name of Object.keys(G.games))assert.match(G.mark(name),/<svg.*viewBox="0 0 64 64"/);
});
