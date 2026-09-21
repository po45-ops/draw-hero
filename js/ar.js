(function () {
  "use strict";

  const $ = id => document.getElementById(id);

  class ARController {
    constructor(options={}){
      this.onStatus=options.onStatus||(()=>{});
      this.stream=null;
      this.facingMode="environment";
      this.requestId=0;
      this.bindControls();
    }
    bindControls(){
      const button=$("ar-camera-switch");
      if(button)button.addEventListener("click",()=>this.flip());
    }
    supported(){
      return Boolean(window.isSecureContext&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
    }
    setState(state,message){
      const field=$("battlefield"),status=$("ar-status");
      if(!field)return;
      field.classList.toggle("ar-loading",state==="loading");
      field.classList.toggle("ar-enabled",state==="ready");
      field.classList.toggle("ar-fallback",state==="fallback");
      if(status){status.dataset.state=state;status.querySelector("span").textContent=message;}
    }
    async start(){
      const requestId=++this.requestId;
      this.stopTracks();
      this.setState("loading","กำลังเชื่อมต่อกล้อง AR…");
      if(!this.supported()){
        this.setState("fallback","อุปกรณ์นี้ไม่รองรับกล้อง AR");
        this.onStatus("เปิดสนาม AR จำลองแทนกล้องจริง");
        return false;
      }
      try{
        const stream=await navigator.mediaDevices.getUserMedia({
          video:{facingMode:{ideal:this.facingMode},width:{ideal:1280},height:{ideal:720}},audio:false
        });
        if(requestId!==this.requestId){stream.getTracks().forEach(track=>track.stop());return false;}
        this.stream=stream;
        const video=$("ar-camera");
        video.srcObject=stream;
        video.classList.toggle("mirror",this.facingMode==="user");
        await video.play();
        this.setState("ready","LIVE • AR FIELD");
        this.onStatus(this.facingMode==="environment"?"เปิดสนาม AR ด้วยกล้องหลังแล้ว":"เปิดสนาม AR ด้วยกล้องหน้าแล้ว");
        return true;
      }catch(error){
        if(requestId!==this.requestId)return false;
        this.stopTracks();
        const denied=error&&["NotAllowedError","SecurityError"].includes(error.name);
        this.setState("fallback",denied?"ไม่ได้รับอนุญาตให้ใช้กล้อง":"ไม่พบกล้องที่พร้อมใช้งาน");
        this.onStatus(denied?"ไม่ได้รับอนุญาตใช้กล้อง — เล่นด้วยสนาม AR จำลองแทน":"เปิดสนาม AR จำลองแทนกล้องจริง");
        return false;
      }
    }
    async flip(){
      this.facingMode=this.facingMode==="environment"?"user":"environment";
      await this.start();
    }
    stopTracks(){
      if(this.stream)this.stream.getTracks().forEach(track=>track.stop());
      this.stream=null;
      const video=$("ar-camera");
      if(video){video.pause();video.srcObject=null;video.classList.remove("mirror");}
    }
    stop(){
      this.requestId+=1;
      this.stopTracks();
      const field=$("battlefield");
      if(field)field.classList.remove("ar-enabled","ar-loading","ar-fallback");
    }
  }

  window.DrawHero=window.DrawHero||{};
  window.DrawHero.ARController=ARController;
})();
