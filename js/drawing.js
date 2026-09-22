(function () {
  "use strict";
  class DrawingBoard {
    constructor(canvas, options) {
      this.canvas=canvas;this.ctx=canvas.getContext("2d");this.options=options||{};
      this.strokes=[];this.redoStack=[];this.activeStroke=null;this.tool="pen";this.width=13;
      this.guide="";this.guideMode="none";this.guideOpacity=1;this.fadeTimer=0;
      this.bind();this.redraw();
    }
    bind(){
      this.onDown=this.pointerDown.bind(this);this.onMove=this.pointerMove.bind(this);this.onUp=this.pointerUp.bind(this);
      this.canvas.addEventListener("pointerdown",this.onDown);this.canvas.addEventListener("pointermove",this.onMove);
      this.canvas.addEventListener("pointerup",this.onUp);this.canvas.addEventListener("pointercancel",this.onUp);
      this.canvas.addEventListener("contextmenu",event=>event.preventDefault());
    }
    point(event){const rect=this.canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*this.canvas.width/rect.width,y:(event.clientY-rect.top)*this.canvas.height/rect.height,pressure:event.pressure||.5};}
    pointerDown(event){event.preventDefault();this.canvas.setPointerCapture(event.pointerId);this.activeStroke={tool:this.tool,width:this.width,points:[this.point(event)]};this.strokes.push(this.activeStroke);this.redoStack=[];this.drawDot(this.activeStroke.points[0],this.activeStroke);if(this.options.onStart)this.options.onStart();}
    pointerMove(event){if(!this.activeStroke)return;event.preventDefault();const next=this.point(event),points=this.activeStroke.points,previous=points[points.length-1];points.push(next);this.drawSegment(previous,next,this.activeStroke);}
    pointerUp(event){if(!this.activeStroke)return;event.preventDefault();this.activeStroke=null;if(this.options.onChange)this.options.onChange(this.strokes);}
    drawDot(point,stroke){this.ctx.save();this.ctx.globalCompositeOperation=stroke.tool==="eraser"?"destination-out":"source-over";this.ctx.fillStyle="#172438";this.ctx.beginPath();this.ctx.arc(point.x,point.y,stroke.width/2,0,Math.PI*2);this.ctx.fill();this.ctx.restore();}
    drawSegment(from,to,stroke){this.ctx.save();this.ctx.globalCompositeOperation=stroke.tool==="eraser"?"destination-out":"source-over";this.ctx.strokeStyle="#172438";this.ctx.lineWidth=stroke.width;this.ctx.lineCap="round";this.ctx.lineJoin="round";this.ctx.beginPath();this.ctx.moveTo(from.x,from.y);this.ctx.lineTo(to.x,to.y);this.ctx.stroke();this.ctx.restore();}
    setTool(tool){this.tool=tool;}
    setWidth(width){this.width=Number(width)||13;}
    setGuide(text,mode){clearTimeout(this.fadeTimer);this.guide=String(text||"");this.guideMode=mode||"none";this.guideOpacity=1;this.clear(false);if(mode==="fade"){this.fadeTimer=setTimeout(()=>{this.guideOpacity=0;this.redraw();},1500);}}
    drawGuide(){if(!this.guide||this.guideMode==="none"||this.guideOpacity<=0)return;const ctx=this.ctx,length=Array.from(this.guide.replace(/\s+/g," ")).length;ctx.save();ctx.globalAlpha=(this.guideMode==="full"?.22:.3)*this.guideOpacity;ctx.fillStyle="#46617a";ctx.strokeStyle="#46617a";ctx.textAlign="center";ctx.textBaseline="middle";const size=length<=1?this.canvas.height*.7:length<=3?this.canvas.height*.55:length<=6?this.canvas.height*.36:length<=12?this.canvas.height*.23:this.canvas.height*.15;ctx.font=`700 ${Math.max(42,Math.min(300,size))}px Kanit, Tahoma, Arial, sans-serif`;if(this.guideMode==="dotted"){ctx.setLineDash([7,10]);ctx.lineWidth=3;ctx.strokeText(this.guide,this.canvas.width/2,this.canvas.height/2+10,this.canvas.width-36);}else ctx.fillText(this.guide,this.canvas.width/2,this.canvas.height/2+10,this.canvas.width-36);ctx.restore();}
    redraw(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.drawGuide();this.strokes.forEach(stroke=>{if(!stroke.points.length)return;this.drawDot(stroke.points[0],stroke);for(let i=1;i<stroke.points.length;i+=1)this.drawSegment(stroke.points[i-1],stroke.points[i],stroke);});}
    clear(notify=true){this.strokes=[];this.redoStack=[];this.activeStroke=null;this.redraw();if(notify&&this.options.onChange)this.options.onChange(this.strokes);}
    undo(){const stroke=this.strokes.pop();if(stroke)this.redoStack.push(stroke);this.redraw();}
    redo(){const stroke=this.redoStack.pop();if(stroke)this.strokes.push(stroke);this.redraw();}
    hasDrawing(){return this.strokes.some(stroke=>stroke.tool!=="eraser"&&stroke.points.length>0);}
    exportInkCanvas(){const canvas=document.createElement("canvas");canvas.width=this.canvas.width;canvas.height=this.canvas.height;const ctx=canvas.getContext("2d");this.strokes.forEach(stroke=>{if(stroke.tool==="eraser")return;ctx.strokeStyle="#000";ctx.fillStyle="#000";ctx.lineWidth=stroke.width;ctx.lineCap="round";ctx.lineJoin="round";const points=stroke.points;if(!points.length)return;ctx.beginPath();ctx.arc(points[0].x,points[0].y,stroke.width/2,0,Math.PI*2);ctx.fill();if(points.length>1){ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i+=1)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();}});return canvas;}
    destroy(){clearTimeout(this.fadeTimer);this.canvas.removeEventListener("pointerdown",this.onDown);this.canvas.removeEventListener("pointermove",this.onMove);this.canvas.removeEventListener("pointerup",this.onUp);this.canvas.removeEventListener("pointercancel",this.onUp);}
  }
  window.DrawHero = window.DrawHero || {};
  window.DrawHero.DrawingBoard = DrawingBoard;
})();
