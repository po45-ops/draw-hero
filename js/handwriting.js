(function () {
  "use strict";
  // Offline template classifier. Never treat a similarity percentage as certainty.
  const DH = window.DrawHero, N = 64;
  const neighbors=[[1,0],[-1,0],[0,1],[0,-1]];
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
  function cropPart(part,left,right){
    const width=right-left;if(width<5)return null;
    const out=canvas(width,part.height);
    out.getContext("2d").drawImage(part,left,0,width,part.height,0,0,width,part.height);
    return out;
  }
  function joinParts(left,right){
    const out=canvas(left.width+right.width,Math.max(left.height,right.height)),ctx=out.getContext("2d");
    ctx.drawImage(left,0,0);ctx.drawImage(right,left.width,0);return out;
  }
  function englishParts(c){
    // Disjoint letters can overlap in X (e.g. a long T bar above A).
    // Find actual ink components before relying on empty vertical columns.
    const scale=Math.min(1,1000/c.width,400/c.height),small=canvas(Math.ceil(c.width*scale),Math.ceil(c.height*scale));
    small.getContext("2d").drawImage(c,0,0,small.width,small.height);
    const b=bounds(small);if(!b)return [];
    const w=small.width,h=small.height,seen=new Uint8Array(w*h),components=[];
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){
      const start=y*w+x;if(seen[start]||b.data[start*4+3]<=64)continue;
      const queue=[start],points=[];seen[start]=1;let x0=x,x1=x,y0=y,y1=y;
      for(let k=0;k<queue.length;k++){
        const i=queue[k],xx=i%w,yy=Math.floor(i/w);points.push(i);x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const nx=xx+dx,ny=yy+dy,j=ny*w+nx;
          if(nx<0||nx>=w||ny<0||ny>=h||seen[j]||b.data[j*4+3]<=64)continue;
          seen[j]=1;queue.push(j);
        }
      }
      components.push({x0,x1,y0,y1,points});
    }
    // Attach dots and detached crossbars to an overlapping stem, but never
    // collapse two full-height letters merely because their columns overlap.
    const major=components.filter(p=>p.y1-p.y0>=b.h*.36),minor=components.filter(p=>p.y1-p.y0<b.h*.36);
    for(const p of minor){
      const center=(p.x0+p.x1)/2;
      const matches=major.filter(q=>Math.min(p.x1,q.x1)-Math.max(p.x0,q.x0)>=-2).sort((a,z)=>Math.abs(center-(a.x0+a.x1)/2)-Math.abs(center-(z.x0+z.x1)/2));
      const q=matches[0];
      if(q){q.points.push(...p.points);q.x0=Math.min(q.x0,p.x0);q.x1=Math.max(q.x1,p.x1);q.y0=Math.min(q.y0,p.y0);q.y1=Math.max(q.y1,p.y1);}else major.push(p);
    }
    return major.sort((a,z)=>(a.x0+a.x1)-(z.x0+z.x1)).map(p=>{
      const out=canvas(p.x1-p.x0+1,p.y1-p.y0+1),ctx=out.getContext("2d"),pixels=ctx.createImageData(out.width,out.height);
      for(const i of p.points)pixels.data[((Math.floor(i/w)-p.y0)*out.width+i%w-p.x0)*4+3]=255;
      ctx.putImageData(pixels,0,0);return out;
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
    // Closed regions supply a small structural check for Thai loop placement.
    // Ignore tiny raster holes and never require an exact loop count.
    const visited=new Uint8Array(N*N),loops=[];
    for(let i=0;i<mask.length;i++)if(!mask[i]&&!visited[i]){
      const queue=[i];visited[i]=1;let edge=false,sx=0,sy=0;
      for(let k=0;k<queue.length;k++){
        const j=queue[k],x=j%N,y=Math.floor(j/N);sx+=x;sy+=y;
        if(!x||!y||x===N-1||y===N-1)edge=true;
        for(const [dx,dy] of neighbors){
          const xx=x+dx,yy=y+dy,next=yy*N+xx;
          if(xx>=0&&xx<N&&yy>=0&&yy<N&&!mask[next]&&!visited[next]){visited[next]=1;queue.push(next);}
        }
      }
      if(!edge&&queue.length>=4)loops.push({x:sx/queue.length/N,y:sy/queue.length/N});
    }
    return {points,distance:distances(skeleton),aspect:b.w/b.h,loops};
  }
  function compare(a,b,thai=false) {
    function direction(points,map,dx,dy){return points.reduce((s,i)=>{
      const x=i%N+dx,y=Math.floor(i/N)+dy;
      return s+(x>=0&&x<N&&y>=0&&y<N?Math.max(0,1-map[y*N+x]/6):0);
    },0)/Math.max(1,points.length);}
    // Small registration offsets absorb pen-width/cropping differences, not missing strokes.
    let match=0;
    for(const dx of [-2,0,2])for(const dy of [-2,0,2])
      match=Math.max(match,Math.sqrt(direction(a.points,b.distance,dx,dy)*direction(b.points,a.distance,-dx,-dy)));
    const aspect=Math.exp(-Math.abs(Math.log(a.aspect/b.aspect)));
    const loopMismatch=thai&&a.loops.length&&b.loops.length?Math.min(...a.loops.flatMap(p=>b.loops.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))):0;
    const structurePenalty=loopMismatch>.25?Math.min(6,(loopMismatch-.25)*20):0;
    return Math.max(0,100*(.85*match+.15*aspect)-structurePenalty);
  }
  function variations(part){
    // Bounded style adjustments: never mirror a letter or change its stroke order.
    return [[.8,0,0],[1.28,0,0],[1,-.24,0],[1,.24,0],[1,0,-10],[1,0,10]].map(([sx,shear,degrees])=>{
      const scale=Math.min(1,192/Math.max(part.width,part.height)),width=part.width*scale,height=part.height*scale;
      const side=Math.ceil((width+height)*1.5),out=canvas(side,side),ctx=out.getContext("2d");
      ctx.translate(side/2,side/2);ctx.rotate(degrees*Math.PI/180);ctx.transform(sx,0,shear,1,0,0);
      ctx.drawImage(part,-width/2,-height/2,width,height);
      return normalize(out);
    }).filter(Boolean);
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
  const letterPaths={
    A:[[[12,95],[24,34],[35,8],[43,5],[52,13],[65,95]],[[10,62],[70,62]]],
    T:[[[8,12],[87,7]],[[39,6],[49,96]]],
    a:[[[67,28],[47,19],[24,27],[13,50],[18,76],[37,88],[58,81],[68,60],[67,28],[70,91]]],
    g:[[[68,22],[44,15],[22,28],[16,48],[27,65],[49,66],[67,47],[68,22],[70,81],[58,97],[34,98],[19,89]]]
  };
  function thaiPenSamples(unit){
    if(!["ร","จ"].includes(unit))return [];
    // Whole-glyph pen forms, reusable in any word; not word-specific exceptions.
    return [0,5,-5].flatMap(loopSize=>{
      const c=canvas(130,120),p=c.getContext("2d");p.translate(10,10);p.lineWidth=6;p.lineCap="round";p.lineJoin="round";p.beginPath();
      if(unit==="ร"){
        p.moveTo(55,73);p.bezierCurveTo(30,63-loopSize,7,94,34,97);
        p.bezierCurveTo(60,101,73,75,48,57);p.bezierCurveTo(39,49,17,50,13,43);
        p.bezierCurveTo(20,30,50,32,57,30);p.lineTo(59,8);
      }else{
        p.moveTo(51,58);p.bezierCurveTo(27,48-loopSize,3,71,15,74);
        p.bezierCurveTo(26,78+loopSize,48,63,51,58);p.bezierCurveTo(59,62,61,82,68,91);
        p.lineTo(73,47);p.bezierCurveTo(77,3,48,10,13,26);
      }
      p.stroke();const samples=[normalize(c)];
      if(unit==="จ"){
        p.clearRect(-10,-10,130,120);p.beginPath();
        p.moveTo(90,96);p.lineTo(78,58);p.bezierCurveTo(70,23-loopSize,23,43,13,64);
        p.bezierCurveTo(7,81+loopSize,58,62,78,58);p.lineTo(90,96);
        p.bezierCurveTo(110,20,99,-5,62,3);p.bezierCurveTo(45,6,25,13,13,20);p.stroke();samples.push(normalize(c));
      }
      return samples;
    });
  }
  function templates(unit) {
    if(cache.has(unit))return cache.get(unit);
    const values=fonts.map(font=>normalize(render(unit,font))).filter(Boolean);
    values.push(...thaiPenSamples(unit));
    if(numeralPaths[unit]){
      for(const paths of [numeralPaths[unit],...(numeralVariants[unit]||[])]) {
        const c=canvas(120,120),ctx=c.getContext("2d");ctx.lineWidth=5;ctx.lineCap="round";ctx.lineJoin="round";
        paths.forEach(path=>{ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x+10,y+10):ctx.moveTo(x+10,y+10));ctx.stroke();});values.push(normalize(c));
      }
    }
    if(letterPaths[unit]){
      const c=canvas(110,120),ctx=c.getContext("2d");ctx.lineWidth=6;ctx.lineCap="round";ctx.lineJoin="round";
      letterPaths[unit].forEach(path=>{ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x+10,y+10):ctx.moveTo(x+10,y+10));ctx.stroke();});values.push(normalize(c));
    }
    // Bound memory for user-created content.
    if(cache.size>1500)cache.clear();cache.set(unit,values);return values;
  }
  function ignoresCase(target,options={}){
    return options.caseInsensitive===true||(options.caseInsensitive!==false&&/^[A-Za-z\s.,!?'-]+$/.test(target)&&units(target).length>1);
  }
  function alphabet(target,language,caseInsensitive=false) {
    if(/^\d+$/.test(target))return Array.from("0123456789");
    if(language==="th"||/[\u0e00-\u0e7f]/u.test(target)){
      const pool=new Set(Array.from("กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะาเแโใไๆฯ"));
      units(target).forEach(u=>{
        pool.add(u);pool.add(u.replace(/[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/gu,""));
        // Compare nearby vowel/tone forms too; otherwise กี is only compared
        // with กิ and bare consonants and can incorrectly win as กิ.
        for(const group of ["ัิีึืุู","่้๊๋์็ํ"]){
          const mark=Array.from(u).find(ch=>group.includes(ch));
          if(mark)for(const replacement of ["",...group])pool.add(u.replace(mark,replacement));
        }
      });return [...pool].filter(Boolean);
    }
    const letters=caseInsensitive?"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz":/^[A-Z\s.,!?'-]+$/.test(target)?"ABCDEFGHIJKLMNOPQRSTUVWXYZ":/^[a-z\s.,!?'-]+$/.test(target)?"abcdefghijklmnopqrstuvwxyz":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    return [...new Set([...Array.from(letters+"0123456789.,!?'-"),...units(target)])];
  }
  function classify(parts,expected,candidates,caseInsensitive=false){
    const key=unit=>caseInsensitive?unit.toLowerCase():unit;
    const results=parts.map((part,index)=>{
      const input=normalize(part);
      const scores=candidates.map(unit=>({unit,score:Math.max(...templates(unit).map(sample=>compare(input,sample,/[ก-๛]/u.test(unit))))})).sort((a,b)=>b.score-a.score);
      const wanted=scores.find(s=>key(s.unit)===key(expected[index]));
      // Retry borderline shapes against the same competing alphabet. Lowering the
      // pass threshold alone would also let genuinely different letters through.
      if(wanted.score>=55&&(wanted.score<85||wanted.score-(scores.find(s=>key(s.unit)!==key(expected[index]))?.score||0)<8)){
        const samples=variations(part),shortlist=scores.slice(0,10);
        if(!shortlist.includes(wanted))shortlist.push(wanted);
        shortlist.forEach(item=>{for(const sample of samples)for(const template of templates(item.unit))item.score=Math.max(item.score,compare(sample,template,/[ก-๛]/u.test(item.unit))-1);});
        scores.sort((a,b)=>b.score-a.score);
      }
      const best=scores[0],matched=scores.find(s=>key(s.unit)===key(expected[index])),other=scores.find(s=>key(s.unit)!==key(expected[index]));
      const margin=matched.score-(other?other.score:0);
      // Known confusions must win on shape, not pass both spellings through
      // the general small style tolerance.
      const ambiguousPair=best.unit!==expected[index]&&["รฐ","จค"].some(pair=>pair.includes(best.unit)&&pair.includes(expected[index]));
      return {target:expected[index],recognized:best.unit,score:Math.round(matched.score),bestScore:Math.round(best.score),margin:Math.round(margin),ambiguousPair};
    });
    const accepted=results.every(r=>r.score>=65&&r.margin>=-3&&!r.ambiguousPair);
    const wrong=results.some(r=>key(r.target)!==key(r.recognized)&&r.bestScore>=87&&r.margin<=-12);
    return {score:Math.round(results.reduce((sum,r)=>sum+r.score,0)/results.length),status:accepted?"correct":wrong?"incorrect":"uncertain",mode:"handwriting",details:{reason:accepted?"matched":wrong?"different_character":"ambiguous",units:results}};
  }
  function recoverJoinedThai(parts,expected,candidates){
    if(Math.abs(parts.length-expected.length)!==1)return null;
    const candidatesToTry=[];
    if(parts.length<expected.length){
      for(let i=0;i<parts.length;i++)for(const fraction of [.28,.36,.44,.5,.56,.64,.72]){
        const cut=Math.round(parts[i].width*fraction),left=cropPart(parts[i],0,cut),right=cropPart(parts[i],cut,parts[i].width);
        if(!left||!right)continue;
        const a=normalize(left),b=normalize(right);
        const first=Math.max(...templates(expected[i]).map(t=>compare(a,t)));
        const second=Math.max(...templates(expected[i+1]).map(t=>compare(b,t)));
        if(Math.min(first,second)>=62)candidatesToTry.push({score:Math.min(first,second),parts:[...parts.slice(0,i),left,right,...parts.slice(i+1)]});
      }
    }else for(let i=0;i<parts.length-1;i++){
      const joined=joinParts(parts[i],parts[i+1]),input=normalize(joined);
      const score=Math.max(...templates(expected[i]).map(t=>compare(input,t)));
      if(score>=62)candidatesToTry.push({score,parts:[...parts.slice(0,i),joined,...parts.slice(i+2)]});
    }
    candidatesToTry.sort((a,b)=>b.score-a.score);
    for(const candidate of candidatesToTry.slice(0,4)){
      const result=classify(candidate.parts,expected,candidates);
      if(result.status==="correct"){
        result.details.reason="recovered_spacing";
        return result;
      }
    }
    return null;
  }
  function recognize(payload) {
    if(!ready)return {score:0,status:"uncertain",mode:"handwriting",details:{reason:"loading"}};
    const target=String(payload.target).trim(),expected=units(target),parts=segments(payload.canvas);
    if(!parts.length)return {score:0,status:"empty",mode:"handwriting",details:{reason:"empty"}};
    const options=payload.options||{},caseInsensitive=ignoresCase(target,options),english=/^[A-Za-z\s]+$/.test(target);
    const candidates=alphabet(target,options.language,caseInsensitive);
    if(candidates.some(unit=>!cache.has(unit))){prepare(target,options.language,options);return {score:0,status:"uncertain",mode:"handwriting",details:{reason:"loading"}};}
    if(english){
      const components=englishParts(payload.canvas);
      if(components.length===expected.length)return classify(components,expected,candidates,caseInsensitive);
      // Never merge an extra whole letter to manufacture the expected spelling.
      if(components.length>expected.length)return {score:0,status:"uncertain",mode:"handwriting",details:{reason:"segmentation",expected:expected.length,found:components.length}};
    }
    if(parts.length!==expected.length){
      const recovered=/[ก-๛]/u.test(target)&&expected.length>=2?recoverJoinedThai(parts,expected,candidates):null;
      return recovered||{score:0,status:"uncertain",mode:"handwriting",details:{reason:"segmentation",expected:expected.length,found:parts.length}};
    }
    return classify(parts,expected,candidates,caseInsensitive);
  }
  async function prepare(target,language,options={}){
    await readyPromise;if(!ready)return;
    const candidates=alphabet(String(target),language,ignoresCase(String(target),options));
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
