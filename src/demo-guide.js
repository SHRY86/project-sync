const STEPS=Object.freeze([
 ['Start synchronised peers','Load your WAV before starting, or use the gentle synthetic Frère Jacques guide. A peer gossips one countdown; no peer becomes a master clock.',ui=>ui.start()],
 ['Stress the whole network','All peers experience 150 ms latency, ±60 ms jitter and 30% loss. Watch the active-group graph and every pair, not just an isolated performer.',ui=>ui.setNetwork({lossProbability:.3,latency:150,jitter:60})],
 ['Increase network stress','500 ms latency, ±200 ms jitter and 50% loss challenge relative-delay estimation. The graph shows measured disagreement, not a promised zero error.',ui=>ui.setNetwork({lossProbability:.5,latency:500,jitter:200})],
 ['Restore and observe convergence','Only fault settings change. No beat reset or reference-clock command is sent. Song playback ends once; P2P clocks keep exchanging for the stress experiment.',ui=>ui.restore()],
 ['Coordinate a peer variation','With communication restored, propose a future colour change requiring all three approvals. Isolation and kill/rejoin remain optional card controls.',ui=>ui.fleet.propose()]
]);
export class DemoGuide{
 constructor(ui){this.ui=ui;this.index=0;this.panel=document.getElementById('demoGuide');document.getElementById('demoButton').onclick=()=>this.toggle();document.getElementById('nextDemo').onclick=()=>this.next();document.getElementById('closeDemo').onclick=()=>this.panel.hidden=true;}
 toggle(){this.panel.hidden=!this.panel.hidden;this.index=0;this.caption('Main demo: peer synchronisation under whole-network stress. Advance when the measured result is visible.');}
 caption(message){document.getElementById('demoCaption').textContent=message;document.getElementById('nextDemo').textContent=this.index<STEPS.length?`Next: ${STEPS[this.index][0]}`:'Run again';}
 async next(){if(this.index>=STEPS.length)this.index=0;const [title,caption,action]=STEPS[this.index];document.getElementById('nextDemo').disabled=true;try{await action(this.ui);this.index++;this.caption(`${this.index}/${STEPS.length} · ${title}. ${caption}`);}finally{document.getElementById('nextDemo').disabled=false;}}
}
