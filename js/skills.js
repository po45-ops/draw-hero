(function () {
  "use strict";
  const skills = {
    arcaneTime:{ id:"arcaneTime", name:"Magic Burst", icon:"✺", type:"destroyAll", gaugeCost:100, description:"กำจัดศัตรูธรรมดาทั้งหมด" },
    comboSlash:{ id:"comboSlash", name:"Dragon Slash", icon:"⚔", type:"damage", value:4, gaugeCost:100, description:"สร้างความเสียหายหนักแก่ศัตรู" },
    healingLeaf:{ id:"healingLeaf", name:"Nature Storm", icon:"❧", type:"slow", value:.45, duration:6500, gaugeCost:100, description:"ทำให้ศัตรูทั้งหมดช้าลง" },
    knowledgeHint:{ id:"knowledgeHint", name:"Time Freeze", icon:"⌛", type:"freeze", duration:5000, gaugeCost:100, description:"หยุดศัตรูทั้งหมดชั่วคราว" },
    heal:{ id:"heal", name:"Healing Light", icon:"♥", type:"heal", value:1, gaugeCost:100 },
    shield:{ id:"shield", name:"Magic Shield", icon:"⬡", type:"shield", value:1, gaugeCost:100 },
    doubleScore:{ id:"doubleScore", name:"Scholar's Focus", icon:"×2", type:"scoreMultiplier", value:2, duration:8000, gaugeCost:100 },
    autoCorrect:{ id:"autoCorrect", name:"Guiding Star", icon:"★", type:"autoCorrect", value:1, gaugeCost:100 },
    tolerance:{ id:"tolerance", name:"Gentle Rune", icon:"◎", type:"thresholdModifier", value:-12, duration:10000, gaugeCost:100 }
  };
  const get = id => skills[id] || skills.arcaneTime;
  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Skills = { all: skills, get };
})();
