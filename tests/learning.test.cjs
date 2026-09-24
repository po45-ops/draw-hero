const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const {createCanvas,GlobalFonts}=require("@napi-rs/canvas");
const root=path.resolve(__dirname,"..");
GlobalFonts.registerFromPath(path.join(root,"assets/fonts/Mali-Regular.ttf"),"DH Handwriting");
GlobalFonts.registerFromPath(path.join(root,"assets/fonts/NotoSansThaiLooped.ttf"),"DH Thai Looped");
const arial="/System/Library/Fonts/Supplemental/Arial.ttf";
if(fs.existsSync(arial))GlobalFonts.registerFromPath(arial,"Arial");
const elements=new Map();
const element=()=>({style:{},classList:{toggle(){},remove(){},add(){}},setAttribute(){},addEventListener(){}});
const document={fonts:{load:async()=>[true]},createElement:type=>type==="canvas"?createCanvas(720,420):element(),getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);}};
const context={window:{},document,console,setTimeout,clearTimeout,performance,Uint8Array,Float32Array};
context.window.speechSynthesis={cancel(){},getVoices:()=>[{lang:"th-TH",localService:true},{lang:"en-US",localService:true}],speak(u){context.spoken=u;u.onend();}};
context.window.SpeechSynthesisUtterance=function(text){this.text=text;};
vm.createContext(context);
for(const file of ["content","word-lists","curriculum","levels","handwriting","drawing","practice-guide","audio","battle"])vm.runInContext(fs.readFileSync(path.join(root,`js/${file}.js`),"utf8"),context);
const DH=context.window.DrawHero;
function textCanvas(text,font="DH Handwriting",size=130){const c=createCanvas(1200,300),ctx=c.getContext("2d");ctx.font=`${size}px "${font}"`;ctx.fillStyle="#000";ctx.fillText(text,20,200);return c;}
function recognize(c,target,language){return DH.Handwriting.recognize({canvas:c,target,options:{language}});}
async function main(){
  await DH.Handwriting.ready;
  await DH.Handwriting.prepare("100","number");await DH.Handwriting.prepare("A","en");await DH.Handwriting.prepare("ก่า","th");
  await DH.Handwriting.prepare("กางเกง","th");
  const trousers=recognize(textCanvas("กางเกง"),"กางเกง","th");
  console.log("THAI WORD REGRESSION กางเกง",JSON.stringify(trousers));
  assert.notEqual(trousers.status,"incorrect","Legible กางเกง must not be penalized");
  const joinedWord=textCanvas("กางเกง"),joinedCtx=joinedWord.getContext("2d"),pixels=joinedCtx.getImageData(0,0,joinedWord.width,joinedWord.height).data;
  const columns=[];for(let x=0;x<joinedWord.width;x++){let hasInk=false;for(let y=0;y<joinedWord.height;y++)if(pixels[(y*joinedWord.width+x)*4+3]>64){hasInk=true;break;}if(hasInk)columns.push(x);}
  let gap=-1;for(let i=1;i<columns.length;i++)if(columns[i]-columns[i-1]>1){gap=i;break;}
  assert.ok(gap>0,"Printed Thai word must have a gap for the joined-letter fixture");
  joinedCtx.fillRect(columns[gap-1],170,columns[gap]-columns[gap-1]+1,3);
  const joinedResult=recognize(joinedWord,"กางเกง","th");
  console.log("JOINED THAI WORD",JSON.stringify(joinedResult));
  assert.equal(joinedResult.status,"correct","A lightly joined กางเกง must be accepted");
  assert.notEqual(recognize(joinedWord,"กางเขง","th").status,"correct","A similar wrong word must still be rejected");
  for(const q of DH.Content.questions.filter(q=>["thai_word","thai_phrase","thai_letter"].includes(q.type)))await DH.Handwriting.prepare(q.answer,q.language);
  let passed=0,uncertain=0;
  for(const target of ["1","6","61","100","A","B","ก","ข","กา","กบ","ขา","CAT","DOG","I GO TO SCHOOL"]){
    const result=recognize(textCanvas(target),target,/[ก-ฮ]/.test(target)?"th":"en");
    console.log("CORRECT fixture",target,result.status,result.score,JSON.stringify(result.details));
    assert.notEqual(result.status,"incorrect",`Correct answer ${target} must not be marked wrong`);
    if(result.status==="correct")passed++;else uncertain++;
  }
  for(const [written,target] of [["A","B"],["C","G"],["6","9"],["16","61"],["1","100"],["CAT","CAR"],["DOG","CAT"],["ขา","กา"],["กา","ก่า"],["I GO TO SCHOOL","I GO TO BOOK"]]){
    const result=recognize(textCanvas(written),target,/[ก-ฮ]/.test(target)?"th":"en");
    console.log("WRONG fixture",written,"expected",target,result.status,result.score);
    assert.notEqual(result.status,"correct",`${written} must not pass as ${target}`);
  }
  assert.equal(recognize(createCanvas(720,420),"ก","th").status,"empty");
  // Independent curved pen fixture, not generated from recognition templates.
  const handwritten=createCanvas(500,300),pen=handwritten.getContext("2d");
  pen.lineWidth=14;pen.lineCap="round";pen.lineJoin="round";
  pen.beginPath();pen.moveTo(180,30);pen.bezierCurveTo(150,70,112,165,151,229);pen.bezierCurveTo(194,285,268,219,236,176);pen.bezierCurveTo(209,142,155,164,145,215);pen.stroke();
  pen.beginPath();pen.moveTo(294,67);pen.lineTo(320,35);pen.lineTo(320,250);pen.stroke();
  const handResult=recognize(handwritten,"61","number");console.log("HANDWRITTEN 61",JSON.stringify(handResult));
  assert.equal(handResult.status,"correct","Handwritten 61 must pass");
  assert.notEqual(recognize(handwritten,"91","number").status,"correct");
  for(const target of "0123456789"){
    assert.equal(recognize(textCanvas(target),target,"number").status,"correct");
    for(const written of "0123456789")if(written!==target)
      assert.notEqual(recognize(textCanvas(written),target,"number").status,"correct",`${written} must not pass as ${target}`);
  }
  const scribble=createCanvas(400,250),scribblePen=scribble.getContext("2d");
  scribblePen.lineWidth=12;scribblePen.beginPath();scribblePen.moveTo(20,20);
  for(let i=0;i<24;i++)scribblePen.lineTo(20+(i*137)%350,20+(i*89)%210);
  scribblePen.stroke();
  assert.notEqual(recognize(scribble,"6","number").status,"correct","Scribbles must not pass");
  const survey={correct:0,incorrect:[],uncertain:[]};
  for(const q of DH.Content.questions.filter(q=>["thai_letter","english_letter","thai_word","thai_phrase"].includes(q.type))){
    const r=recognize(textCanvas(q.answer,"DH Handwriting",70),q.answer,q.language);
    if(r.status==="correct")survey.correct++;else survey[r.status].push({answer:q.answer,details:r.details});
  }
  console.log("FULL CONTENT SURVEY",JSON.stringify(survey));
  assert.equal(survey.incorrect.length,0,"Legible content fixtures must never receive a wrong verdict");
  const strokes=[{tool:"pen",width:10,points:[{x:40,y:30},{x:40,y:160}]},{tool:"eraser",width:30,points:[{x:40,y:20},{x:40,y:180}]}];
  const ink=DH.DrawingBoard.prototype.exportInkCanvas.call({canvas:{width:720,height:420},strokes});
  assert.equal(recognize(ink,"1","number").status,"empty","Erased ink must not be recognized");
  const displayed=DH.DrawingBoard.prototype.exportRecognitionCanvas.call({
    exportInkCanvas:()=>textCanvas("61"),canvas:{getBoundingClientRect:()=>({width:300,height:400})}
  });
  assert.equal(displayed.width/displayed.height,.75,"Recognition must retain the on-screen aspect ratio");
  const practiceBoard={guide:"ก",canvas:{getBoundingClientRect:()=>({width:720,height:420})},practiceTemplate:DH.DrawingBoard.prototype.practiceTemplate};
  const trace=practiceBoard.practiceTemplate();practiceBoard.exportRecognitionCanvas=()=>trace;
  let fit=DH.DrawingBoard.prototype.practiceFit.call(practiceBoard);
  assert.ok(fit.inside>=.94&&fit.coverage>=.6&&fit.precision>=.68,"Complete trace passes");
  const shifted=createCanvas(720,420);shifted.getContext("2d").drawImage(trace,6,4);practiceBoard.exportRecognitionCanvas=()=>shifted;
  fit=DH.DrawingBoard.prototype.practiceFit.call(practiceBoard);assert.ok(fit.coverage>=.6&&fit.precision>=.68,"Small handwriting offsets allowed");
  practiceBoard.exportRecognitionCanvas=()=>scribble;
  fit=DH.DrawingBoard.prototype.practiceFit.call(practiceBoard);assert.ok(fit.coverage<.6||fit.precision<.68,"Random ink must not pass tracing");
  const outside=createCanvas(720,420),outsidePen=outside.getContext("2d");outsidePen.fillRect(0,0,720,10);practiceBoard.exportRecognitionCanvas=()=>outside;
  assert.ok(DH.DrawingBoard.prototype.practiceFit.call(practiceBoard).inside<.94,"Out-of-frame ink rejected");
  // Integration: uncertain/blank submissions must not grant points or record mistakes.
  const engine={running:true,paused:false,game:{difficulty:"easy"},stage:{recognitionThreshold:47},
    board:{hasDrawing:()=>true,exportRecognitionCanvas:()=>ink,strokes:[]},
    currentQuestion:()=>({recognitionMode:"raster",language:"number"}),currentCharacter:()=>"1",
    correctAnswer(){throw Error("Unexpected reward");},wrongAnswer(){throw Error("Unexpected penalty");},message(){}};
  DH.BattleEngine.prototype.cast.call(engine);
  engine.board.exportRecognitionCanvas=()=>textCanvas("11");
  DH.BattleEngine.prototype.cast.call(engine);
  for(const [type,expected] of [["thai_letter",44],["english_letter",26],["number",100]]){
    const pool=DH.Content.byType(type),covered=new Set(DH.Levels.levels.flatMap(l=>l.questions));
    assert.equal(pool.length,expected);assert.ok(pool.every(q=>covered.has(q.id)),`Stage coverage for ${type}`);
  }
  const basic=DH.Content.byType("thai_word").filter(q=>q.source);
  assert.equal(basic.length,80);assert.ok(basic.every(q=>DH.Levels.levels.some(l=>l.questions.includes(q.id))));
  const ids=DH.Content.questions.map(q=>q.id);assert.equal(new Set(ids).size,ids.length);
  const stageIds=DH.Levels.levels.map(l=>l.id);assert.equal(new Set(stageIds).size,stageIds.length);
  assert.ok(DH.Levels.forWorld(1).length>14);assert.ok(DH.Levels.forWorld(2).length>6);
  for(const language of ["th","en"])for(let grade=1;grade<=6;grade++){
    const list=DH.WordLists.find(l=>l.language===language&&l.grade===grade);assert.ok(list.words.length>=150);
    const lessons=DH.Levels.levels.filter(l=>l.grade===grade&&l.category==="basic"&&l.world===(language==="th"?1:2));
    assert.equal(lessons.flatMap(l=>l.questions).length,list.words.length);
  }
  const thaiLetters=DH.Levels.forWorld(1).filter(l=>l.category==="letters").flatMap(l=>l.questions).map(id=>DH.Content.byId(id).answer).join("");
  assert.equal(thaiLetters,"กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ");
  assert.equal(DH.Content.byType("english_lower").length,26);
  for(const q of DH.Content.questions.filter(q=>q.generated)){const [a,op,b,,c]=q.display.split(" "),x=b==="?"?Number(q.answer):Number(b),answer=c==="?"?Number(q.answer):Number(c);assert.equal(op==="+"?+a+x:op==="−"?+a-x:op==="×"?+a*x:+a/x,answer);}
  const practice=DH.BattleEngine.prototype.prepareStage.call({game:{difficulty:"easy"}},{practice:true,timeLimit:0,enemySpeed:0});assert.equal(practice.timeLimit,0);assert.ok(practice.enemySpeed>0,"Practice enemies must visibly approach even without Game Over");
  const moving={running:true,paused:false,lastTime:1000,freezeUntil:0,impactUntil:0,slowUntil:0,questionTime:0,
    stage:practice,enemies:[{distance:80,data:{speed:1,boss:false}}],positionEnemy(){},enemyReached(){throw Error("Enemy should not reach player instantly");},updateTimer(){}};
  context.requestAnimationFrame=()=>1;
  DH.BattleEngine.prototype.loop.call(moving,1016);
  assert.ok(moving.enemies[0].distance<80,"Practice enemy position must advance each frame");
  moving.paused=true;const pausedDistance=moving.enemies[0].distance;
  DH.BattleEngine.prototype.loop.call(moving,1032);
  assert.equal(moving.enemies[0].distance,pausedDistance,"Paused enemies must stay still");
  DH.Audio.readQuestion(DH.Content.byType("math_add")[0],null);
  assert.equal(context.spoken.text,"3  บวก  4  เท่ากับเท่าไร");
  DH.Audio.readQuestion(DH.Content.byType("thai_letter")[0],null);
  assert.equal(context.spoken.text,"กอ ไก่");
  DH.Audio.readQuestion(DH.Content.byType("english_word")[0],null);
  assert.equal(context.spoken.lang,"en-US");
  const previous=context.spoken;DH.Audio.configure({sound:false});
  assert.equal(DH.Audio.readQuestion(DH.Content.byType("thai_letter")[0],null),false);
  assert.equal(context.spoken,previous,"Muted sound must not speak");
  DH.Audio.stopSpeech();
  console.log(`PASS: ${passed} accepted correct fixtures, ${uncertain} ambiguous (not penalized); wrong answers rejected, eraser, stage coverage and speech passed.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
