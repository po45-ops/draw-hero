(function () {
  "use strict";
  window.DRAW_HERO_DEBUG = false;
  const DH=window.DrawHero,$=id=>document.getElementById(id),game=new DH.GameState();
  let activeScreen="splash",characterIndex=Math.max(0,DH.Characters.all.findIndex(c=>c.id===game.characterId));
  let flowActive=false,selectedWorld=1,selectedDifficulty=game.difficulty,mapView="worlds",lastResult=null,currentStage=null,toastTimer=0,tutorialStep=0;
  let modelTimer=0,modelAngle=0,modelDrag=null;
  let lessonCategory="all",lessonGrade="all",lessonPage=0;
  const battle=new DH.BattleEngine(game,handleBattleFinish),ar=new DH.ARController({onStatus:message=>toast(message)});

  const i18n={
    th:{start:"เริ่มเกม",characters:"เลือกตัวละคร",modes:"โหมดการเล่น",library:"คลังเนื้อหา",missions:"ภารกิจ",creator:"ผู้สร้างด่าน",settings:"ตั้งค่า"},
    en:{start:"Start Game",characters:"Choose Hero",modes:"Game Modes",library:"Content Library",missions:"Missions",creator:"Stage Creator",settings:"Settings"}
  };
  const modeData=[
    {id:"story",name:"Story Mode",thai:"เนื้อเรื่อง",icon:"♜",color:"#37b9ff",art:"../assets/backgrounds/modes/story.jpg",desc:"เลือกได้ทั้ง 4 โลก ฝึกตามหมวดและสะสมดาว",tag:"4 WORLDS • PROGRESSION"},
    {id:"practice",name:"Practice Mode",thai:"โหมดฝึก",icon:"✎",color:"#55c271",art:"../assets/backgrounds/modes/practice.jpg",desc:"เลือกเนื้อหาและฝึกเขียนได้โดยไม่มี Game Over",tag:"CUSTOM TRAINING"},
    {id:"survival",name:"Survival Mode",thai:"เอาชีวิตรอด",icon:"⚔",color:"#55c271",art:"../assets/backgrounds/modes/survival.jpg",desc:"รับมือศัตรูเป็นระลอกและทำคะแนนให้สูงที่สุด",tag:"ENDLESS WAVES"},
    {id:"boss",name:"Boss Fight",thai:"บอสไฟต์",icon:"♛",color:"#ff694f",art:"../assets/backgrounds/modes/boss.jpg",desc:"ตอบโจทย์ต่อเนื่องเพื่อพิชิตบอสทรงพลัง",tag:"EPIC BOSS BATTLE"},
    {id:"custom",name:"Stage Creator",thai:"สร้างด่านเอง",icon:"✎",color:"#b96cff",art:"../assets/backgrounds/modes/creator.jpg",desc:"สร้างบทเรียนของคุณและแชร์ให้ผู้เล่นคนอื่น",tag:"CREATE • PLAY • SHARE"},
    {id:"ar",name:"AR Camera",thai:"สนามรบ AR",icon:"◎",color:"#42f5d7",art:"../assets/backgrounds/modes/ar.jpg",desc:"ใช้กล้องมือถือเป็นฉากต่อสู้เวทมนตร์แบบสด",tag:"CAMERA • LIVE BATTLE"}
  ];

  function init(){
    renderParty();renderModes();renderDifficulties();renderMap();renderContent();renderPracticeTypes();renderCustomStages();
    bindNavigation();bindSettings();bindResults();bindDepthMotion();updatePlayerUI();applySettings();DH.Audio.configure(game.save.settings);
    setTimeout(()=>showScreen("main"),80);
    const params=new URLSearchParams(location.search);if(params.get("preview")==="1")setTimeout(startCreatorPreview,220);
  }
  function showScreen(name){
    if(activeScreen==="battle"&&name!=="battle"){battle.stop();ar.stop();$("screen-battle").classList.remove("ar-mode");}
    if(name!=="characters")clearInterval(modelTimer);
    $("pause-modal").hidden=true;$("tutorial-modal").hidden=true;
    document.querySelectorAll(".screen").forEach(screen=>screen.classList.toggle("active",screen.dataset.screen===name));
    activeScreen=name;window.scrollTo(0,0);
    if(name==="main")updatePlayerUI();if(name==="characters")renderCharacter();if(name==="map")renderMap();if(name==="content")renderContent();if(name==="custom")renderCustomStages();
  }
  function toast(message){const node=$("toast");node.textContent=message;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2500);}
  function heroMarkup(character,withName=true){return `<div class="hero-card-figure hero-${character.id}" style="--hero:${character.color}"><img class="hero-sprite hero-front-sprite" src="${character.frontAsset}" width="256" height="266" decoding="async" alt="${character.name} ${character.title}">${withName?`<b class="hero-nameplate">${character.name}</b>`:""}</div>`;}
  function renderParty(){const party=$("hero-party");if(!party.children.length)party.innerHTML=DH.Characters.all.map(c=>heroMarkup(c)).join("");}
  function renderModes(){
    $("mode-grid").innerHTML="";modeData.forEach(mode=>{const button=document.createElement("button");button.className=`select-card mode-card mode-${mode.id}`;button.style.setProperty("--card-color",mode.color);button.style.setProperty("--mode-art",`url('${mode.art}')`);button.innerHTML=`<span class="mode-art" aria-hidden="true"></span><span class="card-icon">${mode.icon}</span><div class="mode-copy"><h2>${mode.thai}</h2><h3>${mode.name}</h3><p>${mode.desc}</p><small>${mode.tag}</small></div>`;button.addEventListener("click",()=>selectMode(mode.id));$("mode-grid").appendChild(button);});
  }
  function selectMode(id){game.setMode(id);flowActive=true;DH.Audio.play("click");showScreen("characters");}
  function renderCharacter(){
    clearInterval(modelTimer);modelAngle=0;
    const c=DH.Characters.all[characterIndex];const showcase=$("character-showcase");showcase.style.setProperty("--char-glow",`${c.color}66`);showcase.style.setProperty("--char",c.color);showcase.innerHTML=`<div class="character-runes"></div><div class="model-badge"><i></i> 3D CHARACTER • 360°</div><div class="model-stage"><button id="model-rotate-left" class="model-rotate" type="button" aria-label="หมุนตัวละครไปทางซ้าย">‹</button><div id="hero-model-sprite" class="model-sprite hero-model-sprite" style="--model-sheet:url('../${c.sprite3d}')" role="img" aria-label="โมเดล ${c.name} แบบหมุนดูรอบตัว" tabindex="0"></div><button id="model-rotate-right" class="model-rotate" type="button" aria-label="หมุนตัวละครไปทางขวา">›</button><div class="model-platform" aria-hidden="true"><i></i></div></div><div class="model-controls" aria-label="ท่าทางตัวละคร"><button type="button" data-model-pose="rotate">360°</button><button type="button" data-model-pose="idle" class="active">ยืน</button><button type="button" data-model-pose="run">วิ่ง</button><button type="button" data-model-pose="attack">โจมตี</button><button type="button" data-model-pose="skill">ปล่อยพลัง</button></div><div id="model-angle-label" class="model-angle-label">ด้านหน้า • ลากเพื่อหมุน</div><div class="character-thumbnails" aria-label="ตัวละครทั้งหมด"></div>`;
    const thumbnails=showcase.querySelector(".character-thumbnails"),positions=[0,36,74,100];DH.Characters.all.forEach((character,index)=>{const button=document.createElement("button");button.className=index===characterIndex?"active":"";button.style.setProperty("--hero-pos",`${positions[index]}%`);button.style.setProperty("--hero",character.color);button.setAttribute("aria-label",`เลือก ${character.name}`);button.innerHTML='<i class="hero-sprite"></i><small>'+character.name+'</small>';button.addEventListener("click",()=>{characterIndex=index;renderCharacter();});thumbnails.appendChild(button);});
    bindModelViewer();
    const skill=DH.Skills.get(c.skill),mastery=game.characterMastery(c.id),required=mastery.level*60,perk=mastery.level>=3?"หัวใจพิเศษ +1":mastery.level>=2?"ชาร์จสกิลเร็วขึ้น":"เล่นเพื่อปลดล็อกโบนัส";$("character-info").style.setProperty("--char",c.color);$("character-info").innerHTML=`<small class="class-tag">${c.class.toUpperCase()} • MASTERY ${mastery.level}</small><h2>${c.name}</h2><h3>${c.title}</h3><p>${c.description}</p><div class="mastery-panel"><span><b>ความชำนาญ Lv.${mastery.level}</b><small>${perk}</small></span><div class="meter"><i style="width:${Math.min(100,mastery.xp/required*100)}%"></i></div><em>${mastery.xp} / ${required} XP</em></div><div class="stat-row"><span>POWER</span><i style="width:${c.stats.power}%"></i></div><div class="stat-row"><span>SPEED</span><i style="width:${c.stats.speed}%"></i></div><div class="stat-row"><span>MAGIC</span><i style="width:${c.stats.magic}%"></i></div><div class="ability"><b>${c.passive}</b><small>PASSIVE SKILL</small></div><div class="ability"><b>${skill.name}</b><small>${skill.description||"ULTIMATE SKILL"}</small></div>`;
    $("select-character").textContent=game.characterId===c.id?`เลือกแล้ว • ${c.name}`:`เลือก ${c.name}`;
  }
  function bindModelViewer(){
    const sprite=$("hero-model-sprite"),label=$("model-angle-label");if(!sprite)return;
    const angleNames=["ด้านหน้า","เฉียงขวา","ด้านขวา","เฉียงหลังขวา","ด้านหลัง","เฉียงหลังซ้าย","ด้านซ้าย","เฉียงซ้าย"];
    const poseFrames={idle:[8,9],run:[10,11],attack:[12,13],skill:[14,15]};
    const setFrame=frame=>{const column=frame%4,row=Math.floor(frame/4);sprite.style.setProperty("--frame-x",`${column*100/3}%`);sprite.style.setProperty("--frame-y",`${row*100/3}%`);};
    const setActive=pose=>document.querySelectorAll("[data-model-pose]").forEach(button=>button.classList.toggle("active",button.dataset.modelPose===pose));
    const rotate=direction=>{clearInterval(modelTimer);modelAngle=(modelAngle+direction+8)%8;setFrame(modelAngle);setActive("rotate");label.textContent=`${angleNames[modelAngle]} • ลากเพื่อหมุน`;sprite.classList.add("is-turning");setTimeout(()=>sprite.classList.remove("is-turning"),180);};
    const playPose=pose=>{clearInterval(modelTimer);if(pose==="rotate"){setActive(pose);label.textContent="กำลังหมุนดูรอบตัว • ลากเพื่อควบคุม";modelTimer=setInterval(()=>{modelAngle=(modelAngle+1)%8;setFrame(modelAngle);label.textContent=`${angleNames[modelAngle]} • หมุนอัตโนมัติ`;},480);return;}const frames=poseFrames[pose]||poseFrames.idle;let index=0;setFrame(frames[0]);setActive(pose);label.textContent={idle:"ท่ายืนพร้อมรบ",run:"ท่าเคลื่อนที่",attack:"ท่าโจมตี / ฟาดฟัน",skill:"ท่ารวมพลัง / ปล่อยสกิล"}[pose];modelTimer=setInterval(()=>{index=(index+1)%frames.length;setFrame(frames[index]);},pose==="skill"?520:pose==="attack"?330:460);};
    $("model-rotate-left").addEventListener("click",()=>rotate(-1));$("model-rotate-right").addEventListener("click",()=>rotate(1));
    document.querySelectorAll("[data-model-pose]").forEach(button=>button.addEventListener("click",()=>playPose(button.dataset.modelPose)));
    sprite.addEventListener("pointerdown",event=>{modelDrag={x:event.clientX};sprite.setPointerCapture(event.pointerId);sprite.classList.add("dragging");});
    sprite.addEventListener("pointermove",event=>{if(!modelDrag)return;const distance=event.clientX-modelDrag.x;if(Math.abs(distance)>=30){rotate(distance>0?1:-1);modelDrag.x=event.clientX;}});
    const endDrag=()=>{modelDrag=null;sprite.classList.remove("dragging");};sprite.addEventListener("pointerup",endDrag);sprite.addEventListener("pointercancel",endDrag);
    sprite.addEventListener("keydown",event=>{if(event.key==="ArrowLeft"){event.preventDefault();rotate(-1);}if(event.key==="ArrowRight"){event.preventDefault();rotate(1);}});
    playPose("idle");
  }
  function cycleCharacter(direction){characterIndex=(characterIndex+direction+DH.Characters.all.length)%DH.Characters.all.length;renderCharacter();DH.Audio.play("click");}
  function confirmCharacter(){const c=DH.Characters.all[characterIndex];game.setCharacter(c.id);toast(`เลือก ${c.name} เป็นฮีโร่แล้ว`);if(flowActive)showScreen("difficulty");else showScreen("main");}
  function renderDifficulties(){
    const grid=$("difficulty-grid");grid.innerHTML="";Object.values(DH.Levels.difficulties).forEach(d=>{const button=document.createElement("button"),gemCount={easy:1,normal:2,hard:3}[d.id];button.className=`select-card difficulty-card${selectedDifficulty===d.id?" selected":""}`;button.style.setProperty("--card-color",d.color);const emblem=gemCount?`<span class="difficulty-gem difficulty-diamonds" aria-label="${gemCount} เพชร">${Array.from({length:gemCount},()=>"<i></i>").join("")}</span>`:`<span class="difficulty-gem difficulty-crown" aria-label="มงกุฎทอง"><svg viewBox="0 0 80 60" aria-hidden="true"><defs><linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4a8"/><stop offset=".38" stop-color="#ffd04d"/><stop offset=".72" stop-color="#d18a16"/><stop offset="1" stop-color="#8a4b08"/></linearGradient></defs><path fill="url(#crown-gold)" stroke="#fff0a0" stroke-width="2" d="M8 15 25 32 31 8 41 31 52 6 58 32 73 15 66 48H15Z"/><path fill="#8a4b08" stroke="#ffd45c" stroke-width="2" d="M14 47h53v9H14z"/><path fill="none" stroke="#fff3ac" stroke-width="2" d="m18 39 45 0"/><circle cx="25" cy="39" r="3" fill="#65d9ff"/><circle cx="41" cy="39" r="3" fill="#ff6c72"/><circle cx="57" cy="39" r="3" fill="#65d9ff"/></svg></span>`;button.innerHTML=`${emblem}<h2>${d.thai}</h2><h3>${d.label}</h3><ul><li><span>◷</span>เวลา <b>${d.timeLimit} วินาที</b></li><li><span>⚡</span>ความเร็ว <b>${d.speed}x</b></li><li><span>◎</span>เกณฑ์ตรวจ <b>${d.threshold}%</b></li><li><span>♟</span>ศัตรู <b>${d.simultaneous}</b></li></ul>`;button.addEventListener("click",()=>selectDifficulty(d.id));grid.appendChild(button);});
  }
  function selectDifficulty(id){selectedDifficulty=id;DH.Audio.play("click");renderDifficulties();}
  function confirmDifficulty(){game.setDifficulty(selectedDifficulty);DH.Audio.play("click");if(game.mode==="story"){mapView="worlds";showScreen("map");}else if(game.mode==="practice")showScreen("practice");else if(game.mode==="custom")showScreen("custom");else if(game.mode==="boss")startBattle(DH.Levels.get("world4_boss"));else if(game.mode==="ar")startARBattle();else startSurvival();}
  function renderMap(){
    const map=$("world-map"),list=$("stage-list"),stagesOpen=mapView==="stages",world=DH.Levels.worlds.find(item=>item.id===selectedWorld)||DH.Levels.worlds[0];
    $("screen-map").classList.toggle("stages-open",stagesOpen);map.hidden=stagesOpen;list.hidden=!stagesOpen;$("map-title").textContent=stagesOpen?`โลก ${world.id} ${world.name}`:"แผนที่การผจญภัย";$("map-star-label").textContent=stagesOpen?"ความคืบหน้า":"ดาวสะสม";
    if(stagesOpen){renderStages();return;}
    map.innerHTML="";DH.Levels.worlds.forEach(item=>{const unlocked=true;const stars=DH.Levels.forWorld(item.id).reduce((sum,stage)=>sum+(game.save.stageStars[stage.id]||0),0),node=document.createElement("article");node.className=`world-node${unlocked?"":" locked"}`;node.style.setProperty("--world-color",item.color);node.style.setProperty("--world-art",`url('${item.art}')`);node.innerHTML=`<div class="world-art"><span>${unlocked?item.badge:"🔒"}</span></div><div class="world-copy"><small>โลก ${item.id}</small><h3>${item.name}</h3><p>${item.short}</p><div class="world-stars"><span>${"★".repeat(Math.min(3,stars))}${"☆".repeat(Math.max(0,3-Math.min(3,stars)))}</span><b>${stars} / ${DH.Levels.forWorld(item.id).length*3}</b></div><button ${unlocked?"":"disabled"}>${unlocked?"เลือกโลก":"ยังไม่ปลดล็อก"} ›</button></div>`;if(unlocked)node.querySelector("button").addEventListener("click",()=>{selectedWorld=item.id;lessonCategory="all";lessonGrade="all";lessonPage=0;mapView="stages";renderMap();});map.appendChild(node);});
    const visibleTotal=DH.Levels.worlds.reduce((sum,item)=>sum+DH.Levels.forWorld(item.id).length*3,0);$("map-star-total").textContent=`${game.totalStars()} / ${visibleTotal}`;
  }
  function renderStages(){
    const list=$("stage-list"),world=DH.Levels.worlds.find(item=>item.id===selectedWorld),all=DH.Levels.forWorld(selectedWorld);list.innerHTML="";
    const labels={letters:"พยัญชนะ / ตัวอักษร",words:"คำทั่วไป",basic:"บัญชีคำพื้นฐาน ป.1–ป.6",phrases:"ประโยค",numbers:"ตัวเลข 1–100",math:"คณิตศาสตร์"};
    const categories=[...new Set(all.map(s=>s.category))];if(!categories.includes(lessonCategory))lessonCategory="all";
    const filters=document.createElement("div");filters.className="lesson-filters";
    filters.innerHTML=`<label>หมวดบทเรียน<select id="lesson-category"><option value="all">ทุกหมวด</option>${categories.map(c=>`<option value="${c}">${labels[c]}</option>`).join("")}</select></label><label>ระดับชั้น<select id="lesson-grade"><option value="all">ทุกระดับ</option>${[1,2,3,4,5,6].map(g=>`<option value="${g}">ป.${g}</option>`).join("")}</select></label><p>ตัวอักษรเรียงครบตามลำดับ • คำศัพท์แยกตามชั้น • เลือกด่านใดก็ได้</p>`;
    list.appendChild(filters);$("lesson-category").value=lessonCategory;$("lesson-grade").value=lessonGrade;
    for(const [id,set] of [["lesson-category",v=>lessonCategory=v],["lesson-grade",v=>lessonGrade=v]])$(id).addEventListener("change",event=>{set(event.target.value);lessonPage=0;renderStages();});
    const stages=all.filter(s=>(lessonCategory==="all"||s.category===lessonCategory)&&(lessonGrade==="all"||s.grade===Number(lessonGrade)));
    lessonPage=Math.min(lessonPage,Math.max(0,Math.ceil(stages.length/24)-1));
    stages.slice(lessonPage*24,lessonPage*24+24).forEach(stage=>{
      const stars=game.save.stageStars[stage.id]||0,button=document.createElement("button");button.className="stage-card";button.style.setProperty("--stage-art",`url('${world.art}')`);
      const art=document.createElement("div");art.className="stage-art";const symbol=document.createElement("span");symbol.textContent=stage.symbol||world.badge;const rating=document.createElement("em");rating.textContent="★".repeat(stars)+"☆".repeat(3-stars);art.append(symbol,rating);
      const copy=document.createElement("div");copy.className="stage-copy";
      for(const [tag,text] of [["small",`${labels[stage.category]}${stage.grade?` • ป.${stage.grade}`:""}`],["h3",stage.name],["p",stage.description],["b","เริ่มด่าน ›"]]){const el=document.createElement(tag);el.textContent=text;copy.appendChild(el);}
      button.append(art,copy);button.addEventListener("click",()=>startBattle(stage));list.appendChild(button);
    });
    const footer=document.createElement("div");footer.className="lesson-filters";
    for(const [name,delta,disabled] of [["‹ ก่อนหน้า",-1,lessonPage===0],["ถัดไป ›",1,(lessonPage+1)*24>=stages.length]]){const b=document.createElement("button");b.className="fantasy-button";b.textContent=name;b.disabled=disabled;b.addEventListener("click",()=>{lessonPage+=delta;renderStages();list.scrollIntoView({block:"start"});});footer.appendChild(b);}
    const count=document.createElement("p");count.textContent=stages.length?`หน้า ${lessonPage+1} / ${Math.ceil(stages.length/24)} • ${stages.length} ด่าน`:"ไม่มีบทเรียนในตัวกรองนี้ ลองเลือกทุกระดับ";footer.appendChild(count);
    if(lessonCategory==="basic"){const source=document.createElement("a");source.href=selectedWorld===1?"https://www.spcvedu.com/academic/thai_words_1-6/":"https://drive.google.com/file/d/1ltUGCqyQb5-jcM_LbzWPR70FOY_55pZj/view";source.target="_blank";source.rel="noopener";source.textContent="ดูเอกสารอ้างอิงคำศัพท์ (ฉบับที่ใช้ในเกม)";footer.appendChild(source);}
    list.appendChild(footer);const stars=all.reduce((sum,s)=>sum+(game.save.stageStars[s.id]||0),0);$("map-star-total").textContent=`${stars} / ${all.length*3} ดาว`;
  }
  function startBattle(stage){
    if(!stage)return;currentStage=stage;const isAR=game.mode==="ar";$("back-to-stages-button").textContent=game.mode==="story"||game.mode==="custom"?"← ย้อนกลับไปเลือกด่าน":game.mode==="practice"?"← กลับไปเลือกบทฝึก":"← กลับไปเลือกโหมด";$("screen-battle").classList.toggle("ar-mode",isAR);showScreen("battle");
    if(isAR)ar.start();else ar.stop();
    battle.start(stage);if(!game.save.tutorialSeen)showTutorial();
  }
  function startSurvival(){
    const pool=[...DH.Content.sample("shape",4),...DH.Content.sample("number",5),...DH.Content.sample("english_letter",6),...DH.Content.sample("thai_letter",6)];
    startBattle({id:"survival_session",name:"บททดสอบไร้จุดจบ",world:0,contentType:"mixed",questions:pool,enemyTypes:["goblin","skeleton","orc","shadow","ghost"],timeLimit:DH.Levels.difficulties[game.difficulty].timeLimit,enemySpeed:1.1,rewardXP:100,rewardCoins:40});
  }
  function startARBattle(){
    const pool=[...DH.Content.sample("shape",4),...DH.Content.sample("number",3),...DH.Content.sample("thai_letter",3),...DH.Content.sample("english_letter",3)];
    startBattle({id:"ar_field_session",name:"สนามเวทโลกจริง",world:0,contentType:"mixed",questions:pool,enemyTypes:["goblin","skeleton","orc","ghost"],timeLimit:DH.Levels.difficulties[game.difficulty].timeLimit,enemySpeed:.82,recognitionThreshold:DH.Levels.difficulties[game.difficulty].threshold,rewardXP:140,rewardCoins:60});
  }
  function renderPracticeTypes(){const select=$("practice-type");[{v:"thai_letter",t:"พยัญชนะไทย ก–ฮ"},{v:"thai_word",t:"คำภาษาไทย"},{v:"thai_phrase",t:"ประโยคภาษาไทย"},{v:"english_letter",t:"English A–Z"},{v:"english_lower",t:"English a–z ตัวพิมพ์เล็ก"},{v:"thai_basic",t:"บัญชีคำพื้นฐานไทย ป.1–ป.6"},{v:"english_basic",t:"คำศัพท์พื้นฐานอังกฤษ ป.1–ป.6"},{v:"math_mixed",t:"คณิตศาสตร์ — ผสม"},{v:"english_word",t:"English Words"},{v:"english_phrase",t:"English Sentences"},{v:"number",t:"ตัวเลข 1–100"},{v:"math_add",t:"คณิตศาสตร์ — บวก"},{v:"math_subtract",t:"คณิตศาสตร์ — ลบ"},{v:"math_multiply",t:"คณิตศาสตร์ — คูณ"},{v:"math_divide",t:"คณิตศาสตร์ — หาร"},{v:"shape",t:"รูปทรง"},{v:"line",t:"เส้นพื้นฐาน"},{v:"mixed",t:"ผสม"}].forEach(item=>{const option=document.createElement("option");option.value=item.v;option.textContent=item.t;select.appendChild(option);});}
  function startPractice(event){
    event.preventDefault();const type=$("practice-type").value,count=$("practice-count").value,language=$("practice-language").value,grade=$("practice-grade").value;
    let pool=type==="math_mixed"?DH.Content.questions.filter(q=>q.type.startsWith("math_")):type==="mixed"?DH.Content.questions.filter(q=>["shape","number","thai_letter","english_letter","english_lower","math_add","math_subtract"].includes(q.type)):DH.Content.byType(type);
    if(grade!=="all"&&pool.some(q=>q.grade))pool=pool.filter(q=>q.grade===Number(grade));
    const effectiveLanguage=type.startsWith("english_")?"en":type.startsWith("thai_")?"th":language;
    if(effectiveLanguage!=="any")pool=pool.filter(q=>q.language===effectiveLanguage||q.language==="symbol"||q.language==="number");if(!pool.length){toast("ยังไม่มีเนื้อหาที่ตรงกับตัวเลือกนี้");return;}
    if(type==="math_mixed")pool=pool.slice().sort(()=>Math.random()-.5);
    const ids=pool.slice(0,count==="all"?pool.length:Number(count)).map(q=>q.id);
    startBattle({id:`practice_${Date.now()}`,name:"ห้องฝึกเวท",world:0,contentType:type,questions:ids,enemyTypes:["goblin","ghost"],timeLimit:Number($("practice-time").value),practice:true,enemySpeed:.85,guideMode:$("practice-guide").value,recognitionThreshold:DH.Levels.difficulties[game.difficulty].threshold,rewardXP:0,rewardCoins:0});
  }
  function renderContent(){
    const types=[{id:"shape",name:"รูปทรง",icon:"△"},{id:"number",name:"ตัวเลข 1–100",icon:"100"},{id:"thai_letter",name:"พยัญชนะไทย ก–ฮ",icon:"ก"},{id:"english_letter",name:"English A–Z",icon:"A"},{id:"english_lower",name:"English a–z",icon:"a"},{id:"thai_basic",name:"คำพื้นฐานไทย ป.1–ป.6",icon:"คำ"},{id:"english_basic",name:"คำพื้นฐานอังกฤษ ป.1–ป.6",icon:"abc"},{id:"thai_word",name:"คำภาษาไทย",icon:"กา"},{id:"english_word",name:"English Words",icon:"CAT"},{id:"thai_phrase",name:"ประโยคภาษาไทย",icon:"ฉัน…"},{id:"english_phrase",name:"English Sentences",icon:"I…"},{id:"math_add",name:"การบวก",icon:"+"},{id:"math_subtract",name:"การลบ",icon:"−"},{id:"math_multiply",name:"การคูณ",icon:"×"},{id:"math_divide",name:"การหาร",icon:"÷"}];
    const stats=game.save.learningStats||{},ranked=types.map(type=>{const value=stats[type.id]||{attempts:0,correct:0};return Object.assign({},type,{attempts:value.attempts||0,accuracy:value.attempts?Math.round(value.correct/value.attempts*100):null});});
    const practiced=ranked.filter(item=>item.attempts);const weakest=practiced.sort((a,b)=>a.accuracy-b.accuracy)[0]||types[0];
    $("content-library").innerHTML=`<aside class="learning-recommendation"><span>✦</span><div><small>แนะนำสำหรับคุณ</small><b>ฝึก ${weakest.name} ต่อ</b><p>${practiced.length?`ความแม่นยำปัจจุบัน ${weakest.accuracy}% — ฝึกอีกเล็กน้อยจะเห็นพัฒนาการชัดขึ้น`:"เริ่มเก็บสถิติการเรียนรู้จากหมวดแรก แล้วระบบจะแนะนำให้โดยอัตโนมัติ"}</p></div></aside>`+ranked.map(type=>{const pool=DH.Content.byType(type.id);const accuracy=type.accuracy===null?"ยังไม่เริ่ม":`${type.accuracy}% แม่นยำ`;return `<article class="content-group"><h2>${type.icon} ${type.name}</h2><p class="content-count">${pool.length} รายการ • ${accuracy}</p><div class="learning-meter"><i style="width:${type.accuracy||0}%"></i></div><small class="attempt-count">ฝึกแล้ว ${type.attempts} ครั้ง</small><div class="content-examples">${pool.slice(0,8).map(q=>`<span>${q.display}</span>`).join("")}</div></article>`;}).join("");
  }
  function renderCustomStages(){
    const list=$("custom-stage-list"),packs=game.save.customPacks||[];list.innerHTML="";
    const stages=[];packs.forEach(pack=>(pack.stages||[]).forEach(stage=>stages.push({stage,pack})));if(!stages.length){list.innerHTML='<div class="empty-state"><h2>ยังไม่มีด่านสร้างเอง</h2><p>นำเข้า Content Pack หรือสร้างด่านใหม่ใน Creator</p></div>';return;}
    stages.forEach(({stage,pack})=>{const article=document.createElement("article");article.className="custom-item";article.innerHTML=`<div><small>${pack.name||"CUSTOM PACK"}</small><h3>${stage.name}</h3><p>${stage.description||"ด่านฝึกเขียนสร้างเอง"}</p></div><button class="fantasy-button primary">เล่นด่านนี้</button>`;article.querySelector("button").addEventListener("click",()=>startCustomStage(stage,pack));list.appendChild(article);});
  }
  function startCustomStage(stage,pack){const questions=(stage.questions||[]).map(item=>typeof item==="string"?(pack.questions||[]).find(q=>q.id===item)||item:item);startBattle(Object.assign({},stage,{id:stage.id||`custom_${Date.now()}`,questions,enemyTypes:stage.enemyTypes||[stage.enemyType||"goblin"]}));}
  function startCreatorPreview(){try{const raw=localStorage.getItem("drawHeroPreviewStage");if(!raw)return;const data=JSON.parse(raw);game.setMode("custom");flowActive=false;startCustomStage(data.stage,data.pack||{questions:data.questions||[]});}catch(error){toast("ไม่สามารถเปิดด่าน Preview ได้");}}
  function handleBattleFinish(result){lastResult=result;if(result.victory){const rewards=game.addRewards(result);renderResult(result,rewards);showScreen("result");}else{game.save.highScore=Math.max(game.save.highScore,result.score);game.addCharacterMastery(game.characterId,Math.max(2,result.correct));game.persist();$("gameover-score").textContent=result.score.toLocaleString();$("gameover-best").textContent=game.save.highScore.toLocaleString();$("gameover-home-button").textContent=game.mode==="practice"?"เลือกบทฝึกอื่น":game.mode==="story"||game.mode==="custom"?"เลือกด่านอื่น":"เลือกโหมดอื่น";showScreen("gameover");}updatePlayerUI();}
  function renderResult(result,rewards){$("result-stage-name").textContent=result.stageName;$("result-score").textContent=result.score.toLocaleString();$("result-accuracy").textContent=`${result.accuracy}%`;$("result-correct").textContent=result.correct;$("result-wrong").textContent=result.wrong;$("result-combo").textContent=`x${result.bestCombo}`;$("result-time").textContent=`${Math.floor(result.time/60)}:${String(result.time%60).padStart(2,"0")}`;$("result-xp").textContent=`+${result.xp} XP`;$("result-coins").textContent=`+${result.coins}`;$("result-mastery").textContent=`ความชำนาญฮีโร่ Lv.${rewards.mastery.level}`;$("result-stars").innerHTML=`${"★".repeat(result.stars)}<span class="empty">${"★".repeat(3-result.stars)}</span>`;$("next-stage-button").hidden=game.mode!=="story";$("result-map-button").textContent=game.mode==="practice"?"เลือกบทฝึกอื่น":game.mode==="story"||game.mode==="custom"?"เลือกด่านอื่น":"เลือกโหมดอื่น";}
  function nextStage(){if(!currentStage||game.mode!=="story"){returnToStages();return;}const visible=DH.Levels.forWorld(currentStage.world).filter(stage=>!stage.hiddenFromMap),index=visible.findIndex(stage=>stage.id===currentStage.id),next=visible[index+1];if(next)startBattle(next);else returnToStages();}
  function updatePlayerUI(){
    game.save=DH.Storage.load();$("player-name").textContent=game.save.playerName;$("player-level").textContent=game.save.level;$("coin-count").textContent=game.save.coins;$("gem-count").textContent=game.save.gems;const required=game.save.level*100;$("xp-fill").style.width=`${Math.min(100,game.save.xp/required*100)}%`;$("xp-text").textContent=`${game.save.xp} / ${required}`;$("total-stars").textContent=`${game.totalStars()} ดาว`;updateMissions();
  }
  function updateMissions(){const correct=Math.min(10,game.save.totalCorrect||0),stages=Math.min(1,game.save.completedStages||0),combo=Math.min(5,game.save.bestCombo||0);$("mission-correct-fill").style.width=`${correct*10}%`;$("mission-correct-text").textContent=`${correct} / 10`;$("mission-stage-fill").style.width=`${stages*100}%`;$("mission-stage-text").textContent=`${stages} / 1`;$("mission-combo-fill").style.width=`${combo*20}%`;$("mission-combo-text").textContent=`${combo} / 5`;}
  function applySettings(){const settings=game.save.settings;document.documentElement.lang=settings.language||"th";document.body.classList.toggle("reduced-motion",!!settings.reducedMotion);document.querySelectorAll("[data-i18n]").forEach(node=>{const key=node.dataset.i18n;node.textContent=(i18n[settings.language]||i18n.th)[key]||i18n.th[key]||node.textContent;});}
  function loadSettingsForm(){const s=game.save.settings;$("setting-sound").checked=s.sound;$("setting-music").checked=s.music;$("setting-effects-volume").value=s.effectsVolume;$("setting-music-volume").value=s.musicVolume;$("setting-language").value=s.language;$("setting-reduced-motion").checked=s.reducedMotion;$("setting-show-guide").checked=s.showGuide;updateVolumeLabels();}
  function saveSettings(){const s=game.save.settings;s.sound=$("setting-sound").checked;s.music=$("setting-music").checked;s.effectsVolume=Number($("setting-effects-volume").value);s.musicVolume=Number($("setting-music-volume").value);s.language=$("setting-language").value;s.reducedMotion=$("setting-reduced-motion").checked;s.showGuide=$("setting-show-guide").checked;game.persist();DH.Audio.configure(s);applySettings();updateVolumeLabels();}
  function updateVolumeLabels(){$("effects-volume-value").textContent=`${$("setting-effects-volume").value}%`;$("music-volume-value").textContent=`${$("setting-music-volume").value}%`;}
  function showTutorial(){tutorialStep=0;renderTutorial();battle.paused=true;$("pause-modal").hidden=true;$("tutorial-modal").hidden=false;}
  function renderTutorial(){const steps=[{v:"✎ → ○",t:"ดูสัญลักษณ์เหนือหัวศัตรู แล้ววาดตามบนกระดานเวทมนตร์"},{v:"☝ → ✦",t:"กด “ร่ายเวท” เพื่อให้ระบบตรวจคำตอบ"},{v:"✦ → ⚔",t:"ถ้าวาดถูก ฮีโร่จะยิงเวทโจมตีศัตรู"},{v:"♥ → ★",t:"อย่าปล่อยให้ศัตรูถึงฐาน สะสมคะแนน Combo และดาวให้ครบ!"}];$("tutorial-visual").textContent=steps[tutorialStep].v;$("tutorial-text").textContent=steps[tutorialStep].t;document.querySelectorAll(".tutorial-dots i").forEach((dot,index)=>dot.classList.toggle("active",index===tutorialStep));$("tutorial-next").textContent=tutorialStep===steps.length-1?"เริ่มต่อสู้":"ถัดไป";}
  function closeTutorial(){game.save.tutorialSeen=true;game.persist();$("tutorial-modal").hidden=true;battle.resume();}
  function returnHome(){battle.stop();ar.stop();flowActive=false;currentStage=null;$("screen-battle").classList.remove("ar-mode");$("pause-modal").hidden=true;$("tutorial-modal").hidden=true;showScreen("main");toast("กลับสู่หน้าหลักแล้ว");}
  function returnToStages(){battle.stop();ar.stop();$("screen-battle").classList.remove("ar-mode");$("pause-modal").hidden=true;if(game.mode==="story"&&currentStage){selectedWorld=currentStage.world;mapView="stages";showScreen("map");}else if(game.mode==="practice")showScreen("practice");else if(game.mode==="custom")showScreen("custom");else showScreen("modes");}
  function bindNavigation(){
    $("start-button").addEventListener("click",()=>{flowActive=true;showScreen("modes");});document.querySelectorAll("[data-nav]").forEach(button=>button.addEventListener("click",()=>{flowActive=false;const target=button.dataset.nav;if(target==="settings")loadSettingsForm();showScreen(target);}));
    document.querySelectorAll("[data-back]").forEach(button=>button.addEventListener("click",()=>showScreen(button.dataset.back)));
    $("character-prev").addEventListener("click",()=>cycleCharacter(-1));$("character-next").addEventListener("click",()=>cycleCharacter(1));$("select-character").addEventListener("click",confirmCharacter);$("confirm-difficulty").addEventListener("click",confirmDifficulty);
    $("map-back-button").addEventListener("click",()=>{if(mapView==="stages"){mapView="worlds";renderMap();}else showScreen("difficulty");});
    $("practice-form").addEventListener("submit",startPractice);$("player-profile-button").addEventListener("click",()=>{const name=prompt("ชื่อผู้เล่น",game.save.playerName);if(name&&name.trim()){game.save.playerName=name.trim().slice(0,24);game.persist();updatePlayerUI();}});
    $("quit-battle-button").addEventListener("click",returnHome);$("back-to-stages-button").addEventListener("click",returnToStages);$("restart-button").addEventListener("click",()=>{const stage=currentStage;$("pause-modal").hidden=true;if(stage)startBattle(stage);else returnHome();});
    $("tutorial-next").addEventListener("click",()=>{if(tutorialStep<3){tutorialStep+=1;renderTutorial();}else closeTutorial();});$("tutorial-skip").addEventListener("click",closeTutorial);
  }
  function bindSettings(){document.querySelectorAll("#settings-form input,#settings-form select").forEach(input=>input.addEventListener("input",saveSettings));$("reset-progress").addEventListener("click",()=>{if(confirm("คุณต้องการลบข้อมูลความก้าวหน้าทั้งหมดหรือไม่? การกระทำนี้ย้อนกลับไม่ได้")){game.save=DH.Storage.reset();game.characterId=game.save.selectedCharacter;characterIndex=0;applySettings();loadSettingsForm();updatePlayerUI();renderMap();toast("ลบข้อมูลความก้าวหน้าแล้ว");}});}
  function bindResults(){$("replay-button").addEventListener("click",()=>startBattle(currentStage));$("retry-button").addEventListener("click",()=>startBattle(currentStage));$("next-stage-button").addEventListener("click",nextStage);$("result-map-button").addEventListener("click",returnToStages);$("gameover-home-button").addEventListener("click",returnToStages);}
  function bindDepthMotion(){
    const screen=$("screen-main");if(!screen)return;
    screen.addEventListener("pointermove",event=>{if(game.save.settings.reducedMotion)return;const box=screen.getBoundingClientRect();const x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;screen.style.setProperty("--depth-near-x",`${(x*7).toFixed(2)}px`);screen.style.setProperty("--depth-near-y",`${(y*4).toFixed(2)}px`);screen.style.setProperty("--depth-far-x",`${(x*-3).toFixed(2)}px`);screen.style.setProperty("--depth-far-y",`${(y*-2).toFixed(2)}px`);});
    screen.addEventListener("pointerleave",()=>{["--depth-near-x","--depth-near-y","--depth-far-x","--depth-far-y"].forEach(name=>screen.style.setProperty(name,"0px"));});
  }

  window.DrawHeroApp={showScreen,startBattle,game,battle,toast};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
