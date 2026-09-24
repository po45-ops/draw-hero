const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const {createCanvas,GlobalFonts}=require("@napi-rs/canvas");
const root=path.resolve(__dirname,"..");
GlobalFonts.registerFromPath(path.join(root,"assets/fonts/Mali-Regular.ttf"),"DH Handwriting");
GlobalFonts.registerFromPath(path.join(root,"assets/fonts/NotoSansThaiLooped.ttf"),"DH Thai Looped");
const context={window:{DrawHero:{}},document:{fonts:{load:async()=>[true]},createElement:()=>createCanvas(1,1)},setTimeout,clearTimeout,Uint8Array,Float32Array};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,"js/handwriting.js"),"utf8"),context);
const H=context.window.DrawHero.Handwriting;
function written(text,{angle=0,slant=0,width=1,font="DH Handwriting"}={}){
  const c=createCanvas(1600,420),ctx=c.getContext("2d");
  ctx.translate(90,160);ctx.rotate(angle*Math.PI/180);ctx.transform(width,0,slant,1,0,0);
  ctx.font=`110px "${font}"`;ctx.fillText(text,0,0);return c;
}
async function main(){
  await H.ready;
  const targets=["ก","ข","ง","ม","น","ป","พ","ฮ","61","100","B","R","cat","DOG","กางเกง","กิน","เด็ก","กิ","กี","ป่า","ป้า"];
  for(const t of targets)await H.prepare(t,/[ก-๛]/u.test(t)?"th":"en");
  const variations=[{name:"left tilt",angle:-10},{name:"right tilt",angle:10},{name:"left slant",slant:-.22},{name:"right slant",slant:.22},{name:"narrow",width:.78},{name:"wide",width:1.22}];
  const failures=[],summary={correct:0,uncertain:0,incorrect:0};
  for(const target of targets)for(const variation of variations){
    const r=H.recognize({canvas:written(target,variation),target,options:{language:/[ก-๛]/u.test(target)?"th":"en"}});
    summary[r.status]++;if(r.status!=="correct")failures.push({target,variation:variation.name,status:r.status,details:r.details});
  }
  console.log("VARIATION SURVEY",JSON.stringify({summary,failures}));
  if(!process.argv.includes("--survey")){
    assert.equal(summary.incorrect,0,"Tilt/width variation must not produce a wrong-answer penalty");
    assert.equal(summary.correct,targets.length*variations.length,"All bounded variation fixtures must be accepted");
  }
  for(const radius of [6,10,14]){
    const ink=createCanvas(260,260),pen=ink.getContext("2d");pen.lineWidth=8;pen.lineCap="round";pen.lineJoin="round";
    pen.beginPath();pen.arc(144-radius,48,radius,0,Math.PI*2);pen.stroke();
    pen.beginPath();pen.moveTo(144,48);pen.lineTo(148,195);pen.quadraticCurveTo(108,186,64,139);pen.stroke();
    const r=H.recognize({canvas:ink,target:"ง",options:{language:"th"}});
    console.log("HAND-DRAWN LOOP",radius,JSON.stringify(r));
    if(!process.argv.includes("--survey"))assert.equal(r.status,"correct",`Hand-drawn ง with loop radius ${radius}`);
  }
  // A real shape change must not be excused as a change of handwriting style.
  for(const [input,target] of [["C","G"],["6","9"],["16","61"],["CAT","CAR"],["กา","ก่า"],["ขา","กา"],["กี","กิ"],["ป่า","ป้า"]]){
    await H.prepare(target,/[ก-๛]/u.test(target)?"th":"en");
    for(const variation of variations){
      const r=H.recognize({canvas:written(input,variation),target,options:{language:/[ก-๛]/u.test(target)?"th":"en"}});
      assert.notEqual(r.status,"correct",`${input} must not pass as ${target} (${variation.name}) ${JSON.stringify(r.details)}`);
    }
  }
  console.log("PASS: bounded variations and wrong-character controls");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
