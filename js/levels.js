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
    { id:1, name:"หมู่บ้านแห่งแสง", short:"พยัญชนะไทย คำ และประโยค", badge:"ก–ฮ", icon:"⌂", color:"#37b9ff", art:"../assets/backgrounds/worlds/world-1.jpg" },
    { id:2, name:"ป่าเวทมนตร์", short:"ตัวอักษรและคำภาษาอังกฤษ", badge:"A–Z", icon:"♣", color:"#55c271", art:"../assets/backgrounds/worlds/world-2.jpg" },
    { id:3, name:"หุบเขาตัวเลข", short:"ฝึกเขียนตัวเลขตั้งแต่ 1–100", badge:"1–100", icon:"123", color:"#ef9a42", art:"../assets/backgrounds/worlds/world-3.jpg" },
    { id:4, name:"ปราสาทคณิต", short:"การบวก ลบ คูณ และหาร", badge:"+ − × ÷", icon:"∑", color:"#a770ff", art:"../assets/backgrounds/worlds/world-4.jpg" }
  ];
  const ids = (type,start,count) => C.byType(type).slice(start,start+count).map(q=>q.id);
  const make = (id, world, level, name, contentType, questionIds, enemyTypes, options) => Object.assign({
    id, world, level, name, symbol:"✦", description:"ฝึกเขียนและปลดปล่อยพลังเวท", contentType, difficulty:"normal",
    timeLimit:12, enemySpeed:1, questions:questionIds, enemyTypes, rewardXP:50 + world * 15,
    rewardCoins:20 + world * 5, guideMode:"dotted", recognitionThreshold:52, boss:false
  }, options || {});

  const levels = [
    make("world1_level1",1,1,"ก–ง แห่งแสง","thai_letter",ids("thai_letter",0,7),["goblin"],{symbol:"ก",difficulty:"easy",guideMode:"full",recognitionThreshold:45}),
    make("world1_level2",1,2,"จ–ณ ผู้พิทักษ์","thai_letter",ids("thai_letter",7,12),["goblin","skeleton"],{symbol:"จ"}),
    make("world1_level3",1,3,"คำวิเศษไทย","thai_word",ids("thai_word",0,8),["orc","shadow"],{symbol:"กา",timeLimit:18,recognitionThreshold:48}),
    make("world1_level4",1,4,"ประโยคแห่งความรู้","thai_phrase",ids("thai_phrase",0,5),["armoredDemon"],{symbol:"…",timeLimit:30,recognitionThreshold:44}),
    make("world2_level1",2,1,"A–G Magic","english_letter",ids("english_letter",0,7),["goblin"],{symbol:"A",difficulty:"easy",guideMode:"full",recognitionThreshold:46}),
    make("world2_level2",2,2,"H–P Forest","english_letter",ids("english_letter",7,9),["skeleton","ghost"],{symbol:"H"}),
    make("world2_level3",2,3,"Hero Words","english_word",ids("english_word",0,8),["orc","shadow"],{symbol:"CAT",timeLimit:18,recognitionThreshold:50}),
    make("world2_level4",2,4,"Magic Sentences","english_phrase",ids("english_phrase",0,5),["armoredDemon"],{symbol:"…",timeLimit:30,recognitionThreshold:46}),
    make("world3_level1",3,1,"ตัวเลข 1–10","number",ids("number",0,10),["goblin"],{symbol:"1",difficulty:"easy",guideMode:"full",recognitionThreshold:45}),
    make("world3_level2",3,2,"ตัวเลข 11–30","number",ids("number",10,20),["goblin","skeleton"],{symbol:"20",timeLimit:14,recognitionThreshold:48}),
    make("world3_level3",3,3,"ตัวเลข 31–60","number",ids("number",30,30),["orc","shadow"],{symbol:"50",timeLimit:14,recognitionThreshold:50}),
    make("world3_level4",3,4,"ตัวเลข 61–100","number",ids("number",60,40),["armoredDemon"],{symbol:"100",timeLimit:15,recognitionThreshold:50}),
    make("world4_level1",4,1,"การบวก","math_add",ids("math_add",0,6),["goblin","skeleton"],{symbol:"+",difficulty:"easy",timeLimit:18,recognitionThreshold:48}),
    make("world4_level2",4,2,"การลบ","math_subtract",ids("math_subtract",0,6),["skeleton","orc"],{symbol:"−",timeLimit:18,recognitionThreshold:48}),
    make("world4_level3",4,3,"การคูณ","math_multiply",ids("math_multiply",0,6),["orc","shadow"],{symbol:"×",difficulty:"hard",timeLimit:20,recognitionThreshold:50}),
    make("world4_level4",4,4,"การหาร","math_divide",ids("math_divide",0,6),["shadow","armoredDemon"],{symbol:"÷",difficulty:"hard",timeLimit:20,recognitionThreshold:50}),
    make("world4_boss",4,5,"จอมมารแห่งคณิตศาสตร์","mixed",ids("math_add",0,2).concat(ids("math_subtract",0,2),ids("math_multiply",0,2),ids("math_divide",0,2)),["bossDemon"],{hiddenFromMap:true,symbol:"♛",difficulty:"challenge",timeLimit:18,enemySpeed:.7,recognitionThreshold:50,boss:true,rewardXP:500,rewardCoins:250})
  ];
  // Append stable new IDs so saved stars on existing stages remain valid.
  levels.push(
    make("world1_letters_20_31",1,5,"ด–ฟ ฝึกพยัญชนะ","thai_letter",ids("thai_letter",19,12),["goblin","skeleton"],{symbol:"ด",timeLimit:18}),
    make("world1_letters_32_44",1,6,"ภ–ฮ ครบพยัญชนะไทย","thai_letter",ids("thai_letter",31,13),["goblin","skeleton"],{symbol:"ฮ",timeLimit:18}),
    make("world2_letters_q_z",2,5,"Q–Z ครบตัวอักษรอังกฤษ","english_letter",ids("english_letter",16,10),["goblin","skeleton"],{symbol:"Z",timeLimit:18}),
    make("world2_words_9_15",2,6,"คำศัพท์อังกฤษเพิ่มเติม","english_word",ids("english_word",8,7),["goblin","shadow"],{symbol:"BOOK",timeLimit:25})
  );
  const basic=C.byType("thai_word").filter(q=>q.source);
  for(let offset=0;offset<basic.length;offset+=10){
    const group=offset/10+1;
    levels.push(make(`world1_basic_words_${group}`,1,6+group,`คำพื้นฐาน ป.1 ชุด ${group}`,"thai_word",basic.slice(offset,offset+10).map(q=>q.id),["goblin","skeleton"],{symbol:"คำ",timeLimit:25,description:"ฝึกเขียนและฟังคำอ่านจากบัญชีคำพื้นฐาน ป.1"}));
  }
  // Keep IDs for saved progress, but put the complete alphabets before words.
  const thaiOrder=["world1_level1","world1_level2","world1_letters_20_31","world1_letters_32_44","world1_level3","world1_level4"];
  const enOrder=["world2_level1","world2_level2","world2_letters_q_z","world2_level3","world2_words_9_15","world2_level4"];
  for(const [world,order] of [[1,thaiOrder],[2,enOrder]])order.forEach((id,index)=>{const stage=levels.find(l=>l.id===id);if(stage)stage.level=index+1;});
  for(let offset=0;offset<26;offset+=9)levels.push(make(`english_lower_stage_${offset}`,2,7+offset/9|0,"ตัวพิมพ์เล็ก "+C.byType("english_lower").slice(offset,offset+9).map(q=>q.answer).filter((_,i,a)=>i===0||i===a.length-1).join("–"),"english_lower",ids("english_lower",offset,9),["goblin"],{symbol:"a",category:"letters"}));
  for(const lang of ["th","en"])for(let grade=1;grade<=6;grade++){
    const type=lang==="th"?"thai_basic":"english_basic",pool=C.byType(type).filter(q=>q.grade===grade);
    for(let start=0;start<pool.length;start+=10)levels.push(make(`curriculum_${lang}_${grade}_${start}`,lang==="th"?1:2,100+grade*100+start/10,`คำพื้นฐาน ป.${grade} • ชุด ${start/10+1}`,type,pool.slice(start,start+10).map(q=>q.id),["goblin","skeleton"],{grade,category:"basic",symbol:lang==="th"?"คำ":"abc",description:`${pool.slice(start,start+3).map(q=>q.display).join(" • ")}`,timeLimit:30}));
  }
  for(let grade=1;grade<=6;grade++)for(const op of ["add","subtract","multiply","divide","mixed"]){
    const pool=C.questions.filter(q=>q.generated&&q.grade===grade&&(op==="mixed"||q.type===`math_${op}`));
    const label={add:"บวก",subtract:"ลบ",multiply:"คูณ",divide:"หาร",mixed:"โจทย์ผสม"}[op];
    // Interleave operations in mixed practice, rather than 24 additions first.
    const ordered=op==="mixed"?Array.from({length:24},(_,i)=>pool.filter(q=>q.id.endsWith(`_${i}`))).flat():pool;
    for(let start=0;start<ordered.length;start+=12)levels.push(make(`math_extended_${grade}_${op}_${start}`,4,100+grade*100+start,`${label} ป.${grade} • ชุด ${start/12+1}`,op==="mixed"?"math_mixed":`math_${op}`,ordered.slice(start,start+12).map(q=>q.id),["goblin","skeleton"],{grade,category:"math",symbol:"±",timeLimit:30,description:"คำนวณและเติมจำนวนที่หายไป"}));
  }
  levels.forEach(stage=>{if(!stage.category)stage.category=/letter|lower/.test(stage.contentType)?"letters":/word/.test(stage.contentType)?"words":/phrase/.test(stage.contentType)?"phrases":stage.world===3?"numbers":"math";});
  levels.sort((a,b)=>a.world-b.world||a.level-b.level);
  const get = id => levels.find(level => level.id === id);
  const forWorld = world => levels.filter(level => level.world === Number(world) && !level.hiddenFromMap);
  window.DrawHero.Levels = { difficulties, worlds, levels, get, forWorld };
})();
