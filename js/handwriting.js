(function () {
  "use strict";
  // Offline template classifier. Never treat a similarity percentage as certainty.
  const DH = window.DrawHero, N = 64;
  const fonts = ["DH Handwriting", "DH Thai Looped", "Arial", "Tahoma"];
  const cache = new Map();
  const preparing = new Set();
  let ready = false;
  const readyPromise = document.fonts ? Promise.all([
    document.fonts.load('100px "DH Handwriting"', "กA1"),
    document.fonts.load('100px "DH Thai Looped"', "กA1")
  ]).then(loaded => { ready = loaded.every(faces=>faces.length>0); cache.clear(); }).catch(() => { ready = false; }) : Promise.resolve();

  function canvas(w,h) { const c=document.createElement("canvas");c.width=w;c.height=h;return c; }
  function units(text) {
    const out=[];
    for(const ch of String(text).normalize("NFC").replace(/\s+/gu,"")) {
      if(ch==="แ")out.push("เ","เ"); // Two disconnected stems, still validated individually.
      else if(/[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/u.test(ch)&&out.length)out[out.length-1]+=ch;
      else out.push(ch);
    }
    return out;
  }
  function bounds(c) {
    const data=c.getContext("2d").getImageData(0,0,c.width,c.height).data;
    let x0=c.width,y0=c.height,x1=-1,y1=-1,count=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>64){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}
    return count?{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,count,data}:null;
  }
  // Use actual empty columns, not the number of digits in the expected answer.
  function segments(c) {
    const b=bounds(c);if(!b)return [];
    const runs=[];let start=-1;
    for(let x=b.x;x<=b.x+b.w;x++){
      let occupied=false;
      if(x<b.x+b.w)for(let y=b.y;y<b.y+b.h;y++)if(b.data[(y*c.width+x)*4+3]>64){occupied=true;break;}
      if(occupied&&start<0)start=x;
      if(!occupied&&start>=0){runs.push([start,x]);start=-1;}
    }
    return runs.map(([left,right])=>{
      const part=canvas(right-left,b.h);part.getContext("2d").drawImage(c,left,b.y,right-left,b.h,0,0,right-left,b.h);return part;
    });
  }
  function thin(input) {
    const a=input.slice();let changed=true,rounds=0;
    while(changed&&rounds++<64){changed=false;
      for(let step=0;step<2;step++){
        const remove=[];
        for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
          const i=y*N+x;if(!a[i])continue;
          const p=[a[i-N],a[i-N+1],a[i+1],a[i+N+1],a[i+N],a[i+N-1],a[i-1],a[i-N-1]];
          const count=p.reduce((s,v)=>s+v,0);let transitions=0;
          for(let k=0;k<8;k++)if(!p[k]&&p[(k+1)%8])transitions++;
          if(count<2||count>6||transitions!==1)continue;
          if(step===0?(p[0]*p[2]*p[4]||p[2]*p[4]*p[6]):(p[0]*p[2]*p[6]||p[0]*p[4]*p[6]))continue;
          remove.push(i);
        }
        if(remove.length)changed=true;remove.forEach(i=>{a[i]=0;});
      }
    }
    return a;
  }
  function distances(binary) {
    const d=new Float32Array(N*N);d.fill(1000);
    for(let i=0;i<d.length;i++)if(binary[i])d[i]=0;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(x)d[i]=Math.min(d[i],d[i-1]+1);if(y)d[i]=Math.min(d[i],d[i-N]+1);if(x&&y)d[i]=Math.min(d[i],d[i-N-1]+1.414);if(y&&x<N-1)d[i]=Math.min(d[i],d[i-N+1]+1.414);}
    for(let y=N-1;y>=0;y--)for(let x=N-1;x>=0;x--){const i=y*N+x;if(x<N-1)d[i]=Math.min(d[i],d[i+1]+1);if(y<N-1)d[i]=Math.min(d[i],d[i+N]+1);if(x<N-1&&y<N-1)d[i]=Math.min(d[i],d[i+N+1]+1.414);if(x&&y<N-1)d[i]=Math.min(d[i],d[i+N-1]+1.414);}
    return d;
  }
  function normalize(c) {
    const b=bounds(c);if(!b)return null;
    const out=canvas(N,N),ctx=out.getContext("2d"),scale=50/Math.max(b.w,b.h);
    ctx.drawImage(c,b.x,b.y,b.w,b.h,(N-b.w*scale)/2,(N-b.h*scale)/2,b.w*scale,b.h*scale);
    const raw=ctx.getImageData(0,0,N,N).data,mask=new Uint8Array(N*N);
    for(let i=0;i<mask.length;i++)mask[i]=raw[i*4+3]>64?1:0;
    const skeleton=thin(mask),points=[];
    skeleton.forEach((v,i)=>{if(v)points.push(i);});
    return {points,distance:distances(skeleton),aspect:b.w/b.h};
  }
  function compare(a,b) {
    function direction(points,map,dx,dy){return points.reduce((s,i)=>{
      const x=i%N+dx,y=Math.floor(i/N)+dy;
      return s+(x>=0&&x<N&&y>=0&&y<N?Math.max(0,1-map[y*N+x]/6):0);
    },0)/Math.max(1,points.length);}
    // Small registration offsets absorb pen-width/cropping differences, not missing strokes.
    let match=0;
    for(const dx of [-2,0,2])for(const dy of [-2,0,2])
      match=Math.max(match,Math.sqrt(direction(a.points,b.distance,dx,dy)*direction(b.points,a.distance,-dx,-dy)));
    const aspect=Math.exp(-Math.abs(Math.log(a.aspect/b.aspect)));
    return Math.max(0,100*(.85*match+.15*aspect));
  }
  function render(text,font) {
    const c=canvas(220,240),ctx=c.getContext("2d");ctx.fillStyle="#000";ctx.font=`140px "${font}"`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,110,120);return c;
  }
  // Common handwritten numeral forms absent from typeset fonts (especially 1 and 4).
  const numeralPaths={
    "0":[[[50,5],[25,10],[13,35],[12,65],[25,91],[51,96],[75,85],[84,55],[78,22],[50,5]]],
    "1":[[[52,5],[52,96]]],
    "2":[[[13,22],[30,6],[58,5],[80,20],[78,39],[14,94],[86,94]]],
    "3":[[[17,10],[53,4],[77,15],[78,33],[53,48],[78,59],[83,77],[68,94],[34,96],[14,85]]],
    "4":[[[67,5],[14,65],[87,65]],[[67,5],[67,96]]],
    "5":[[[82,6],[23,6],[19,47],[52,42],[79,56],[82,79],[65,95],[35,96],[14,84]]],
    "6":[[[73,5],[47,16],[22,46],[15,71],[26,91],[53,97],[77,82],[79,60],[61,48],[39,49],[17,71]]],
    "7":[[[12,6],[85,6],[40,96]]],
    "8":[[[49,5],[24,11],[17,31],[35,48],[71,61],[80,79],[64,95],[33,96],[15,78],[24,61],[65,39],[78,23],[68,8],[49,5]]],
    "9":[[[80,35],[62,8],[34,5],[15,21],[16,42],[36,56],[62,52],[80,35],[77,69],[54,95]]]
  };
  const numeralVariants={
    "1":[[[[35,22],[50,5],[50,96]]],[[[40,16],[52,5],[52,96],[38,96],[66,96]]]],
    "6":[[[[40,5],[29,30],[25,52],[27,74],[38,92],[59,96],[77,83],[80,67],[70,55],[51,52],[35,61],[27,77]]]]
  };
  function templates(unit) {
    if(cache.has(unit))return cache.get(unit);
    const values=fonts.map(font=>normalize(render(unit,font))).filter(Boolean);
    if(numeralPaths[unit]){
      for(const paths of [numeralPaths[unit],...(numeralVariants[unit]||[])]) {
        const c=canvas(120,120),ctx=c.getContext("2d");ctx.lineWidth=5;ctx.lineCap="round";ctx.lineJoin="round";
        paths.forEach(path=>{ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x+10,y+10):ctx.moveTo(x+10,y+10));ctx.stroke();});values.push(normalize(c));
      }
    }
    // Bound memory for user-created content.
    if(cache.size>1500)cache.clear();cache.set(unit,values);return values;
  }
  function alphabet(target,language) {
    if(/^\d+$/.test(target))return Array.from("0123456789");
    if(language==="th"||/[\u0e00-\u0e7f]/u.test(target)){
      const pool=new Set(Array.from("กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะาเแโใไๆฯ"));
      (DH.Content.questions||[]).filter(q=>q.language==="th").forEach(q=>units(q.answer).forEach(u=>pool.add(u)));
      units(target).forEach(u=>pool.add(u));return [...pool];
    }
    const letters=/^[A-Z\s.,!?'-]+$/.test(target)?"ABCDEFGHIJKLMNOPQRSTUVWXYZ":/^[a-z\s.,!?'-]+$/.test(target)?"abcdefghijklmnopqrstuvwxyz":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    return [...new Set([...Array.from(letters+"0123456789.,!?'-"),...units(target)])];
  }
  function recognize(payload) {
    if(!ready)return {score:0,status:"uncertain",mode:"handwriting",details:{reason:"loading"}};
    const target=String(payload.target).trim(),expected=units(target),parts=segments(payload.canvas);
    if(!parts.length)return {score:0,status:"empty",mode:"handwriting",details:{reason:"empty"}};
    if(parts.length!==expected.length)return {score:0,status:"uncertain",mode:"handwriting",details:{reason:"segmentation",expected:expected.length,found:parts.length}};
    const candidates=alphabet(target,payload.options&&payload.options.language);
    if(candidates.some(unit=>!cache.has(unit))){prepare(target,payload.options&&payload.options.language);return {score:0,status:"uncertain",mode:"handwriting",details:{reason:"loading"}};}
    const results=parts.map((part,index)=>{
      const input=normalize(part);
      const scores=candidates.map(unit=>({unit,score:Math.max(...templates(unit).map(sample=>compare(input,sample)))})).sort((a,b)=>b.score-a.score);
      const wanted=scores.find(s=>s.unit===expected[index]),best=scores[0],other=scores.find(s=>s.unit!==expected[index]);
      const margin=wanted.score-(other?other.score:0);
      return {target:expected[index],recognized:best.unit,score:Math.round(wanted.score),bestScore:Math.round(best.score),margin:Math.round(margin)};
    });
    const accepted=results.every(r=>r.target===r.recognized&&r.score>=72&&r.margin>=3);
    const wrong=results.some(r=>r.target!==r.recognized&&r.bestScore>=80&&r.margin<=-9);
    return {score:Math.round(results.reduce((sum,r)=>sum+r.score,0)/results.length),status:accepted?"correct":wrong?"incorrect":"uncertain",mode:"handwriting",details:{reason:accepted?"matched":wrong?"different_character":"ambiguous",units:results}};
  }
  async function prepare(target,language){
    await readyPromise;if(!ready)return;
    const candidates=alphabet(String(target),language);
    for(const unit of candidates){
      if(cache.has(unit))continue;
      if(preparing.has(unit)){await new Promise(resolve=>setTimeout(resolve,8));continue;}
      preparing.add(unit);
      // Yield between glyphs so animation, pen input and pause controls stay responsive.
      await new Promise(resolve=>setTimeout(resolve,0));
      try{templates(unit);}finally{preparing.delete(unit);}
    }
  }
  DH.Handwriting={recognize,prepare,ready:readyPromise,units};
})();
