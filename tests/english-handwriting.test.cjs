const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createCanvas,GlobalFonts,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
GlobalFonts.registerFromPath(path.join(root,'assets/fonts/Mali-Regular.ttf'),'DH Handwriting');
GlobalFonts.registerFromPath(path.join(root,'assets/fonts/NotoSansThaiLooped.ttf'),'DH Thai Looped');
const context={window:{DrawHero:{}},document:{fonts:{load:async()=>[true]},createElement:()=>createCanvas(1,1)},setTimeout,clearTimeout,Uint8Array,Float32Array};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js/handwriting.js'),'utf8'),context);
const H=context.window.DrawHero.Handwriting;
function written(text,angle=0){const c=createCanvas(1600,400),p=c.getContext('2d');p.translate(60,140);p.rotate(angle*Math.PI/180);p.font='100px "DH Handwriting"';p.fillText(text,0,0);return c;}
function handCAT(){
  const c=createCanvas(640,300),p=c.getContext('2d');p.lineWidth=13;p.lineCap='round';p.lineJoin='round';
  // Independent pen paths inspired by the reported screenshot, not a font.
  p.beginPath();p.moveTo(179,80);p.bezierCurveTo(75,13,56,235,155,213);p.lineTo(164,203);p.stroke();
  p.beginPath();p.moveTo(204,222);p.bezierCurveTo(211,145,224,45,240,73);p.bezierCurveTo(255,93,261,172,269,218);p.stroke();
  p.beginPath();p.moveTo(203,170);p.lineTo(275,164);p.stroke();
  p.beginPath();p.moveTo(270,81);p.lineTo(364,70);p.stroke();
  p.beginPath();p.moveTo(302,67);p.lineTo(311,220);p.stroke();return c;
}
async function main(){
  await H.ready;
  const check=async(input,target,caseInsensitive=true)=>{await H.prepare(target,'en',{caseInsensitive});return H.recognize({canvas:typeof input==='string'?written(input):input,target,options:{language:'en',caseInsensitive}});};
  for(const input of ['CAT','cat','Cat','cAt','caT'])for(const angle of [-10,0,10]){
    const r=await check(written(input,angle),'CAT');console.log(input,angle,r.status,JSON.stringify(r.details));assert.equal(r.status,'correct');
  }
  for(const [input,target] of [['a cat','A CAT'],['I go to school','I GO TO SCHOOL'],['dog','DOG'],['Cat','cat']])assert.equal((await check(input,target)).status,'correct',input);
  const hand=await check(handCAT(),'CAT');console.log('HAND CAT',JSON.stringify(hand));assert.equal(hand.status,'correct');
  const uneven=createCanvas(500,240),p=uneven.getContext('2d');
  for(const [letter,x,y,size] of [['C',20,155,110],['a',110,160,82],['T',205,158,100]]){p.font=`${size}px "DH Handwriting"`;p.fillText(letter,x,y);}
  assert.equal((await check(uneven,'CAT')).status,'correct','Unequal letter heights and spacing');
  // Optional exact user screenshot. Extract ink in memory for recognition only;
  // the source image is never changed or copied into the published game.
  if(process.env.DH_CAT_SCREENSHOT){
    const image=await loadImage(process.env.DH_CAT_SCREENSHOT),crop=createCanvas(560,320),pen=crop.getContext('2d');
    pen.drawImage(image,image.width*.395,image.height*.665,image.width*.24,image.height*.20,0,0,560,320);
    const pixels=pen.getImageData(0,0,560,320);
    for(let i=0;i<pixels.data.length;i+=4){const dark=pixels.data[i]<65&&pixels.data[i+1]<90&&pixels.data[i+2]<110;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=0;pixels.data[i+3]=dark?255:0;}
    pen.putImageData(pixels,0,0);const exact=await check(crop,'CAT');console.log('USER SCREENSHOT CAT',JSON.stringify(exact));assert.equal(exact.status,'correct');
  }
  for(const input of ['CAR','CA','CATT','CUT','DOG'])for(const variant of [input,input.toLowerCase()])assert.notEqual((await check(variant,'CAT')).status,'correct',variant);
  assert.equal((await check('a','a',false)).status,'correct');
  assert.equal((await check('A','A',false)).status,'correct');
  assert.notEqual((await check('A','a',false)).status,'correct');
  assert.notEqual((await check('a','A',false)).status,'correct');
  assert.equal((await check('i','I',true)).status,'correct');
  for(const letter of 'abcdefghijklmnopqrstuvwxyz')assert.notEqual((await check(letter,letter,false)).status,'incorrect',letter);
  console.log('PASS English case, spacing, independently drawn CAT and misspelling controls');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
