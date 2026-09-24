const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
GlobalFonts.registerFromPath('assets/fonts/Mali-Regular.ttf','DH Handwriting');
GlobalFonts.registerFromPath('assets/fonts/NotoSansThaiLooped.ttf','DH Thai Looped');
const ctx={window:{DrawHero:{}},document:{fonts:{load:async()=>[true]},createElement:()=>createCanvas(1,1)},setTimeout,clearTimeout,Uint8Array,Float32Array};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/handwriting.js','utf8'),ctx);
const H=ctx.window.DrawHero.Handwriting;
function text(s,font,angle=0){const c=createCanvas(1100,360),p=c.getContext('2d');p.translate(50,160);p.rotate(angle*Math.PI/180);p.font=`110px "${font}"`;p.fillText(s,0,0);return c;}
async function recognize(c,target){await H.prepare(target,'th');return H.recognize({canvas:c,target,options:{language:'th'}});}
async function main(){
  await H.ready;let correct=0,controls=0;
  for(const font of ['DH Handwriting','DH Thai Looped'])for(const target of ['ร','ฐ','จ','ค','กระจก','จาน','รถ'])for(const angle of [-7,0,7]){
    const r=await recognize(text(target,font,angle),target);
    assert.notEqual(r.status,'incorrect',`${target} ${font} ${angle} ${JSON.stringify(r)}`);
    if(r.status==='correct')correct++;
  }
  for(const font of ['DH Handwriting','DH Thai Looped'])for(const [input,target] of [['ฐ','ร'],['ร','ฐ'],['ค','จ'],['จ','ค'],['กฐะจก','กระจก'],['กระคก','กระจก'],['กะจก','กระจก'],['กระจกก','กระจก']]){
    const r=await recognize(text(input,font),target);assert.notEqual(r.status,'correct',`${input} must not pass as ${target}: ${JSON.stringify(r)}`);controls++;
  }
  if(process.env.DH_THAI_SCREENSHOT){
    const img=await loadImage(process.env.DH_THAI_SCREENSHOT);
    for(const threshold of [55,75,95]){
      const c=createCanvas(1000,260),p=c.getContext('2d');p.drawImage(img,img.width*.265,img.height*.735,img.width*.445,img.height*.155,0,0,1000,260);
      const data=p.getImageData(0,0,1000,260);
      for(let i=0;i<data.data.length;i+=4){const dark=data.data[i]<threshold&&data.data[i+1]<threshold+20&&data.data[i+2]<threshold+45;data.data[i]=data.data[i+1]=data.data[i+2]=0;data.data[i+3]=dark?255:0;}
      p.putImageData(data,0,0);const r=await recognize(c,'กระจก');console.log('USER THAI SCREENSHOT',threshold,JSON.stringify(r));assert.equal(r.status,'correct');
      for(const target of ['กฐะจก','กระคก','กระจกก','กะจก'])assert.notEqual((await recognize(c,target)).status,'correct',target);
    }
  }
  console.log(JSON.stringify({correct,total:42,wrongControls:controls}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
