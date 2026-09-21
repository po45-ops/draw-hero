(function () {
  "use strict";
  const C = window.DrawHero.Content;
  const difficulties = {
    easy:{ id:"easy", label:"EASY", thai:"ง่าย", speed:1, timeLimit:12, threshold:47, guideMode:"full", simultaneous:1, scoreMultiplier:1, color:"#55c271", icon:"◆" },
    normal:{ id:"normal", label:"NORMAL", thai:"ปานกลาง", speed:1.25, timeLimit:9, threshold:55, guideMode:"dotted", simultaneous:2, scoreMultiplier:1.25, color:"#37b9ff", icon:"◆◆" },
    hard:{ id:"hard", label:"HARD", thai:"ยาก", speed:1.5, timeLimit:7, threshold:62, guideMode:"fade", simultaneous:2, scoreMultiplier:1.6, color:"#ef8d42", icon:"◆◆◆" },
    challenge:{ id:"challenge", label:"CHALLENGE", thai:"ท้าทาย", speed:1.8, timeLimit:5, threshold:68, guideMode:"none", simultaneous:3, scoreMultiplier:2, color:"#e74848", icon:"♛" }
  };
  const worlds = [
    { id:1, name:"หมู่บ้านแห่งแสง", short:"เส้นและรูปทรง", icon:"⌂", color:"#37b9ff" },
    { id:2, name:"ป่าแห่งอักษร", short:"พยัญชนะไทย", icon:"♣", color:"#55c271" },
    { id:3, name:"ทะเลทรายตัวอักษร", short:"A–Z และตัวเลข", icon:"☀", color:"#d5a942" },
    { id:4, name:"หอคอยแห่งภาษา", short:"คำภาษาไทย", icon:"♜", color:"#7557ff" },
    { id:5, name:"เมืองน้ำแข็ง", short:"English Words", icon:"❄", color:"#86d7ff" },
    { id:6, name:"ปราสาทจอมมาร", short:"Mixed Challenge", icon:"♚", color:"#e74848" }
  ];
  const make = (id, world, level, name, contentType, questionIds, enemyTypes, options) => Object.assign({
    id, world, level, name, description:"ฝึกเขียนและปลดปล่อยพลังเวท", contentType, difficulty:"normal",
    timeLimit:9, enemySpeed:1, questions:questionIds, enemyTypes, rewardXP:50 + world * 15,
    rewardCoins:20 + world * 5, guideMode:"dotted", recognitionThreshold:55, boss:false
  }, options || {});

  const levels = [
    make("world1_level1",1,1,"เส้นแห่งเวทมนตร์","line",C.sample("line",5),["goblin"],{difficulty:"easy",timeLimit:12,guideMode:"full",recognitionThreshold:43}),
    make("world1_level2",1,2,"ผนึกวงกลม","shape",C.sample("shape",4),["goblin","skeleton"],{difficulty:"easy",timeLimit:12,guideMode:"full",recognitionThreshold:45}),
    make("world1_level3",1,3,"ผู้พิทักษ์รูปทรง","shape",C.sample("shape",4).concat(C.sample("line",2)),["orc"],{recognitionThreshold:50}),
    make("world2_level1",2,1,"ก ข ค แห่งพงไพร","thai_letter",C.sample("thai_letter",6),["goblin","ghost"]),
    make("world2_level2",2,2,"เสียงเรียกจากป่า","thai_letter",C.byType("thai_letter").slice(6,13).map(q=>q.id),["skeleton","shadow"]),
    make("world3_level1",3,1,"โอเอซิสตัวเลข","number",C.sample("number",8),["goblin","orc"]),
    make("world3_level2",3,2,"อักษรแห่งผืนทราย","english_letter",C.sample("english_letter",10),["skeleton","armoredDemon"]),
    make("world4_level1",4,1,"คำวิเศษไทย","thai_word",C.sample("thai_word",8),["shadow","orc"],{timeLimit:12}),
    make("world4_level2",4,2,"หอคอยนักอ่าน","thai_word",C.byType("thai_word").slice(7,15).map(q=>q.id),["armoredDemon"],{timeLimit:12}),
    make("world5_level1",5,1,"Frozen Words","english_word",C.sample("english_word",8),["ghost","shadow"],{timeLimit:12}),
    make("world5_level2",5,2,"Library of Ice","english_word",C.byType("english_word").slice(7,15).map(q=>q.id),["armoredDemon"],{timeLimit:12}),
    make("world6_level1",6,1,"ประตูคำท้าทาย","mixed",C.sample("thai_word",3).concat(C.sample("english_word",3),C.sample("number",2)),["shadow","armoredDemon"],{difficulty:"hard",timeLimit:8,recognitionThreshold:60}),
    make("world6_boss",6,2,"จอมมารแห่งความรู้","mixed",C.sample("thai_phrase",2).concat(C.sample("english_phrase",2),C.sample("shape",2)),["bossDemon"],{difficulty:"challenge",timeLimit:10,enemySpeed:.7,recognitionThreshold:58,boss:true,rewardXP:500,rewardCoins:250})
  ];
  const get = id => levels.find(level => level.id === id);
  const forWorld = world => levels.filter(level => level.world === Number(world));
  window.DrawHero.Levels = { difficulties, worlds, levels, get, forWorld };
})();
