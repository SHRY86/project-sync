const STEPS=Object.freeze([
 ['Start the concert','The selected peer gossips the one-time countdown. Each performer then owns its own clock.',ui=>ui.start()],
 ['Isolate LUNA','Wait 8–10 seconds. LUNA free-runs; watch disagreement rise. No agent receives a conductor beat.',ui=>ui.isolate(1,true)],
 ['Degrade the network','30% receiver loss, 150 ms latency, ±60 ms jitter. Receive/drop counts measure actual injected events.',ui=>ui.setNetwork({lossProbability:.3,latency:150,jitter:60})],
 ['Kill NOVA','This terminates a real Worker. LUNA and ECHO continue; audio survives with the remaining parts.',ui=>ui.killOrRejoin(0,false)],
 ['Rejoin NOVA','An empty Worker learns phase from peers. LUNA is still isolated, so full-group agreement is not expected yet.',ui=>ui.killOrRejoin(0,true)],
 ['Propose an encore','LUNA cannot approve while isolated. Wait for “canonical fallback”; a unanimous local gate is not partition-safe consensus.',ui=>ui.fleet.propose()],
 ['Restore peer communication','Watch the curve fall and recovery time settle. This changes faults only; no phase reset is sent.',ui=>ui.restore()],
 ['Propose together','All three peers can now approve a future gold-light variation. End with the claims/evidence panel.',ui=>ui.fleet.propose()]
]);
export class DemoGuide {
 constructor(ui){this.ui=ui;this.index=0;this.panel=document.getElementById('demoGuide');document.getElementById('demoButton').onclick=()=>this.toggle();document.getElementById('nextDemo').onclick=()=>this.next();document.getElementById('closeDemo').onclick=()=>this.panel.hidden=true;}
 toggle(){this.panel.hidden=!this.panel.hidden;this.index=0;this.caption('A 60-second story, advanced manually. Press Next when the result is visible.');}
 caption(message){document.getElementById('demoCaption').textContent=message;document.getElementById('nextDemo').textContent=this.index<STEPS.length?`Next: ${STEPS[this.index][0]}`:'Run again';}
 async next(){if(this.index>=STEPS.length)this.index=0;const [title,caption,action]=STEPS[this.index];document.getElementById('nextDemo').disabled=true;try{await action(this.ui);this.index++;this.caption(`${this.index}/${STEPS.length} · ${title}. ${caption}`);}finally{document.getElementById('nextDemo').disabled=false;}}
}
