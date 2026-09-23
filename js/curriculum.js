(function(){
  "use strict";
  const C=window.DrawHero.Content;
  const append=(id,type,language,answer,extra={})=>C.questions.push(Object.assign({id,type,language,display:answer,answer,wholeAnswer:true,recognitionMode:"raster",timeLimit:25,threshold:55,hint:"เขียนให้ครบ แล้วร่ายเวทครั้งเดียว",reward:100},extra));
  Array.from("abcdefghijklmnopqrstuvwxyz").forEach(letter=>append(`english_lower_${letter}`,"english_lower","en",letter,{timeLimit:15,hint:"เขียนอักษรภาษาอังกฤษตัวพิมพ์เล็ก"}));
  (window.DrawHero.WordLists||[]).forEach(list=>list.words.forEach((word,index)=>append(`basic_${list.language}_${list.grade}_${index}`,`${list.language==="th"?"thai":"english"}_basic`,list.language,word,{grade:list.grade,source:{title:list.title,url:list.url},reading:word,timeLimit:Math.max(25,Array.from(word).length*3),hint:`คำพื้นฐาน ป.${list.grade} • เขียนให้ครบทั้งคำ`})));
  // Deterministic varied arithmetic: non-negative subtraction and integer division.
  for(let grade=1;grade<=6;grade++)for(const operation of ["add","subtract","multiply","divide"]){
    for(let i=0;i<24;i++){
      const limit=[10,20,50,100,500,1000][grade-1];
      let a=1+(i*7+grade)%limit,b=1+(i*3+grade*2)%limit,answer,sign;
      if(operation==="add"){answer=a+b;sign="+";}
      if(operation==="subtract"){[a,b]=[Math.max(a,b),Math.min(a,b)];answer=a-b;sign="−";}
      if(operation==="multiply"){a=1+i%(grade<3?5:12);b=1+(i*3+grade)%(grade<3?5:12);answer=a*b;sign="×";}
      if(operation==="divide"){b=1+i%(grade<3?5:12);answer=1+(i*7+grade)%(grade<3?5:12);a=b*answer;sign="÷";}
      const missing=i%4===3;
      append(`math_g${grade}_${operation}_${i}`,`math_${operation}`,"number",String(missing?b:answer),{grade,display:missing?`${a} ${sign} ? = ${answer}`:`${a} ${sign} ${b} = ?`,timeLimit:30,hint:missing?"เติมจำนวนที่หายไป":"คำนวณแล้วเขียนคำตอบ",reward:130,generated:true});
    }
  }
})();
