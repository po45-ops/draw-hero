(function () {
  "use strict";
  window.DRAW_HERO_DEBUG = false;
  const DH=window.DrawHero,$=id=>document.getElementById(id),game=new DH.GameState();
  let activeScreen="splash",characterIndex=Math.max(0,DH.Characters.all.findIndex(c=>c.id===game.characterId));
  let flowActive=false,selectedWorld=1,lastResult=null,currentStage=null,toastTimer=0,tutorialStep=0;
  let modelTimer=0,modelAngle=0,modelDrag=null;
  const battle=new DH.BattleEngine(game,handleBattleFinish),ar=new DH.ARController({onStatus:message=>toast(message)});

  const i18n={
    th:{start:"เริ่มเกม",characters:"เลือกตัวละคร",modes:"โหมดการเล่น",library:"คลังเนื้อหา",missions:"ภารกิจ",creator:"ผู้สร้างด่าน",settings:"ตั้งค่า"},
    en:{start:"Start Game",characters:"Choose Hero",modes:"Game Modes",library:"Content Library",missions:"Missions",creator:"Stage Creator",settings:"Settings"}
  };
  const modeData=[
    {id:"story",name:"Story Mode",thai:"เนื้อเรื่อง",icon:"♜",color:"#37b9ff",desc:"ผจญภัยผ่าน 6 โลก ปลดล็อกด่านและสะสมดาว",tag:"6 WORLDS • PROGRESSION"},
    {id:"practice",name:"Practice Mode",thai:"โหมดฝึก",icon:"✎",color:"#55c271",desc:"เลือกเนื้อหาและฝึกเขียนได้โดยไม่มี Game Over",tag:"CUSTOM TRAINING"},
    {id:"survival",name:"Survival Mode",thai:"เอาชีวิตรอด",icon:"∞",color:"#ef8d42",desc:"ศัตรูมาเป็นคลื่น ดูว่าฮีโร่จะยืนหยัดได้นานแค่ไหน",tag:"ENDLESS WAVE"},
    {id:"boss",name:"Boss Mode",thai:"ศึกบอส",icon:"♛",color:"#e74848",desc:"ตอบหลายข้อเพื่อทำลายเกราะจอมมารแห่งความรู้",tag:"12 HP BOSS"},
    {id:"custom",name:"Custom Mode",thai:"ด่านสร้างเอง",icon:"⚒",color:"#c475ff",desc:"เล่นด่านจาก Content Pack ที่ครูสร้างหรือนำเข้า",tag:"CREATOR PACKS"},
    {id:"ar",name:"AR Camera Mode",thai:"สนามรบ AR",icon:"◎",color:"#42f5d7",desc:"ใช้กล้องมือถือเป็นสนามจริง แล้ววาดคาถาปราบศัตรูที่ปรากฏตรงหน้า",tag:"CAMERA • LIVE BATTLE"}
  ];

  function init(){
    renderParty();renderModes();renderCharacter();renderDifficulties();renderMap();renderContent();renderPracticeTypes();renderCustomStages();
    bindNavigation();bindSettings();bindResults();bindDepthMotion();updatePlayerUI();applySettings();DH.Audio.configure(game.save.settings);
    setTimeout(()=>showScreen("main"),1100);
    const params=new URLSearchParams(location.search);if(params.get("preview")==="1")setTimeout(startCreatorPreview,1250);
  }
  function showScreen(name){
    if(activeScreen==="battle"&&name!=="battle"){battle.stop();ar.stop();$("screen-battle").classList.remove("ar-mode");}
    if(name!=="characters")clearInterval(modelTimer);
    $("pause-modal").hidden=true;$("tutorial-modal").hidden=true;
    document.querySelectorAll(".screen").forEach(screen=>screen.classList.toggle("active",screen.dataset.screen===name));
    activeScreen=name;window.scrollTo(0,0);
    if(name==="main")updatePlayerUI();if(name==="characters")renderCharacter();if(name==="map")renderMap();if(name==="custom")renderCustomStages();
  }
  function toast(message){const node=$("toast");node.textContent=message;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2500);}
  function heroMarkup(character,withName=true){const sprite=Math.max(0,DH.Characters.all.findIndex(item=>item.id===character.id)),positions=[0,36,74,100];return `<div class="hero-card-figure hero-${character.id}" style="--hero:${character.color};--hero-pos:${positions[sprite]}%"><div class="hero-sprite" role="img" aria-label="${character.name} ${character.title}"></div>${withName?`<b class="hero-nameplate">${character.name}</b>`:""}</div>`;}
  function renderParty(){$("hero-party").innerHTML=DH.Characters.all.map(c=>heroMarkup(c)).join("");}
  function renderModes(){
    $("mode-grid").innerHTML="";modeData.forEach(mode=>{const button=document.createElement("button");button.className="select-card";button.style.setProperty("--card-color",mode.color);button.innerHTML=`<span class="card-icon">${mode.icon}</span><h2>${mode.thai}</h2><h3>${mode.name}</h3><p>${mode.desc}</p><small>${mode.tag}</small>`;button.addEventListener("click",()=>selectMode(mode.id));$("mode-grid").appendChild(button);});
  }
  function selectMode(id){game.setMode(id);flowActive=true;DH.Audio.play("click");showScreen("characters");}
  function renderCharacter(){
    clearInterval(modelTimer);modelAngle=0;
    const c=DH.Characters.all[characterIndex];const showcase=$("character-showcase");showcase.style.setProperty("--char-glow",`${c.color}66`);showcase.style.setProperty("--char",c.color);showcase.innerHTML=`<div class="character-runes"></div><div class="model-badge"><i></i> 3D CHARACTER • 360°</div><div class="model-stage"><button id="model-rotate-left" class="model-rotate" type="button" aria-label="หมุนตัวละครไปทางซ้าย">‹</button><div id="hero-model-sprite" class="model-sprite hero-model-sprite" style="--model-sheet:url('../${c.sprite3d}')" role="img" aria-label="โมเดล ${c.name} แบบหมุนดูรอบตัว" tabindex="0"></div><button id="model-rotate-right" class="model-rotate" type="button" aria-label="หมุนตัวละครไปทางขวา">›</button><div class="model-platform" aria-hidden="true"><i></i></div></div><div class="model-controls" aria-label="ท่าทางตัวละคร"><button type="button" data-model-pose="rotate">360°</button><button type="button" data-model-pose="idle" class="active">ยืน</button><button type="button" data-model-pose="run">วิ่ง</button><button type="button" data-model-pose="attack">โจมตี</button><button type="button" data-model-pose="skill">ปล่อยพลัง</button></div><div id="model-angle-label" class="model-angle-label">ด้านหน้า • ลากเพื่อหมุน</div><div class="character-thumbnails" aria-label="ตัวละครทั้งหมด"></div>`;
    const thumbnails=showcase.querySelector(".character-thumbnails"),positions=[0,36,74,100];DH.Characters.all.forEach((character,index)=>{const button=document.createElement("button");button.className=index===characterIndex?"active":"";button.style.setProperty("--hero-pos",`${positions[index]}%`);button.style.setProperty("--hero",character.color);button.setAttribute("aria-label",`เลือก ${character.name}`);button.innerHTML='<i class="hero-sprite"></i><small>'+character.name+'</small>';button.addEventListener("click",()=>{characterIndex=index;renderCharacter();});thumbnails.appendChild(button);});
    bindModelViewer();
    const skill=DH.Skills.get(c.skill);$("character-info").style.setProperty("--char",c.color);$("character-info").innerHTML=`<small class="class-tag">${c.class.toUpperCase()} • LEVEL ${c.level}</small><h2>${c.name}</h2><h3>${c.title}</h3><p>${c.description}</p><div class="stat-row"><span>POWER</span><i style="width:${c.stats.power}%"></i></div><div class="stat-row"><span>SPEED</span><i style="width:${c.stats.speed}%"></i></div><div class="stat-row"><span>MAGIC</span><i style="width:${c.stats.magic}%"></i></div><div class="ability"><b>${c.passive}</b><small>PASSIVE SKILL</small></div><div class="ability"><b>${skill.name}</b><small>${skill.description||"ULTIMATE SKILL"}</small></div>`;
    $("select-character").textContent=game.characterId===c.id?`เลือกแล้ว • ${c.name}`:`เลือก ${c.name}`;
  }
  function bindModelViewer(){
    const sprite=$("hero-model-sprite"),label=$("model-angle-label");if(!sprite)return;
    const angleNames=["ด้านหน้า","เฉียงขวา","ด้านขวา","เฉียงหลังขวา","ด้านหลัง","เฉียงหลังซ้าย","ด้านซ้าย","เฉียงซ้าย"];
    const poseFrames={idle:[8,9],run:[10,11],attack:[12,13],skill:[14,15]};
    const setFrame=frame=>{const column=frame%4,row=Math.floor(frame/4);sprite.style.setProperty("--frame-x",`${column*100/3}%`);sprite.style.setProperty("--frame-y",`${row*100/3}%`);};
    const setActive=pose=>document.querySelectorAll("[data-model-pose]").forEach(button=>button.classList.toggle("active",button.dataset.modelPose===pose));
    const rotate=direction=>{clearInterval(modelTimer);modelAngle=(modelAngle+direction+8)%8;setFrame(modelAngle);setActive("rotate");label.textContent=`${angleNames[modelAngle]} • ลากเพื่อหมุน`;sprite.classList.add("is-turning");setTimeout(()=>sprite.classList.remove("is-turning"),180);};
    const playPose=pose=>{clearInterval(modelTimer);if(pose==="rotate"){setFrame(modelAngle);setActive(pose);label.textContent=`${angleNames[modelAngle]} • ลากเพื่อหมุน`;return;}const frames=poseFrames[pose]||poseFrames.idle;let index=0;setFrame(frames[0]);setActive(pose);label.textContent={idle:"ท่ายืนพร้อมรบ",run:"ท่าเคลื่อนที่",attack:"ท่าโจมตี / ฟาดฟัน",skill:"ท่ารวมพลัง / ปล่อยสกิล"}[pose];modelTimer=setInterval(()=>{index=(index+1)%frames.length;setFrame(frames[index]);},pose==="skill"?520:pose==="attack"?330:460);};
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
    const grid=$("difficulty-grid");grid.innerHTML="";Object.values(DH.Levels.difficulties).forEach(d=>{const button=document.createElement("button");button.className="select-card difficulty-card";button.style.setProperty("--card-color",d.color);button.innerHTML=`<span class="difficulty-gem">${d.icon}</span><h2>${d.label}</h2><h3>${d.thai}</h3><ul><li>เวลา ${d.timeLimit} วินาที</li><li>ความเร็วศัตรู ${d.speed}x</li><li>เกณฑ์ตรวจ ${d.threshold}%</li><li>ศัตรูพร้อมกัน ${d.simultaneous}</li></ul><small>เลือกความยาก</small>`;button.addEventListener("click",()=>selectDifficulty(d.id));grid.appendChild(button);});
  }
  function selectDifficulty(id){game.setDifficulty(id);DH.Audio.play("click");if(game.mode==="story")showScreen("map");else if(game.mode==="practice")showScreen("practice");else if(game.mode==="custom")showScreen("custom");else if(game.mode==="boss")startBattle(DH.Levels.get("world6_boss"));else if(game.mode==="ar")startARBattle();else startSurvival();}
  function renderMap(){
    const map=$("world-map");map.innerHTML="";DH.Levels.worlds.forEach(world=>{const unlocked=world.id<=Math.max(1,game.save.worldProgress||1);const node=document.createElement("article");node.className=`world-node${selectedWorld===world.id?" active":""}${unlocked?"":" locked"}`;node.style.setProperty("--world-color",world.color);const stars=DH.Levels.forWorld(world.id).reduce((sum,stage)=>sum+(game.save.stageStars[stage.id]||0),0);node.innerHTML=`<button aria-label="${world.name}" ${unlocked?"":"disabled"}>${unlocked?world.icon:"⌧"}</button><h3>World ${world.id} — ${world.name}</h3><small>★ ${stars} / ${DH.Levels.forWorld(world.id).length*3}</small>`;if(unlocked)node.querySelector("button").addEventListener("click",()=>{selectedWorld=world.id;renderMap();});map.appendChild(node);});
    $("map-star-total").textContent=game.totalStars();renderStages();
  }
  function renderStages(){const list=$("stage-list");list.innerHTML="";DH.Levels.forWorld(selectedWorld).forEach(stage=>{const stars=game.save.stageStars[stage.id]||0;const button=document.createElement("button");button.className="stage-card";button.innerHTML=`<small>STAGE ${stage.world}-${stage.level}</small><h3>${stage.name}</h3><p>${stage.description}</p><span class="stage-stars">${"★".repeat(stars)}${"☆".repeat(3-stars)}</span>`;button.addEventListener("click",()=>startBattle(stage));list.appendChild(button);});}
  function startBattle(stage){
    if(!stage)return;currentStage=stage;const isAR=game.mode==="ar";$("screen-battle").classList.toggle("ar-mode",isAR);showScreen("battle");
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
  function renderPracticeTypes(){const select=$("practice-type");[{v:"thai_letter",t:"พยัญชนะไทย"},{v:"thai_word",t:"คำภาษาไทย"},{v:"english_letter",t:"English A–Z"},{v:"english_word",t:"English Words"},{v:"number",t:"ตัวเลข 0–9"},{v:"shape",t:"รูปทรง"},{v:"line",t:"เส้นพื้นฐาน"},{v:"mixed",t:"ผสม"}].forEach(item=>{const option=document.createElement("option");option.value=item.v;option.textContent=item.t;select.appendChild(option);});}
  function startPractice(event){
    event.preventDefault();const type=$("practice-type").value,count=Number($("practice-count").value),language=$("practice-language").value;
    let pool=type==="mixed"?DH.Content.questions.filter(q=>["shape","number","thai_letter","english_letter"].includes(q.type)):DH.Content.byType(type);
    if(language!=="any")pool=pool.filter(q=>q.language===language||q.language==="symbol"||q.language==="number");if(!pool.length){toast("ยังไม่มีเนื้อหาที่ตรงกับตัวเลือกนี้");return;}
    const ids=Array.from({length:Math.min(count,60)},(_,i)=>pool[i%pool.length].id);
    startBattle({id:`practice_${Date.now()}`,name:"ห้องฝึกเวท",world:0,contentType:type,questions:ids,enemyTypes:["goblin","ghost"],timeLimit:Number($("practice-time").value)||999,enemySpeed:.85,guideMode:$("practice-guide").value,recognitionThreshold:DH.Levels.difficulties[game.difficulty].threshold,rewardXP:0,rewardCoins:0});
  }
  function renderContent(){
    const types=[{id:"shape",name:"รูปทรง",icon:"△"},{id:"number",name:"ตัวเลข",icon:"5"},{id:"thai_letter",name:"พยัญชนะไทย",icon:"ก"},{id:"english_letter",name:"English Letters",icon:"A"},{id:"thai_word",name:"คำภาษาไทย",icon:"แมว"},{id:"english_word",name:"English Words",icon:"cat"},{id:"thai_phrase",name:"วลีภาษาไทย",icon:"ฉัน..."},{id:"english_phrase",name:"English Phrases",icon:"I..."}];
    $("content-library").innerHTML=types.map(type=>{const pool=DH.Content.byType(type.id);return `<article class="content-group"><h2>${type.icon} ${type.name}</h2><p class="content-count">${pool.length} รายการ</p><div class="content-examples">${pool.slice(0,8).map(q=>`<span>${q.display}</span>`).join("")}</div></article>`;}).join("");
  }
  function renderCustomStages(){
    const list=$("custom-stage-list"),packs=game.save.customPacks||[];list.innerHTML="";
    const stages=[];packs.forEach(pack=>(pack.stages||[]).forEach(stage=>stages.push({stage,pack})));if(!stages.length){list.innerHTML='<div class="empty-state"><h2>ยังไม่มีด่านสร้างเอง</h2><p>นำเข้า Content Pack หรือสร้างด่านใหม่ใน Creator</p></div>';return;}
    stages.forEach(({stage,pack})=>{const article=document.createElement("article");article.className="custom-item";article.innerHTML=`<div><small>${pack.name||"CUSTOM PACK"}</small><h3>${stage.name}</h3><p>${stage.description||"ด่านฝึกเขียนสร้างเอง"}</p></div><button class="fantasy-button primary">เล่นด่านนี้</button>`;article.querySelector("button").addEventListener("click",()=>startCustomStage(stage,pack));list.appendChild(article);});
  }
  function startCustomStage(stage,pack){const questions=(stage.questions||[]).map(item=>typeof item==="string"?(pack.questions||[]).find(q=>q.id===item)||item:item);startBattle(Object.assign({},stage,{id:stage.id||`custom_${Date.now()}`,questions,enemyTypes:stage.enemyTypes||[stage.enemyType||"goblin"]}));}
  function startCreatorPreview(){try{const raw=localStorage.getItem("drawHeroPreviewStage");if(!raw)return;const data=JSON.parse(raw);game.setMode("custom");flowActive=false;startCustomStage(data.stage,data.pack||{questions:data.questions||[]});}catch(error){toast("ไม่สามารถเปิดด่าน Preview ได้");}}
  function handleBattleFinish(result){lastResult=result;if(result.victory){game.addRewards(result);renderResult(result);showScreen("result");}else{game.save.highScore=Math.max(game.save.highScore,result.score);game.persist();$("gameover-score").textContent=result.score.toLocaleString();$("gameover-best").textContent=game.save.highScore.toLocaleString();showScreen("gameover");}updatePlayerUI();}
  function renderResult(result){$("result-stage-name").textContent=result.stageName;$("result-score").textContent=result.score.toLocaleString();$("result-accuracy").textContent=`${result.accuracy}%`;$("result-correct").textContent=result.correct;$("result-wrong").textContent=result.wrong;$("result-combo").textContent=`x${result.bestCombo}`;$("result-time").textContent=`${Math.floor(result.time/60)}:${String(result.time%60).padStart(2,"0")}`;$("result-xp").textContent=`+${result.xp} XP`;$("result-coins").textContent=`+${result.coins}`;$("result-stars").innerHTML=`${"★".repeat(result.stars)}<span class="empty">${"★".repeat(3-result.stars)}</span>`;$("next-stage-button").hidden=game.mode!=="story";}
  function nextStage(){if(!currentStage){showScreen("map");return;}const index=DH.Levels.levels.findIndex(stage=>stage.id===currentStage.id);const next=DH.Levels.levels[index+1];if(next)startBattle(next);else showScreen("map");}
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
  function bindNavigation(){
    $("start-button").addEventListener("click",()=>{flowActive=true;showScreen("modes");});document.querySelectorAll("[data-nav]").forEach(button=>button.addEventListener("click",()=>{flowActive=false;const target=button.dataset.nav;if(target==="settings")loadSettingsForm();showScreen(target);}));
    document.querySelectorAll("[data-back]").forEach(button=>button.addEventListener("click",()=>showScreen(button.dataset.back)));
    $("character-prev").addEventListener("click",()=>cycleCharacter(-1));$("character-next").addEventListener("click",()=>cycleCharacter(1));$("select-character").addEventListener("click",confirmCharacter);
    $("practice-form").addEventListener("submit",startPractice);$("player-profile-button").addEventListener("click",()=>{const name=prompt("ชื่อผู้เล่น",game.save.playerName);if(name&&name.trim()){game.save.playerName=name.trim().slice(0,24);game.persist();updatePlayerUI();}});
    $("quit-battle-button").addEventListener("click",returnHome);$("restart-button").addEventListener("click",()=>{const stage=currentStage;$("pause-modal").hidden=true;if(stage)startBattle(stage);else returnHome();});
    $("tutorial-next").addEventListener("click",()=>{if(tutorialStep<3){tutorialStep+=1;renderTutorial();}else closeTutorial();});$("tutorial-skip").addEventListener("click",closeTutorial);
  }
  function bindSettings(){document.querySelectorAll("#settings-form input,#settings-form select").forEach(input=>input.addEventListener("input",saveSettings));$("reset-progress").addEventListener("click",()=>{if(confirm("คุณต้องการลบข้อมูลความก้าวหน้าทั้งหมดหรือไม่? การกระทำนี้ย้อนกลับไม่ได้")){game.save=DH.Storage.reset();game.characterId=game.save.selectedCharacter;characterIndex=0;applySettings();loadSettingsForm();updatePlayerUI();renderMap();toast("ลบข้อมูลความก้าวหน้าแล้ว");}});}
  function bindResults(){$("replay-button").addEventListener("click",()=>startBattle(currentStage));$("retry-button").addEventListener("click",()=>startBattle(currentStage));$("next-stage-button").addEventListener("click",nextStage);$("result-map-button").addEventListener("click",()=>showScreen(game.mode==="story"?"map":"main"));$("gameover-home-button").addEventListener("click",()=>showScreen("main"));}
  function bindDepthMotion(){
    const screen=$("screen-main");if(!screen)return;
    screen.addEventListener("pointermove",event=>{if(game.save.settings.reducedMotion)return;const box=screen.getBoundingClientRect();const x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;screen.style.setProperty("--depth-near-x",`${(x*7).toFixed(2)}px`);screen.style.setProperty("--depth-near-y",`${(y*4).toFixed(2)}px`);screen.style.setProperty("--depth-far-x",`${(x*-3).toFixed(2)}px`);screen.style.setProperty("--depth-far-y",`${(y*-2).toFixed(2)}px`);});
    screen.addEventListener("pointerleave",()=>{["--depth-near-x","--depth-near-y","--depth-far-x","--depth-far-y"].forEach(name=>screen.style.setProperty(name,"0px"));});
  }

  window.DrawHeroApp={showScreen,startBattle,game,battle,toast};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
