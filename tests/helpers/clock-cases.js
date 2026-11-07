export const clockCases=[0,50,150,500].flatMap(latency=>[
 {name:`${latency}ms fixed`,latency},
 {name:`${latency}ms jitter / 30% loss`,latency,jitter:Math.max(30,latency*.6),loss:.3},
]);
clockCases.push(
 {name:'100% loss after start',latency:50,blackout:true},
 {name:'long isolation / reconnect',latency:150,jitter:60,loss:.3,isolation:true},
 {name:'kill / peer-only rejoin',latency:150,jitter:60,loss:.3,kill:true},
 {name:'lost start cues / listening join',latency:150,loseCues:true},
 {name:'realistic ppm / isolation',latency:150,isolation:true,profile:'realistic'},
 {name:'asymmetric paths',latency:150,asymmetric:true}
);
