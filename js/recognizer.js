(function () {
  "use strict";
  const SIZE = 64;

  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  function flatten(strokes) { return (strokes || []).reduce((all, stroke) => all.concat(stroke.points || []), []); }
  function metrics(strokes) {
    const points = flatten(strokes);
    if (points.length < 2) return null;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,pathLength=0;
    points.forEach(point => { minX=Math.min(minX,point.x);minY=Math.min(minY,point.y);maxX=Math.max(maxX,point.x);maxY=Math.max(maxY,point.y); });
    (strokes || []).forEach(stroke => { for(let i=1;i<stroke.points.length;i+=1) pathLength += distance(stroke.points[i-1],stroke.points[i]); });
    const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY),diag=Math.hypot(width,height);
    const first=points[0],last=points[points.length-1];
    let corners=0,turning=0;
    for(let i=6;i<points.length-6;i+=6){
      const a=points[i-6],b=points[i],c=points[i+6];
      const angle1=Math.atan2(b.y-a.y,b.x-a.x),angle2=Math.atan2(c.y-b.y,c.x-b.x);
      let delta=Math.abs(angle2-angle1); if(delta>Math.PI) delta=2*Math.PI-delta;
      turning+=delta; if(delta>.62) corners+=1;
    }
    return {points,minX,minY,maxX,maxY,width,height,diag,pathLength,aspect:width/height,closed:distance(first,last)<diag*.28,corners,curvature:turning/Math.max(1,points.length/6),first,last,strokes:strokes.length};
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function proximity(value,target,tolerance){return clamp(1-Math.abs(value-target)/tolerance,0,1);}

  function geometry(strokes,target){
    const m=metrics(strokes);
    if(!m || m.pathLength<12) return {score:0,mode:"geometry",details:m};
    let score=0;
    if(target==="—" || target==="-" || target==="_"){
      score=100*(.55*proximity(m.aspect,5,5)+.25*proximity(m.pathLength/m.width,1.08,.9)+.2*(m.strokes===1));
    } else if(target==="|"){
      score=100*(.55*proximity(m.aspect,.15,.55)+.25*proximity(m.pathLength/m.height,1.08,.9)+.2*(m.strokes===1));
    } else if(target==="/" || target==="\\"){
      const dx=m.last.x-m.first.x,dy=m.last.y-m.first.y,diagRatio=Math.abs(dx)/Math.max(1,Math.abs(dy));
      const orientation=target==="/" ? dx*dy<0 : dx*dy>0;
      score=100*(.45*proximity(diagRatio,1,.85)+.3*proximity(m.pathLength/m.diag,1,.7)+.25*(orientation?1:0));
    } else if(target==="⌒"){
      score=100*(.35*proximity(m.aspect,1.8,1.5)+.35*(m.curvature>.04?1:.35)+.3*(m.closed?0:1));
    } else if(target==="⌁"){
      score=100*(.35*proximity(m.aspect,2.3,2)+.35*clamp(m.corners/3,0,1)+.3*(m.closed?0:1));
    } else if(target==="○" || target==="O" || target==="0"){
      score=100*(.42*proximity(m.aspect,1,.72)+.33*(m.closed?1:.25)+.25*proximity(m.pathLength/m.diag,2.3,1.25));
    } else if(target==="△"){
      score=100*(.28*proximity(m.aspect,1,.8)+.27*(m.closed?1:.2)+.45*proximity(m.corners,3,3));
    } else if(target==="□" || target==="▭" || target==="◇"){
      const aspectTarget=target==="▭"?1.65:1;
      score=100*(.3*proximity(m.aspect,aspectTarget,1)+.28*(m.closed?1:.2)+.42*proximity(m.corners,4,3));
    } else if(target==="⬭"){
      score=100*(.45*proximity(m.aspect,1.65,1.2)+.35*(m.closed?1:.25)+.2*proximity(m.pathLength/m.diag,2.25,1.2));
    } else if(target==="☆" || target==="⬡" || target==="⌂"){
      const expected=target==="☆"?8:target==="⬡"?6:5;
      score=100*(.25*proximity(m.aspect,1,.9)+.25*(m.closed?1:.25)+.5*proximity(m.corners,expected,5));
    } else if(target==="♡"){
      score=100*(.3*proximity(m.aspect,1,.85)+.35*(m.closed?1:.25)+.35*(m.curvature>.045?1:.35));
    } else score=55;
    return {score:Math.round(clamp(score,0,100)),mode:"geometry",details:{aspect:+m.aspect.toFixed(2),closed:m.closed,corners:m.corners,pathLength:Math.round(m.pathLength)}};
  }

  function cropBounds(canvas){
    const ctx=canvas.getContext("2d",{willReadFrequently:true}),data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;
    for(let y=0;y<canvas.height;y+=1){for(let x=0;x<canvas.width;x+=1){const i=(y*canvas.width+x)*4;if(data[i+3]>30){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}}
    return maxX<0?null:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
  }
  function normalize(canvas){
    const bounds=cropBounds(canvas); if(!bounds) return null;
    const out=document.createElement("canvas");out.width=SIZE;out.height=SIZE;
    const ctx=out.getContext("2d",{willReadFrequently:true});
    const scale=Math.min(50/bounds.w,50/bounds.h),w=bounds.w*scale,h=bounds.h*scale;
    ctx.drawImage(canvas,bounds.x,bounds.y,bounds.w,bounds.h,(SIZE-w)/2,(SIZE-h)/2,w,h);
    const raw=ctx.getImageData(0,0,SIZE,SIZE).data,binary=new Uint8Array(SIZE*SIZE);
    for(let i=0;i<binary.length;i+=1) binary[i]=raw[i*4+3]>35?1:0;
    return {binary,bounds,aspect:bounds.w/Math.max(1,bounds.h)};
  }
  function targetCanvas(character,fontFamily,fontWeight){
    const canvas=document.createElement("canvas");canvas.width=720;canvas.height=420;
    const ctx=canvas.getContext("2d");ctx.fillStyle="#000";ctx.textAlign="center";ctx.textBaseline="middle";
    const length=Array.from(String(character).replace(/\s+/g," ")).length;
    const size=length<=1?300:length<=3?230:length<=6?150:length<=12?92:58;
    ctx.font=`${fontWeight||700} ${size}px ${fontFamily||"Kanit, Tahoma, Arial, sans-serif"}`;
    ctx.fillText(character,canvas.width/2,canvas.height/2+12,canvas.width-42);return canvas;
  }
  function nearby(binary,x,y,radius){
    let best=Infinity;
    for(let yy=Math.max(0,y-radius);yy<=Math.min(SIZE-1,y+radius);yy+=1){for(let xx=Math.max(0,x-radius);xx<=Math.min(SIZE-1,x+radius);xx+=1){if(binary[yy*SIZE+xx])best=Math.min(best,Math.hypot(xx-x,yy-y));}}
    return best;
  }
  function directionalScore(source,target,radius=5){
    let count=0,total=0;
    for(let y=0;y<SIZE;y+=1){for(let x=0;x<SIZE;x+=1){if(source[y*SIZE+x]){count+=1;const d=nearby(target,x,y,radius);total+=Number.isFinite(d)?Math.max(0,1-d/(radius+1)):0;}}}
    return count?total/count:0;
  }
  function compareNormalized(a,b,strict){
    const radius=strict?2:5;
    const forward=directionalScore(a.binary,b.binary,radius),back=directionalScore(b.binary,a.binary,radius);
    const aspect=proximity(a.aspect,b.aspect,Math.max(1,b.aspect));
    const shape=Math.sqrt(forward*back);
    return clamp((shape*.82+Math.min(forward,back)*.08+aspect*.1)*100,0,100);
  }
  function numericSegments(canvas,count){
    const bounds=cropBounds(canvas);if(!bounds||count<1)return [];
    if(count===1)return [normalize(canvas)].filter(Boolean);
    const ctx=canvas.getContext("2d",{willReadFrequently:true}),data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const occupied=[];
    for(let x=bounds.x;x<bounds.x+bounds.w;x+=1){let hasInk=false;for(let y=bounds.y;y<bounds.y+bounds.h;y+=1){if(data[(y*canvas.width+x)*4+3]>30){hasInk=true;break;}}occupied.push(hasInk);}
    const gaps=[];let start=-1;
    occupied.forEach((hasInk,index)=>{if(!hasInk&&start<0)start=index;if((hasInk||index===occupied.length-1)&&start>=0){const end=hasInk?index:index+1;if(start>1&&end<occupied.length-1)gaps.push({start,end,width:end-start});start=-1;}});
    const selected=gaps.sort((a,b)=>b.width-a.width).slice(0,count-1).map(gap=>bounds.x+(gap.start+gap.end)/2).sort((a,b)=>a-b);
    while(selected.length<count-1)selected.push(bounds.x+bounds.w*(selected.length+1)/count);
    selected.sort((a,b)=>a-b);
    const edges=[bounds.x,...selected,bounds.x+bounds.w],segments=[];
    for(let index=0;index<count;index+=1){const left=Math.floor(edges[index]),right=Math.ceil(edges[index+1]),width=Math.max(1,right-left),part=document.createElement("canvas");part.width=width;part.height=canvas.height;part.getContext("2d").drawImage(canvas,left,0,width,canvas.height,0,0,width,canvas.height);const normalized=normalize(part);if(normalized)segments.push(normalized);}
    return segments;
  }
  function recognizeNumber(canvas,target){
    const digits=Array.from(String(target));if(!digits.length||digits.some(char=>!/\d/.test(char)))return null;
    const segments=numericSegments(canvas,digits.length);if(segments.length!==digits.length)return {match:false,recognized:"",score:0,confidence:-100,digits:[]};
    const results=segments.map((segment,index)=>{
      const scores=Array.from({length:10},(_,digit)=>{
        let score=0;[targetCanvas(String(digit)),targetCanvas(String(digit),"Arial, sans-serif",400),targetCanvas(String(digit),"Tahoma, sans-serif",400)].forEach(sample=>{const normalized=normalize(sample);if(normalized)score=Math.max(score,compareNormalized(segment,normalized,false));});return {digit:String(digit),score};
      }).sort((a,b)=>b.score-a.score);
      const targetScore=scores.find(item=>item.digit===digits[index]).score,best=scores[0],runner=scores.find(item=>item.digit!==digits[index]);
      return {target:digits[index],recognized:best.digit,targetScore:Math.round(targetScore),bestScore:Math.round(best.score),margin:Math.round(targetScore-(runner?runner.score:0))};
    });
    return {match:results.every(item=>item.recognized===item.target),recognized:results.map(item=>item.recognized).join(""),score:Math.round(results.reduce((sum,item)=>sum+item.targetScore,0)/results.length),confidence:Math.min(...results.map(item=>item.margin)),digits:results};
  }
  function raster(userCanvas,target,options){
    const user=normalize(userCanvas); if(!user) return {score:0,mode:"raster",details:{reason:"empty"}};
    const strict=!!(options&&options.strict);
    const variants=[targetCanvas(target),targetCanvas(target,"Arial, sans-serif",400),targetCanvas(target,"Tahoma, sans-serif",400)];
    let best=0;
    variants.forEach(canvas=>{const normalized=normalize(canvas);if(normalized)best=Math.max(best,compareNormalized(user,normalized,strict));});
    if(options && options.templateCanvases){options.templateCanvases.forEach(canvas=>{const normalized=normalize(canvas);if(normalized)best=Math.max(best,compareNormalized(user,normalized,strict));});}
    let runnerUp=0,runnerUpTarget="";
    if(strict&&options&&Array.isArray(options.candidates)){
      Array.from(new Set(options.candidates.map(value=>String(value).trim()).filter(value=>value&&value!==String(target).trim()))).forEach(candidate=>{
        let candidateScore=0;
        [targetCanvas(candidate),targetCanvas(candidate,"Arial, sans-serif",400),targetCanvas(candidate,"Tahoma, sans-serif",400)].forEach(canvas=>{
          const normalized=normalize(canvas);if(normalized)candidateScore=Math.max(candidateScore,compareNormalized(user,normalized,true));
        });
        if(candidateScore>runnerUp){runnerUp=candidateScore;runnerUpTarget=candidate;}
      });
    }
    const numeric=options&&options.numeric?recognizeNumber(userCanvas,target):null;
    return {score:numeric?numeric.score:Math.round(best),mode:"raster",details:{aspect:+user.aspect.toFixed(2),strict,runnerUp:Math.round(runnerUp),margin:Math.round(best-runnerUp),runnerUpTarget,numeric}};
  }
  function recognize(payload){
    if(payload.mode==="geometry") return geometry(payload.strokes,payload.target);
    return raster(payload.canvas,payload.target,payload.options);
  }
  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Recognizer = { recognize, geometry, raster, metrics, recognizeNumber };
})();
