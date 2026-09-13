async (page) => {
  const base='http://127.0.0.1:8137';
  const names=['Spin the Wheel','Instant Lottery','Slot Machine','Catch & Win','Snakes & Ladders','Tap Speed','Perfect Pour','Pin the Bite','Stack & Win'];
  const rows=[],errors=[],rpc=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/rest/v1/rpc/'))rpc.push(r.url())});
  for(const game of names){
    await page.goto(base+'/play.html?test=1&game='+encodeURIComponent(game));
    await page.locator('#beginGame').waitFor();
    for(const width of [320,360,375,390,430,768,1024,1366,1440]){
      await page.setViewportSize({width,height:844});
      const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
      if(size.scroll>size.width)throw Error(game+' overflows at '+width);
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#beginGame').click();
    if(game==='Instant Lottery')await page.locator('.lottery-card').first().click();
    if(game==='Catch & Win'){await page.locator('#catchArea').press('ArrowRight');await page.locator('#catchArea').press('ArrowLeft')}
    if(game==='Tap Speed'){for(let i=0;i<10;i++)await page.locator('#tapButton').click()}
    if(game==='Perfect Pour'){const b=await page.locator('#pourHold').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(1800);await page.mouse.up()}
    if(game==='Pin the Bite'){await page.locator('#pinButton').click();await page.locator('#pinButton').click()}
    if(game==='Stack & Win'){for(let i=0;i<25;i++){if(await page.locator('#resultNext').count())break;await page.locator('#stackButton').click()}}
    if(game==='Snakes & Ladders'){for(let i=0;i<100;i++){if(await page.locator('#resultNext').count())break;await page.locator('#rollDice').click();await page.waitForFunction(()=>document.querySelector('#resultNext')||!document.querySelector('#rollDice')?.disabled)}}
    await page.locator('#resultNext:not([disabled])').waitFor({timeout:30000});
    const result=await page.locator('#app h1').innerText();
    await page.locator('#resultNext').click();
    if(await page.locator('.coupon-code').count()){if((await page.locator('.coupon-code').innerText())!=='TEST-NOT-REDEEMABLE')throw Error('Real coupon in test mode')}
    await page.screenshot({path:'output/playwright/'+game.replace(/[^a-z]/gi,'-')+'.png'});
    rows.push({game,result,rewardState:await page.locator('#app').getAttribute('data-state')});
  }
  if(errors.length)throw Error(errors.join('; '));
  if(rpc.length)throw Error('Test mode sent RPCs: '+rpc.join(','));
  return {games:rows,widths:[320,360,375,390,430,768,1024,1366,1440],errors,rpc};
}
