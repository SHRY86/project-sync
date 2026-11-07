/** Read-only receipt-aligned history; null observations leave visible gaps. */
export class PhaseGraph {
  constructor(path,axis){this.path=path;this.axis=axis;this.history=[];this.last=-Infinity;}
  update(now,measurement){
    if(now-this.last<200)return;this.last=now;
    this.history.push({at:now,value:measurement?.disagreement??null});
    this.history=this.history.filter(p=>now-p.at<=60000);
    const values=this.history.filter(p=>p.value!==null),max=Math.max(.1,...values.map(p=>p.value))*1.15;
    let d='',connected=false;
    for(const point of this.history){if(point.value===null){connected=false;continue;}const x=600-(now-point.at)/100,y=65-point.value/max*60;d+=`${connected?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;connected=true;}
    this.path.setAttribute('d',d);this.axis.textContent=`Scale 0–${max.toFixed(2)} beats · ${(max*500).toFixed(0)} ms`;
  }
}
