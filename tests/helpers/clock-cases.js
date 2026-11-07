export const clockCases = [0, 50, 150, 500].flatMap(latency => [
  {name:`${latency}ms fixed`, latency},
  {name:`${latency}ms + jitter`, latency, jitter:Math.max(120, latency*.8)},
  {name:`${latency}ms + jitter/loss/isolation`, latency, jitter:Math.max(120, latency*.8), loss:.3, isolation:true}
]);
clockCases.push({name:'100% packet loss',latency:500,jitter:400,loss:1});
clockCases.push({name:'drift stress + faults',latency:150,jitter:200,loss:.3,isolation:true,stress:true});
