(function () {
  "use strict";
  const enemies = {
    goblin:{ id:"goblin", name:"Goblin", hp:1, speed:1, color:"#65a84d", reward:100, icon:"G" },
    skeleton:{ id:"skeleton", name:"Skeleton", hp:1, speed:1.08, color:"#d7d9cf", reward:110, icon:"S" },
    orc:{ id:"orc", name:"Orc", hp:2, speed:.82, color:"#3d7446", reward:150, icon:"O" },
    shadow:{ id:"shadow", name:"Shadow", hp:2, speed:1.2, color:"#7557ff", reward:170, icon:"Sh" },
    ghost:{ id:"ghost", name:"Flying Ghost", hp:1, speed:1.35, color:"#86d7e7", reward:145, icon:"Gh" },
    armoredDemon:{ id:"armoredDemon", name:"Armored Demon", hp:3, speed:.7, color:"#a23d48", reward:220, icon:"D" },
    bossDemon:{ id:"bossDemon", name:"Boss Demon", hp:12, speed:.48, color:"#c63d3d", reward:1000, icon:"B", boss:true }
  };
  const get = id => Object.assign({}, enemies[id] || enemies.goblin);
  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Enemies = { all: enemies, get };
})();
