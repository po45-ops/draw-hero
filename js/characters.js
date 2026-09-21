(function () {
  "use strict";
  const characters = [
    { id:"es", name:"Es", title:"นักเวทแห่งแสง", class:"Mage", level:1, hp:3, color:"#37b9ff", stats:{power:72,speed:64,magic:96}, skill:"arcaneTime", passive:"Arcane Time", ultimate:"Magic Burst", description:"ผู้ควบคุมแสงดาวและเวทอาร์เคน เพิ่มเวลาตอบโจทย์ 2 วินาที", unlockLevel:1, portrait:"assets/characters/es_idle.png", frontAsset:"assets/characters/front/es.png", battleSprite:"assets/characters/es_battle.png", sprite3d:"assets/characters/3d/es-sheet.png", weapon:"staff" },
    { id:"kai", name:"Kai", title:"นักดาบผู้กล้า", class:"Warrior", level:1, hp:4, color:"#ef5555", stats:{power:95,speed:78,magic:48}, skill:"comboSlash", passive:"Combo Slash", ultimate:"Dragon Slash", description:"นักรบใจกล้าที่โจมตีซ้ำฟรีเมื่อตอบถูกติดต่อกัน 5 ครั้ง", unlockLevel:1, portrait:"assets/characters/kai_idle.png", frontAsset:"assets/characters/front/kai.png", battleSprite:"assets/characters/kai_battle.png", sprite3d:"assets/characters/3d/kai-sheet.png", weapon:"sword" },
    { id:"leen", name:"Leen", title:"นักธนูแห่งธรรมชาติ", class:"Ranger / Druid", level:1, hp:3, color:"#55c271", stats:{power:76,speed:93,magic:70}, skill:"healingLeaf", passive:"Healing Leaf", ultimate:"Nature Storm", description:"ผู้พิทักษ์พงไพร ฟื้นหัวใจเมื่อ Combo ถึง 8 และชะลอศัตรูได้", unlockLevel:1, portrait:"assets/characters/leen_idle.png", frontAsset:"assets/characters/front/leen.png", battleSprite:"assets/characters/leen_battle.png", sprite3d:"assets/characters/3d/leen-sheet.png", weapon:"bow" },
    { id:"mimi", name:"Mimi", title:"นักเวทแห่งความรู้", class:"Scholar Mage", level:1, hp:3, color:"#f275bb", stats:{power:60,speed:68,magic:98}, skill:"knowledgeHint", passive:"Knowledge Hint", ultimate:"Time Freeze", description:"นักปราชญ์ตัวน้อย ใช้คำใบ้ฟรีทุก Wave และหยุดเวลาได้ชั่วคราว", unlockLevel:1, portrait:"assets/characters/mimi_idle.png", frontAsset:"assets/characters/front/mimi.png", battleSprite:"assets/characters/mimi_battle.png", sprite3d:"assets/characters/3d/mimi-sheet.png", weapon:"book" }
  ];
  const get = id => characters.find(character => character.id === id) || characters[0];
  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Characters = { all: characters, get };
})();
