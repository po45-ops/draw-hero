(function () {
  "use strict";
  class GameAudio {
    constructor() { this.context = null; this.settings = { sound:true, effectsVolume:70 }; }
    configure(settings) { this.settings = settings || this.settings; if(!this.settings.sound)this.stopSpeech(); }
    stopSpeech(){
      if(window.speechSynthesis)window.speechSynthesis.cancel();
      if(this.speechButton)this.speechButton.setAttribute("aria-busy","false");
      this.speechButton=null;this.utterance=null;
      clearTimeout(this.speechWatchdog);
    }
    readQuestion(question,button,onUnavailable){
      this.stopSpeech();
      const report=message=>{if(onUnavailable)onUnavailable(message);};
      if(!this.settings.sound){report("เปิดเสียงในตั้งค่าก่อนนะ");return false;}
      if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){report("เบราว์เซอร์นี้ยังไม่รองรับเสียงอ่าน");return false;}
      const math=question.type.startsWith("math_");
      // Read only the problem, never the numerical solution.
      let text=math?question.display:question.reading||question.display;
      if(math)text=text.replace(/\+/g," บวก ").replace(/[−-]/g," ลบ ").replace(/×/g," คูณ ").replace(/÷/g," หาร ").replace(/=\s*\?/g," เท่ากับเท่าไร");
      const language=question.language==="en"?"en-US":"th-TH";
      const voices=window.speechSynthesis.getVoices().filter(voice=>voice.lang.toLowerCase().startsWith(language.slice(0,2)));
      if(!voices.length){report("อุปกรณ์ยังไม่มีเสียงอ่านภาษานี้ กรุณาเปิดเสียงภาษาไทย/อังกฤษในอุปกรณ์แล้วลองใหม่");return false;}
      const utterance=new window.SpeechSynthesisUtterance(text);
      utterance.lang=language;utterance.voice=voices.find(voice=>voice.localService)||voices[0];
      utterance.rate=.8;utterance.volume=Math.max(0,Math.min(1,(this.settings.effectsVolume||0)/100));
      this.utterance=utterance;this.speechButton=button;
      if(button)button.setAttribute("aria-busy","true");
      const finish=()=>{if(this.utterance!==utterance)return;if(button)button.setAttribute("aria-busy","false");this.utterance=null;clearTimeout(this.speechWatchdog);};
      utterance.onend=finish;utterance.onerror=event=>{finish();if(!["canceled","interrupted"].includes(event.error))report("เล่นเสียงไม่ได้ ลองกดฟังโจทย์อีกครั้ง");};
      this.speechWatchdog=setTimeout(finish,20000);
      window.speechSynthesis.speak(utterance);return true;
    }
    ensure() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        try { this.context = new AudioContext(); } catch (error) { return false; }
      }
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
      return true;
    }
    tone(frequency, duration, type, volume, delay) {
      if (!this.settings.sound || !this.ensure()) return;
      const ctx = this.context;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + (delay || 0);
      const level = Math.max(0, Math.min(1, (this.settings.effectsVolume || 0) / 100)) * (volume || .12);
      oscillator.type = type || "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(level, start + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start); oscillator.stop(start + duration + .03);
    }
    play(name) {
      const patterns = {
        click:[[420,.06,"sine",.08,0]],
        draw:[[260,.04,"sine",.025,0]],
        success:[[520,.12,"sine",.1,0],[780,.18,"sine",.1,.1]],
        wrong:[[180,.14,"sawtooth",.07,0],[120,.18,"sawtooth",.06,.12]],
        retry:[[360,.09,"sine",.06,0],[440,.13,"sine",.05,.1]],
        spell:[[260,.2,"triangle",.1,0],[540,.28,"sine",.12,.08],[880,.2,"sine",.06,.2]],
        hit:[[110,.09,"square",.08,0]],
        critical:[[165,.08,"square",.11,0],[420,.12,"sawtooth",.08,.04],[920,.2,"sine",.1,.1]],
        shield:[[280,.07,"triangle",.1,0],[190,.16,"square",.06,.06]],
        victory:[[392,.14,"sine",.1,0],[523,.14,"sine",.1,.13],[659,.3,"sine",.12,.26]]
      };
      (patterns[name] || patterns.click).forEach(note => this.tone(...note));
    }
  }
  window.DrawHero = window.DrawHero || {};
  window.DrawHero.Audio = new GameAudio();
})();
