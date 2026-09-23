(function(){
  "use strict";
  const proto=window.DrawHero.DrawingBoard.prototype,original=proto.drawGuide;
  proto.drawGuide=function(){
    if(!this.practiceFrame){original.call(this);return;}
    const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;
    ctx.save();ctx.strokeStyle="#876d4670";ctx.lineWidth=2;ctx.setLineDash([8,9]);ctx.strokeRect(w*.08,h*.1,w*.84,h*.8);ctx.beginPath();ctx.moveTo(w*.08,h*.65);ctx.lineTo(w*.92,h*.65);ctx.stroke();ctx.restore();
    if(!this.guide||this.guideMode==="none"||this.guideOpacity<=0)return;
    const guide=this.practiceTemplate(this.guideMode==="dotted");ctx.save();ctx.globalAlpha=.2*this.guideOpacity;ctx.drawImage(guide,0,0,w,h);ctx.restore();
  };
  proto.practiceTemplate=function(dotted=false){
    const c=document.createElement("canvas"),rect=this.canvas.getBoundingClientRect();c.width=Math.max(100,Math.round(rect.width||720));c.height=Math.max(100,Math.round(rect.height||420));
    const ctx=c.getContext("2d"),font=/[ก-ฮ]/.test(this.guide)?"DH Thai Looped":"DH Handwriting";
    let size=c.height*.58;ctx.font=`${size}px "${font}"`;
    size=Math.min(size,c.width*.7/Math.max(1,ctx.measureText(this.guide).width)*size);ctx.font=`${size}px "${font}"`;
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#000";
    if(dotted){ctx.strokeStyle="#000";ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.strokeText(this.guide,c.width/2,c.height*.49);}else ctx.fillText(this.guide,c.width/2,c.height*.49);
    return c;
  };
  proto.practiceFit=function(){
    const ink=this.exportRecognitionCanvas(),template=this.practiceTemplate(),w=180,h=Math.max(80,Math.round(w*ink.height/ink.width));
    function mask(source){const c=document.createElement("canvas");c.width=w;c.height=h;const ctx=c.getContext("2d");ctx.drawImage(source,0,0,w,h);return ctx.getImageData(0,0,w,h).data;}
    const a=mask(ink),b=mask(template);let total=0,inside=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(a[(y*w+x)*4+3]>50){total++;if(x>=w*.06&&x<=w*.94&&y>=h*.08&&y<=h*.92)inside++;}
    if(!total)return {inside:0,coverage:0,precision:0};
    function coverage(from,to){let count=0,hit=0;const radius=Math.max(3,Math.round(Math.min(w,h)*.035));for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(from[(y*w+x)*4+3]>50){count++;let near=false;for(let dy=-radius;dy<=radius&&!near;dy++)for(let dx=-radius;dx<=radius;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&to[(yy*w+xx)*4+3]>50){near=true;break;}}if(near)hit++;}return hit/Math.max(1,count);}
    return {inside:inside/total,coverage:coverage(b,a),precision:coverage(a,b)};
  };
})();
