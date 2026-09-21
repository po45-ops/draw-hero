(function () {
  "use strict";

  const questions = [];
  const slug = value => Array.from(value).map(char => char.codePointAt(0).toString(16)).join("-");
  const add = (type, language, values, options) => {
    values.forEach((value, index) => questions.push(Object.assign({
      id:`${type}_${slug(String(value))}_${index}`,
      type, language, display:String(value), answer:String(value), difficulty:"normal",
      guideMode:"dotted", recognitionMode:type === "shape" || type === "line" ? "geometry" : "raster",
      threshold:type === "shape" || type === "line" ? 48 : 55, timeLimit:9,
      hint:language === "th" ? "เขียนตามตัวอย่าง" : "Draw the symbol shown", reward:100
    }, options || {})));
  };

  add("line", "symbol", ["—","|","/","\\","⌒","⌁"], { difficulty:"easy", guideMode:"full", threshold:42 });
  add("shape", "symbol", ["○","△","□","▭","◇","⬭","☆","⬡","⌂","♡"], { difficulty:"easy", guideMode:"full", threshold:45 });
  add("number", "number", ["0","1","2","3","4","5","6","7","8","9"], { hint:"เขียนตัวเลขตามโจทย์" });
  add("english_letter", "en", "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), { hint:"Write the uppercase letter" });
  add("thai_letter", "th", ["ก","ข","ค","ง","จ","ฉ","ช","ซ","ด","ต","บ","ป","ม","ย","ร","ล","ว","ส","ห","อ","น","พ","ฟ","ท"], { hint:"เขียนพยัญชนะไทยตามตัวอย่าง" });
  add("thai_word", "th", ["กา","ปู","ปลา","แมว","หมา","บ้าน","ต้นไม้","ดอกไม้","หนังสือ","โรงเรียน","นักเรียน","คุณครู","ครอบครัว","พระอาทิตย์","จักรยาน"], { timeLimit:12, hint:"เขียนทีละตัวอักษร" });
  add("english_word", "en", ["cat","dog","sun","book","tree","flower","water","school","student","teacher","family","friend","house","moon","beautiful"], { timeLimit:12, hint:"Write one letter at a time" });
  add("thai_phrase", "th", ["ฉันรักการอ่าน","วันนี้อากาศดี","ฉันไปโรงเรียน","คุณครูใจดี","เราช่วยกันเรียนรู้"], { difficulty:"hard", timeLimit:15, threshold:52, hint:"เขียนทีละตัว เว้นวรรคจะข้ามอัตโนมัติ" });
  add("english_phrase", "en", ["I love my family","I go to school","The sun is bright","My teacher is kind","We learn together"], { difficulty:"hard", timeLimit:15, threshold:54, hint:"Write one character at a time" });

  const byType = type => questions.filter(question => question.type === type);
  const byId = id => questions.find(question => question.id === id);
  const sample = (type, count) => {
    const pool = byType(type);
    return pool.slice(0, count).map(item => item.id);
  };
  const resolve = item => typeof item === "string" ? (byId(item) || {
    id:`custom_${slug(item)}`, type:item.length > 1 ? "mixed" : "english_letter", language:"any", display:item,
    answer:item, difficulty:"normal", guideMode:"dotted", recognitionMode:"raster", threshold:55, timeLimit:9, hint:"วาดหรือเขียนตามโจทย์", reward:100
  }) : Object.assign({}, item);

  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Content = { questions, byType, byId, sample, resolve };
})();
