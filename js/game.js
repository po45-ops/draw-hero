(function () {
  "use strict";
  class GameState {
    constructor(){
      this.save=window.DrawHero.Storage.load();
      this.mode="story";this.difficulty="easy";this.characterId=this.save.selectedCharacter||"es";
      this.currentStage=null;this.currentWorld=1;
    }
    setCharacter(id){this.characterId=id;this.save.selectedCharacter=id;this.persist();}
    setDifficulty(id){this.difficulty=id;}
    setMode(id){this.mode=id;}
    persist(){this.save=window.DrawHero.Storage.save(this.save);}
    addRewards(result){
      const oldLevel=this.save.level;this.save.xp+=result.xp;this.save.coins+=result.coins;
      while(this.save.xp>=this.save.level*100){this.save.xp-=this.save.level*100;this.save.level+=1;}
      this.save.highScore=Math.max(this.save.highScore,result.score);
      this.save.totalCorrect=(this.save.totalCorrect||0)+result.correct;
      this.save.bestCombo=Math.max(this.save.bestCombo||0,result.bestCombo);
      if(result.victory&&this.mode!=="practice"){
        const previous=this.save.stageStars[result.stageId]||0;
        this.save.stageStars[result.stageId]=Math.max(previous,result.stars);
        if(!previous)this.save.completedStages=(this.save.completedStages||0)+1;
        const stage=window.DrawHero.Levels.get(result.stageId);
        if(stage)this.save.worldProgress=Math.max(this.save.worldProgress,Math.min(6,stage.world+(result.stars>0?1:0)));
      }
      this.persist();return {leveledUp:this.save.level>oldLevel,level:this.save.level};
    }
    totalStars(){return Object.values(this.save.stageStars||{}).reduce((sum,value)=>sum+(Number(value)||0),0);}
  }
  window.DrawHero.GameState = GameState;
})();
