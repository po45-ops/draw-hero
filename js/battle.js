(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  class BattleEngine {
    constructor(game,onFinish){
      this.game=game;this.onFinish=onFinish;this.running=false;this.paused=false;this.raf=0;this.lastTime=0;this.heroActionTimer=0;this.pendingTimers=new Set();
      this.board=null;this.stage=null;this.enemies=[];this.questions=[];this.questionCursor=0;this.slotIndex=0;
      this.hp=3;this.score=0;this.combo=0;this.bestCombo=0;this.correct=0;this.wrong=0;this.accuracyTotal=0;this.skillGauge=0;
      this.timeLeft=0;this.questionTime=0;this.startTime=0;this.slowUntil=0;this.freezeUntil=0;this.hintUsed=false;this.completedQuestions=0;
      this.boundLoop=this.loop.bind(this);this.bindControls();
    }
    bindControls(){
      $("cast-spell").addEventListener("click",()=>this.cast());
      $("clear-drawing").addEventListener("click",()=>this.board&&this.board.clear());
      $("undo-drawing").addEventListener("click",()=>this.board&&this.board.undo());
      $("redo-drawing").addEventListener("click",()=>this.board&&this.board.redo());
      $("pen-tool").addEventListener("click",()=>this.selectTool("pen"));
      $("eraser-tool").addEventListener("click",()=>this.selectTool("eraser"));
      $("stroke-width").addEventListener("input",event=>this.board&&this.board.setWidth(event.target.value));
      $("hint-button").addEventListener("click",()=>this.showHint());
      $("skill-button").addEventListener("click",()=>this.useSkill());
      $("pause-button").addEventListener("click",()=>this.pause());
      $("resume-button").addEventListener("click",()=>this.resume());
    }
    selectTool(tool){if(!this.board)return;this.board.setTool(tool);$("pen-tool").classList.toggle("active",tool==="pen");$("eraser-tool").classList.toggle("active",tool==="eraser");}
    prepareStage(stage){
      const difficulty=window.DrawHero.Levels.difficulties[this.game.difficulty]||window.DrawHero.Levels.difficulties.easy;
      const merged=Object.assign({},stage);
      merged.timeLimit=Number(stage.timeLimit)||difficulty.timeLimit;
      merged.enemySpeed=(Number(stage.enemySpeed)||1)*difficulty.speed;
      merged.recognitionThreshold=Number(stage.recognitionThreshold)||difficulty.threshold;
      merged.guideMode=stage.guideMode||difficulty.guideMode;
      merged.simultaneous=difficulty.simultaneous;
      return merged;
    }
    start(stage){
      this.stop();this.stage=this.prepareStage(stage);this.game.currentStage=stage;
      this.questions=(stage.questions||[]).map(window.DrawHero.Content.resolve).filter(Boolean);
      if(!this.questions.length)this.questions=[window.DrawHero.Content.byType("shape")[0]];
      this.questionCursor=0;this.slotIndex=0;this.enemies=[];this.hp=window.DrawHero.Characters.get(this.game.characterId).hp||3;
      this.score=0;this.combo=0;this.bestCombo=0;this.correct=0;this.wrong=0;this.accuracyTotal=0;this.skillGauge=0;this.completedQuestions=0;
      this.startTime=performance.now();this.slowUntil=0;this.freezeUntil=0;this.hintUsed=false;
      this.renderPlayer();this.updateHud();this.initBoard();this.spawnEnemies();this.setQuestion();
      this.running=true;this.paused=false;this.lastTime=performance.now();this.raf=requestAnimationFrame(this.boundLoop);
      window.DrawHero.Audio.play("click");
    }
    initBoard(){
      if(this.board)this.board.destroy();
      this.board=new window.DrawHero.DrawingBoard($("drawing-canvas"),{onStart:()=>window.DrawHero.Audio.ensure()});
      this.board.setWidth($("stroke-width").value);this.selectTool("pen");
    }
    renderPlayer(){
      const character=window.DrawHero.Characters.get(this.game.characterId);
      $("player-unit").innerHTML=this.heroMarkup(character,false);
      const skill=window.DrawHero.Skills.get(character.skill);$("skill-name").textContent=skill.name;$("skill-icon").textContent=skill.icon;
    }
    heroMarkup(character,withName){return `<div class="model-sprite hero-combat-model pose-idle" style="--model-sheet:url('../${character.sprite3d}');--hero:${character.color}" role="img" aria-label="${character.name}"></div>${withName?`<b class="hero-nameplate">${character.name}</b>`:""}`;}
    playHeroAction(action,duration=700){
      const sprite=$("player-unit").querySelector(".hero-combat-model");if(!sprite)return;
      clearTimeout(this.heroActionTimer);sprite.classList.remove("pose-idle","pose-run","pose-attack","pose-skill");void sprite.offsetWidth;sprite.classList.add(`pose-${action}`);
      this.heroActionTimer=setTimeout(()=>{sprite.classList.remove("pose-run","pose-attack","pose-skill");sprite.classList.add("pose-idle");},duration);
    }
    spawnEnemies(){
      const layer=$("enemy-layer");layer.innerHTML="";this.enemies=[];
      const count=this.stage.boss?1:Math.min(this.stage.simultaneous||1,Math.max(1,this.questions.length));
      for(let i=0;i<count;i+=1)this.addEnemy(i);
    }
    addEnemy(index){
      const type=this.stage.enemyTypes[index%this.stage.enemyTypes.length]||"goblin";
      const data=window.DrawHero.Enemies.get(type);if(this.stage.boss){data.hp=Math.max(data.hp,this.questions.length);data.boss=true;}
      const element=document.createElement("div");element.className=`enemy-unit${data.boss?" boss":""}`;element.style.setProperty("--enemy",data.color);
      const question=this.questions[(this.questionCursor+index)%this.questions.length];
      element.innerHTML=`<div class="target-bubble">${this.escape(question.display)}</div><div class="model-sprite enemy-3d-sprite pose-run" style="--model-sheet:url('../${data.sprite3d}')" role="img" aria-label="${data.name}"></div><div class="enemy-hp"><i></i></div>`;
      $("enemy-layer").appendChild(element);
      const enemy={data,element,hp:data.hp,maxHp:data.hp,distance:100+index*13,question};this.enemies.push(enemy);this.positionEnemy(enemy);
    }
    escape(value){const node=document.createElement("span");node.textContent=String(value);return node.innerHTML;}
    activeEnemy(){return this.enemies[0]||null;}
    currentQuestion(){const enemy=this.activeEnemy();return enemy?enemy.question:this.questions[this.questionCursor%this.questions.length];}
    splitAnswer(answer){return Array.from(String(answer)).filter(char=>char!==" ");}
    currentCharacter(){const chars=this.splitAnswer(this.currentQuestion().answer);return chars[Math.min(this.slotIndex,chars.length-1)]||String(this.currentQuestion().answer);}
    setQuestion(){
      const q=this.currentQuestion();if(!q)return;
      this.slotIndex=0;this.questionTime=Number(q.timeLimit)||this.stage.timeLimit;this.timeLeft=this.questionTime;
      $("target-display").textContent=q.display;$("target-hint").textContent=q.hint||"วาดตามโจทย์";
      this.renderSlots();this.applyGuide();this.updateEnemyBubbles();this.updateHud();
    }
    renderSlots(){
      const chars=this.splitAnswer(this.currentQuestion().answer),container=$("character-slots");container.innerHTML="";
      if(chars.length<=1)return;
      chars.forEach((char,index)=>{const span=document.createElement("span");span.textContent=char;span.className=index<this.slotIndex?"done":index===this.slotIndex?"current":"";container.appendChild(span);});
    }
    applyGuide(){
      const question=this.currentQuestion(),difficulty=window.DrawHero.Levels.difficulties[this.game.difficulty];
      let guide=(this.game.save.settings.showGuide===false)?"none":(question.guideMode||this.stage.guideMode||difficulty.guideMode);
      if(this.game.mode==="practice"&&this.stage.guideMode)guide=this.stage.guideMode;
      this.board.setGuide(this.currentCharacter(),guide);
    }
    updateEnemyBubbles(){this.enemies.forEach((enemy,index)=>{const q=index===0?this.currentQuestion():enemy.question;const bubble=enemy.element.querySelector(".target-bubble");if(bubble)bubble.textContent=q.display;});}
    cast(){
      if(!this.running||this.paused||!this.board||!this.board.hasDrawing()){this.message("วาดคำตอบก่อนนะ!","warn");return;}
      const question=this.currentQuestion(),target=this.currentCharacter();
      const mode=(question.recognitionMode||this.stage.contentType)==="geometry"?"geometry":"raster";
      const result=window.DrawHero.Recognizer.recognize({mode,strokes:this.board.strokes,canvas:this.board.exportInkCanvas(),target,options:{}});
      const difficulty=window.DrawHero.Levels.difficulties[this.game.difficulty];
      let threshold=Number(question.threshold)||Number(this.stage.recognitionThreshold)||difficulty.threshold;
      if(this.game.difficulty==="easy")threshold=Math.min(threshold,48);
      $("accuracy-fill").style.width=`${result.score}%`;$("accuracy-value").textContent=`${result.score}%`;
      if(window.DRAW_HERO_DEBUG){$("debug-panel").hidden=false;$("debug-panel").textContent=`score ${result.score} / ${threshold} • ${question.id} • ${JSON.stringify(result.details)}`;}
      if(result.score>=threshold)this.correctAnswer(result.score);else this.wrongAnswer(result.score);
    }
    correctAnswer(accuracy){
      this.correct+=1;this.combo+=1;this.bestCombo=Math.max(this.bestCombo,this.combo);this.accuracyTotal+=accuracy;
      this.skillGauge=Math.min(100,this.skillGauge+22);this.board.clear();
      const chars=this.splitAnswer(this.currentQuestion().answer);
      if(this.slotIndex<chars.length-1){this.slotIndex+=1;this.timeLeft=Math.max(3,this.timeLeft);this.renderSlots();this.applyGuide();this.message(accuracy>82?"PERFECT!":"GOOD!");window.DrawHero.Audio.play("success");this.updateHud();return;}
      this.completedQuestions+=1;
      const diff=window.DrawHero.Levels.difficulties[this.game.difficulty];const fast=this.questionTime?this.timeLeft/this.questionTime:1;
      const comboBonus=1+Math.min(this.combo,10)*.1;const gained=Math.round((this.currentQuestion().reward||100)*(diff.scoreMultiplier||1)*comboBonus+fast*50+accuracy*.5);
      this.score+=gained;this.attackEnemy(1,gained);this.message(this.combo>=5?`COMBO x${this.combo}!`:(accuracy>82?"PERFECT!":"GOOD!"));
      window.DrawHero.Audio.play("spell");this.advanceAfterHit();
    }
    wrongAnswer(score){this.wrong+=1;this.combo=0;this.message(score>0?`ลองอีกครั้ง! ${score}%`:"ยังไม่มีเส้นเวท");window.DrawHero.Audio.play("wrong");this.updateHud();}
    attackEnemy(damage,score,animate=true){
      const enemy=this.activeEnemy();if(!enemy)return;if(animate)this.playHeroAction("attack",720);enemy.hp=Math.max(0,enemy.hp-damage);enemy.element.querySelector(".enemy-hp i").style.width=`${enemy.hp/enemy.maxHp*100}%`;enemy.element.classList.remove("hit");void enemy.element.offsetWidth;enemy.element.classList.add("hit");
      const projectile=document.createElement("i");projectile.className="projectile";projectile.style.setProperty("--target-x",`${Math.max(20,enemy.distance)}%`);$("projectile-layer").appendChild(projectile);setTimeout(()=>projectile.remove(),650);
      const floating=document.createElement("b");floating.className="floating-damage";floating.textContent=`-${damage}  +${score}`;floating.style.left=`${enemy.distance}%`;floating.style.bottom="48%";$("projectile-layer").appendChild(floating);setTimeout(()=>floating.remove(),900);
      if(enemy.hp<=0){enemy.element.classList.add("defeated");setTimeout(()=>{enemy.element.remove();},650);this.enemies.shift();}
    }
    advanceAfterHit(){
      const enemy=this.activeEnemy();
      if(!enemy){
        this.questionCursor+=1;
        if(this.questionCursor>=this.questions.length){setTimeout(()=>this.finish(true),650);return;}
        this.addEnemy(0);
      } else {
        this.questionCursor+=1;
        if(this.stage.boss)enemy.question=this.questions[this.questionCursor%this.questions.length];
        else if(!this.stage.boss)enemy.question=this.questions[this.questionCursor%this.questions.length];
      }
      if(this.questionCursor>=this.questions.length&&!this.stage.boss){setTimeout(()=>this.finish(true),650);return;}
      this.setQuestion();
    }
    showHint(){
      if(!this.running||this.paused)return;
      const unlimited=this.game.mode==="practice"||this.game.characterId==="mimi";
      if(this.hintUsed&&!unlimited){this.message("ใช้คำใบ้ของ Wave นี้แล้ว");return;}
      this.hintUsed=true;this.board.setGuide(this.currentCharacter(),"full");$("hint-count").textContent=unlimited?"ไม่จำกัด":"ใช้แล้ว";this.message(this.currentQuestion().hint||`เขียน ${this.currentCharacter()}`);
    }
    useSkill(){
      if(this.skillGauge<100){this.message(`พลังสกิล ${Math.round(this.skillGauge)}%`);return;}
      const skill=window.DrawHero.Skills.get(window.DrawHero.Characters.get(this.game.characterId).skill);this.skillGauge=0;this.playHeroAction("skill",1100);$("battlefield").classList.remove("skill-burst");void $("battlefield").offsetWidth;$("battlefield").classList.add("skill-burst");
      if(skill.type==="destroyAll"){
        this.enemies.slice().forEach(enemy=>{if(!enemy.data.boss){enemy.hp=0;enemy.element.classList.add("defeated");setTimeout(()=>enemy.element.remove(),600);}});
        this.enemies=this.enemies.filter(enemy=>enemy.data.boss);if(!this.enemies.length){this.questionCursor=Math.min(this.questions.length-1,this.questionCursor+1);this.addEnemy(0);this.setQuestion();}
      } else if(skill.type==="damage")this.attackEnemy(skill.value||3,0,false);
      else if(skill.type==="slow")this.slowUntil=performance.now()+(skill.duration||5000);
      else if(skill.type==="freeze")this.freezeUntil=performance.now()+(skill.duration||5000);
      this.message(skill.name);window.DrawHero.Audio.play("spell");this.updateHud();
    }
    loop(now){
      if(!this.running)return;const delta=Math.min(.05,(now-this.lastTime)/1000||0);this.lastTime=now;
      if(!this.paused){
        const frozen=now<this.freezeUntil;
        const slow=now<this.slowUntil ? .45 : 1;
        if(!frozen){
          this.timeLeft=Math.max(0,this.timeLeft-delta);
          this.enemies.slice().forEach(enemy=>{let phase=1;if(enemy.data.boss&&enemy.hp<enemy.maxHp*.5)phase=1.35;enemy.distance-=delta*2.25*this.stage.enemySpeed*enemy.data.speed*slow*phase;this.positionEnemy(enemy);if(enemy.distance<=8)this.enemyReached(enemy);});
        }
        if(this.timeLeft<=0){this.wrong+=1;this.combo=0;this.timeLeft=this.questionTime;this.message("หมดเวลา — รีบวาดใหม่!");window.DrawHero.Audio.play("wrong");}
        this.updateTimer();
      }
      this.raf=requestAnimationFrame(this.boundLoop);
    }
    positionEnemy(enemy){enemy.element.style.left=`${Math.max(8,Math.min(96,enemy.distance))}%`;}
    enemyReached(enemy){
      if(enemy.attacking)return;enemy.attacking=true;const index=this.enemies.indexOf(enemy);if(index>=0)this.enemies.splice(index,1);
      const sprite=enemy.element.querySelector(".enemy-3d-sprite");if(sprite){sprite.classList.remove("pose-run");sprite.classList.add("pose-attack");}enemy.element.classList.add("enemy-strike");
      const timer=setTimeout(()=>{this.pendingTimers.delete(timer);enemy.element.remove();if(!this.running)return;this.combo=0;this.wrong+=1;$("player-unit").classList.remove("player-hit");void $("player-unit").offsetWidth;$("player-unit").classList.add("player-hit");
        if(this.game.mode!=="practice")this.hp=Math.max(0,this.hp-1);this.message(this.game.mode==="practice"?"ลองตัวต่อไปนะ":"เสียหัวใจ 1 ดวง");
        if(this.hp<=0&&this.game.mode!=="practice"){this.finish(false);return;}
        if(this.questionCursor<this.questions.length)this.addEnemy(0);this.setQuestion();this.updateHud();
      },420);this.pendingTimers.add(timer);
    }
    updateTimer(){const pct=this.questionTime?Math.max(0,this.timeLeft/this.questionTime):1;$("battle-timer").textContent=this.questionTime?Math.ceil(this.timeLeft):"∞";$("timer-ring").style.strokeDashoffset=String(113*(1-pct));}
    updateHud(){
      $("battle-world").textContent=this.game.mode.toUpperCase();$("battle-stage-name").textContent=this.stage.name;
      $("battle-hearts").textContent=this.game.mode==="practice"?"∞":Array.from({length:Math.max(0,this.hp)},()=>"♥").join(" ");
      $("battle-score").textContent=this.score.toLocaleString();$("battle-combo").textContent=`x${this.combo}`;
      $("battle-wave").textContent=`${Math.min(this.completedQuestions+1,this.questions.length)}/${this.questions.length}`;
      $("skill-fill").style.width=`${this.skillGauge}%`;this.updateTimer();
    }
    message(text){const box=$("battle-message");box.textContent=text;box.classList.remove("pop");void box.offsetWidth;box.classList.add("pop");}
    pause(){if(!this.running)return;this.paused=true;$("pause-modal").hidden=false;}
    resume(){if(!this.running)return;$("pause-modal").hidden=true;this.paused=false;this.lastTime=performance.now();}
    finish(victory){
      if(!this.running)return;this.running=false;cancelAnimationFrame(this.raf);$("pause-modal").hidden=true;
      const elapsed=Math.max(1,Math.round((performance.now()-this.startTime)/1000));const accuracy=this.correct?Math.round(this.accuracyTotal/this.correct):0;
      const ratio=this.correct/Math.max(1,this.correct+this.wrong);const stars=ratio>=.9?3:ratio>=.65?2:1;
      const result={victory,stageId:this.stage.id,stageName:this.stage.name,score:this.score,accuracy,correct:this.correct,wrong:this.wrong,bestCombo:this.bestCombo,time:elapsed,stars:victory?stars:0,xp:victory?(this.stage.rewardXP||50):0,coins:victory?(this.stage.rewardCoins||20):0};
      if(victory)window.DrawHero.Audio.play("victory");if(this.onFinish)this.onFinish(result);
    }
    stop(){this.running=false;this.paused=false;cancelAnimationFrame(this.raf);clearTimeout(this.heroActionTimer);this.pendingTimers.forEach(timer=>clearTimeout(timer));this.pendingTimers.clear();this.enemies=[];if($("enemy-layer"))$("enemy-layer").innerHTML="";if($("projectile-layer"))$("projectile-layer").innerHTML="";if($("pause-modal"))$("pause-modal").hidden=true;if($("tutorial-modal"))$("tutorial-modal").hidden=true;if($("battlefield"))$("battlefield").classList.remove("skill-burst");if(this.board){this.board.destroy();this.board=null;}}
  }
  window.DrawHero.BattleEngine=BattleEngine;
})();
