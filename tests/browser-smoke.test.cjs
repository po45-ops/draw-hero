// Uses isolated browser storage; never modifies a real player's save.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function main(){
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    for(const viewport of [{width:1280,height:800},{width:834,height:1112},{width:390,height:844}]){
      const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>localStorage.setItem('drawHeroSaveV1',JSON.stringify({tutorialSeen:true,settings:{sound:false,music:false}})));
      await page.goto(process.env.DRAW_HERO_TEST_URL||'http://127.0.0.1:8765/');
      await page.locator('#screen-main.active').waitFor();
      const layouts=[];
      async function check(name){
        await page.locator(`#screen-${name}.active`).waitFor();
        assert.equal(await page.locator('.screen.active').count(),1);
        layouts.push(await page.evaluate(()=>({screen:document.querySelector('.screen.active').dataset.screen,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)})));
      }
      for(const screen of ['characters','modes','content','missions','settings']){
        await page.locator(`#screen-main [data-nav="${screen}"]`).first().click();await check(screen);
        await page.locator(`#screen-${screen} [data-back="main"]`).click();
      }
      await page.evaluate(()=>{
        const proto=DrawHero.BattleEngine.prototype,start=proto.start;
        proto.start=function(...args){window.auditBattle=this;return start.apply(this,args);};
      });
      await page.locator('#start-button').click();
      await page.locator('.mode-story').click();await page.locator('#select-character').click();await check('difficulty');
      await page.locator('#confirm-difficulty').click();await check('map');
      await page.locator('.world-node button').first().click();
      await page.locator('.stage-card').first().click();await check('battle');
      const grace=await page.evaluate(()=>{
        const b=auditBattle;b.readingBudget=0;b.readingGrace=0;b.setQuestion();
        const same=b.readingBudget;b.questionCursor++;b.setQuestion();
        return {same,next:b.readingBudget};
      });assert.deepEqual(grace,{same:0,next:6},'Only a new question replenishes retry protection');
      await page.locator('#pause-button').click();await page.locator('#back-to-stages-button').click();
      await check('map');assert.ok(await page.locator('.stage-card:visible').count());
      await page.locator('.stage-card').first().click();
      await page.evaluate(()=>auditBattle.finish(true));await check('result');
      await page.locator('#result-map-button').click();await check('map');
      assert.ok(await page.locator('.stage-card:visible').count());
      // Use actual browser canvas/fonts to check one tilted word and latency.
      const reading=await page.evaluate(async()=>{
        await DrawHero.Handwriting.prepare('กางเกง','th');
        const canvas=document.createElement('canvas');canvas.width=900;canvas.height=300;
        const pen=canvas.getContext('2d');pen.translate(70,150);pen.rotate(-.12);pen.font='100px "DH Handwriting"';pen.fillText('กางเกง',0,0);
        const start=performance.now(),result=DrawHero.Handwriting.recognize({canvas,target:'กางเกง',options:{language:'th'}});
        const milliseconds=Math.round(performance.now()-start);
        await DrawHero.Handwriting.prepare('CAT','en',{caseInsensitive:true});
        pen.resetTransform();pen.clearRect(0,0,900,300);pen.font='100px "DH Handwriting"';pen.fillText('cAt',80,150);
        const english=DrawHero.Handwriting.recognize({canvas,target:'CAT',options:{language:'en',caseInsensitive:true}});
        return {status:result.status,milliseconds,english:english.status};
      });
      assert.equal(reading.status,'correct');assert.equal(reading.english,'correct');assert.deepEqual(errors,[]);
      console.log(JSON.stringify({viewport,layouts,reading,errors}));await context.close();
    }
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
