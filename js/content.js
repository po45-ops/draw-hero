(function () {
  "use strict";

  const questions = [];
  const slug = value => Array.from(value).map(char => char.codePointAt(0).toString(16)).join("-");
  const add = (type, language, values, options) => {
    values.forEach((value, index) => {
      const item = typeof value === "object" ? value : { display:String(value), answer:String(value) };
      questions.push(Object.assign({
        id:`${type}_${slug(String(item.display))}_${index}`,
        type, language, display:String(item.display), answer:String(item.answer), difficulty:"normal",
        guideMode:"dotted", recognitionMode:type === "shape" || type === "line" ? "geometry" : "raster",
        threshold:type === "shape" || type === "line" ? 48 : 55, timeLimit:9,
        hint:language === "th" ? "เขียนตามตัวอย่าง" : "Draw the answer shown", reward:100,
        wholeAnswer:false
      }, options || {}, item));
    });
  };

  add("line", "symbol", ["—","|","/","\\","⌒","⌁"], { difficulty:"easy", guideMode:"full", threshold:42 });
  add("shape", "symbol", ["○","△","□","▭","◇","⬭","☆","⬡","⌂","♡"], { difficulty:"easy", guideMode:"full", threshold:45 });
  add("number", "number", Array.from({length:100},(_,index)=>String(index+1)), { hint:"เขียนตัวเลขให้ครบ แล้วร่ายเวทครั้งเดียว", wholeAnswer:true, timeLimit:12 });
  add("english_letter", "en", "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), { hint:"Write the uppercase letter" });
  add("thai_letter", "th", Array.from("กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ"), { hint:"เขียนพยัญชนะไทยตามตัวอย่าง" });
  add("thai_word", "th", ["กา","ปู","ปลา","แมว","หมา","บ้าน","ต้นไม้","ดอกไม้","หนังสือ","โรงเรียน","นักเรียน","คุณครู","ครอบครัว","พระอาทิตย์","จักรยาน"], { timeLimit:18, threshold:48, hint:"เขียนทั้งคำ แล้วร่ายเวทครั้งเดียว", wholeAnswer:true });
  add("english_word", "en", ["CAT","DOG","SUN","BOOK","TREE","FLOWER","WATER","SCHOOL","STUDENT","TEACHER","FAMILY","FRIEND","HOUSE","MOON","HERO"], { timeLimit:18, threshold:50, hint:"Write the whole word, then cast once", wholeAnswer:true });
  add("thai_phrase", "th", ["ฉันรักการอ่าน","วันนี้อากาศดี","ฉันไปโรงเรียน","คุณครูใจดี","เราช่วยกันเรียนรู้"], { difficulty:"hard", timeLimit:30, threshold:44, hint:"เขียนประโยคให้ครบ แล้วร่ายเวทครั้งเดียว", wholeAnswer:true });
  add("english_phrase", "en", ["I LOVE MY FAMILY","I GO TO SCHOOL","THE SUN IS BRIGHT","MY TEACHER IS KIND","WE LEARN TOGETHER"], { difficulty:"hard", timeLimit:30, threshold:46, hint:"Write the full sentence, then cast once", wholeAnswer:true });

  // Selected entries verified against the P.1 basic-word list, pp. 3–18.
  // Keep previous IDs stable: append these rather than changing the old arrays.
  const basicWordSource={title:"บัญชีคำพื้นฐาน ป.1 — โรงเรียนบ้านหนองกา สพป.ประจวบคีรีขันธ์ เขต 2",url:"https://site.pkn2.go.th/fileupload/downloads/682318041.45959.pdf",grade:1};
  const basicWords=["กบ","กระจก","กระดิ่ง","กระดุม","กระโดด","กระต่าย","กระเทียม","กระป๋อง","กระเป๋า","กระโปรง","กระรอก","กอด","กะทิ","กัด","กัน","กับ","กางเกง","กิน","กุ้ง","เก่ง","เก็บ","เกม","เกลือ","เก้าอี้","เกาะ","แกง","แก้ว","แกะ","ใกล้","ไก่","ไกล","ขน","ขยะ","ขวา","ขอ","ของ","ขัน","ขวด","ขา","ข้าง","ข้าม","ขาย","ขาว","ข่าว","ข้าว","ขี่","ขีด","ขึ้น","ขุด","เข็ม","เขา","เข่า","เข้า","เขียน","แขน","ไข่","คน","ครัว","ครู","คอ","คอย","คะน้า","คาง","คิด","คิ้ว","คืน","คุย","คู่","เค็ม","งาน","งาม","งู","เงาะ","เงิน","จาน","เจอ","แจกัน","ใจ","ใจดี","ฉัน"];
  add("thai_word","th",basicWords.map(word=>({display:word,answer:word,reading:word,source:basicWordSource})),{timeLimit:25,threshold:55,hint:"คำพื้นฐาน ป.1: เขียนให้ครบทั้งคำ แล้วร่ายเวทครั้งเดียว",wholeAnswer:true});
  const consonantReadings=["กอ ไก่","ขอ ไข่","ขอ ขวด","คอ ควาย","คอ คน","คอ ระฆัง","งอ งู","จอ จาน","ฉอ ฉิ่ง","ชอ ช้าง","ซอ โซ่","ชอ เฌอ","ยอ หญิง","ดอ ชฎา","ตอ ปฏัก","ถอ ฐาน","ทอ มณโฑ","ทอ ผู้เฒ่า","นอ เณร","ดอ เด็ก","ตอ เต่า","ถอ ถุง","ทอ ทหาร","ทอ ธง","นอ หนู","บอ ใบไม้","ปอ ปลา","ผอ ผึ้ง","ฝอ ฝา","พอ พาน","ฟอ ฟัน","พอ สำเภา","มอ ม้า","ยอ ยักษ์","รอ เรือ","ลอ ลิง","วอ แหวน","ศอ ศาลา","ษอ ฤๅษี","สอ เสือ","หอ หีบ","ฬอ จุฬา","ออ อ่าง","ฮอ นกฮูก"];
  questions.filter(q=>q.type==="thai_letter").forEach((q,index)=>{q.reading=consonantReadings[index];});

  const mathSets = {
    math_add:[["3 + 4 = ?","7"],["8 + 6 = ?","14"],["12 + 7 = ?","19"],["25 + 13 = ?","38"],["46 + 24 = ?","70"],["58 + 31 = ?","89"]],
    math_subtract:[["9 − 3 = ?","6"],["15 − 7 = ?","8"],["32 − 12 = ?","20"],["50 − 18 = ?","32"],["74 − 25 = ?","49"],["100 − 36 = ?","64"]],
    math_multiply:[["2 × 3 = ?","6"],["4 × 5 = ?","20"],["6 × 7 = ?","42"],["8 × 9 = ?","72"],["11 × 6 = ?","66"],["12 × 8 = ?","96"]],
    math_divide:[["8 ÷ 2 = ?","4"],["18 ÷ 3 = ?","6"],["24 ÷ 4 = ?","6"],["42 ÷ 7 = ?","6"],["72 ÷ 8 = ?","9"],["96 ÷ 12 = ?","8"]]
  };
  Object.entries(mathSets).forEach(([type,values])=>add(type,"number",values.map(([display,answer])=>({display,answer})),{difficulty:type.includes("multiply")||type.includes("divide")?"hard":"easy",timeLimit:18,threshold:48,hint:"คำนวณแล้วเขียนคำตอบ จากนั้นร่ายเวทครั้งเดียว",wholeAnswer:true,reward:130}));

  const byType = type => questions.filter(question => question.type === type);
  const byId = id => questions.find(question => question.id === id);
  const sample = (type, count) => byType(type).slice(0, count).map(item => item.id);
  const resolve = item => typeof item === "string" ? (byId(item) || {
    id:`custom_${slug(item)}`, type:item.length > 1 ? "mixed" : "english_letter", language:"any", display:item,
    answer:item, difficulty:"normal", guideMode:"dotted", recognitionMode:"raster", threshold:50, timeLimit:18,
    hint:"วาดหรือเขียนคำตอบ แล้วร่ายเวท", reward:100, wholeAnswer:item.length>1
  }) : Object.assign({}, item);

  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Content = { questions, byType, byId, sample, resolve };
})();
