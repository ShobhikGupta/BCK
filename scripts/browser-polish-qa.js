async (page) => {
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  const base='http://127.0.0.1:8137',errors=[],failed=[],httpErrors=[],exports=[];
  page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()})});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ERR_ABORTED'))failed.push({url:r.url(),error:r.failure()?.errorText})});
  await page.goto(base+'/dashboard.html?view=qr&preview=1');
  await page.getByRole('combobox',{name:'Template',exact:true}).waitFor();
  for(const template of ['raw','table','tent','counter','poster','receipt']){
    await page.getByRole('combobox',{name:'Template',exact:true}).selectOption(template);
    const pending=page.waitForEvent('download');
    await page.getByRole('button',{name:'Download PNG',exact:true}).click();
    const download=await pending,path='output/playwright/qr-'+template+'.png';await download.saveAs(path);
    const decoded=await page.evaluate(async()=>{const canvas=document.querySelector('#printKitPreview canvas');return (await new BarcodeDetector({formats:['qr_code']}).detect(canvas)).map(x=>x.rawValue)});
    if(decoded.length!==1||decoded[0]!==base+'/play.html?merchant=preview')throw Error('QR decode failed: '+template);
    exports.push({template,path,decoded});
  }
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();await (await pending).saveAs('output/playwright/qr-receipt.pdf');
  const widths=[320,360,375,390,430,768,1024,1366,1440],sizes=[];
  for(const route of ['overview','campaigns','analytics','qr','menu','coupons','customers','settings','company']){
    await page.goto(base+'/dashboard.html?view='+route+'&preview=1');
    await page.locator('.page-head h1').waitFor();
    if(route==='qr')await page.getByRole('combobox',{name:'Template',exact:true}).waitFor();
    if(route==='company')await page.locator('#businessHours').waitFor();
    if(route==='menu')await page.getByRole('heading',{name:'Menu',exact:true}).waitFor();
    if(route==='analytics'){
      await page.getByRole('button',{name:'1D',exact:true}).waitFor();
      if(await page.getByRole('button',{name:'7D',exact:true}).count()!==1)throw Error('Duplicate date selector');
      await page.getByRole('button',{name:'90D',exact:true}).click();
      await page.getByRole('button',{name:'Refresh analytics',exact:true}).click();
      await page.getByRole('button',{name:'Custom',exact:true}).click();
      await page.locator('#insightCustom input[name=from]').fill('2026-09-01');
      await page.locator('#insightCustom input[name=to]').fill('2026-09-13');
      await page.getByRole('button',{name:'Apply range',exact:true}).click();
      for(const tab of ['Games','Coupons','Retention','Traffic'])await page.getByRole('button',{name:tab,exact:true}).click();
    }
    for(const width of widths){
      await page.setViewportSize({width,height:900});
      const s=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));sizes.push({route,...s});if(s.scroll>s.width)throw Error(route+' overflows at '+width);
      if(['campaigns','analytics','qr'].includes(route))await page.screenshot({path:'output/playwright/'+route+'-'+width+'.png',fullPage:true});
    }
  }
  if(errors.length)throw Error(errors.join('; '));
  if(failed.length||httpErrors.length)throw Error(JSON.stringify({failed,httpErrors}));
  return {exports,sizes,errors,failed,httpErrors};
}
