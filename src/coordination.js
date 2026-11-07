/** Unanimous approval gate, NOT partition-safe consensus/atomic commit. */
export class Coordination {
  constructor(id) { this.id=id; this.events=new Map(); this.status='Canonical score'; }
  valid(p, beat) { return p && Number.isInteger(p.origin) && p.origin>=0 && p.origin<3 && p.key===`${p.origin}:${p.target}` && Number.isInteger(p.target) && p.target%4===0 && p.target>=beat+2 && p.target<=beat+32; }
  propose(beat) { const target=Math.ceil((beat+12)/4)*4; return {type:'proposal',origin:this.id,target,key:`${this.id}:${target}`}; }
  receive(m, beat, send) {
    if(m.type==='proposal') {
      if(!this.valid(m,beat)) {if(!this.events.has(m?.key))this.status='Rejected stale/invalid proposal'; return;}
      if(!this.events.has(m.key)) this.events.set(m.key,{...m,acks:new Set([this.id])});
      send({type:'ack',key:m.key,target:m.target,origin:m.origin});
      this.status=`Voting: bar ${m.target/4+1}`;
    }
    if(m.type==='ack') {
      const p=this.events.get(m.key);
      if(p && beat<p.target-1 && m.target===p.target && Number.isInteger(m.id) && m.id>=0 && m.id<3) p.acks.add(m.id);
    }
  }
  update(beat) {
    let active=false;
    for(const [key,p] of this.events) {
      if(beat>=p.target-1 && p.approved===undefined) {p.approved=p.acks.size===3;this.status=p.approved?'Approved locally: colour encore':'Deadline missed: canonical fallback';}
      if(p.approved && beat>=p.target && beat<p.target+8) active=true;
      if(beat>p.target+8) this.events.delete(key);
    }
    return active;
  }
}
