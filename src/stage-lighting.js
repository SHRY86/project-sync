import * as THREE from 'three';
/** Output adapter: no beat calculation, timers or lighting-cue generation. */
export class StageLighting{
 constructor(scene){
  this.zones=[0,1,2].map(id=>{
   const x=(id-1)*3.5;
   const spot=new THREE.SpotLight(0xffffff,0,22,Math.PI/9,.8,1);spot.position.set(x+(id-1)*.45,6.5,-1.7);scene.add(spot,spot.target);
   const beam=new THREE.Mesh(new THREE.CylinderGeometry(.035,1,1,24,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}));beam.visible=false;scene.add(beam);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(1.22,.045,7,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.04,toneMapped:false}));ring.rotation.x=Math.PI/2;ring.position.set(x,.22,0);scene.add(ring);
   const floor=new THREE.Mesh(new THREE.CircleGeometry(1.20,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));floor.rotation.x=-Math.PI/2;floor.position.set(x,.21,0);scene.add(floor);
   const bars=Array.from({length:5},(_,i)=>{
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.30,1,.15),new THREE.MeshStandardMaterial({color:0x161023,emissive:0xffffff,emissiveIntensity:0,roughness:.5}));bar.position.set(x+(i-2)*.58,.35,-3.7);scene.add(bar);return bar;
   });
   return {x,spot,beam,ring,floor,bars,up:new THREE.Vector3(0,1,0),direction:new THREE.Vector3(),target:new THREE.Vector3()};
  });
 }
 apply(id,cue){
  const z=this.zones[id];
  if(!cue){z.spot.intensity=0;z.beam.visible=false;z.floor.material.opacity=0;z.ring.material.opacity=.04;z.bars.forEach(b=>b.material.emissiveIntensity=0);return;}
  z.target.set(z.x+cue.target.x,cue.target.y,cue.target.z);z.spot.target.position.copy(z.target);z.spot.color.setHex(cue.color);z.spot.intensity=cue.power;
  z.beam.visible=cue.beamOpacity>0;z.beam.material.color.setHex(cue.color);z.beam.material.opacity=cue.beamOpacity;
  z.direction.subVectors(z.spot.position,z.target);const length=z.direction.length();z.beam.position.copy(z.target).add(z.spot.position).multiplyScalar(.5);z.beam.quaternion.setFromUnitVectors(z.up,z.direction.normalize());z.beam.scale.set(cue.beamWidth,length,cue.beamWidth);
  z.ring.material.color.setHex(cue.color);z.ring.material.opacity=cue.ringOpacity;z.ring.scale.setScalar(cue.ringScale);
  z.floor.material.color.setHex(cue.color);z.floor.material.opacity=cue.floorOpacity;
  z.bars.forEach((bar,i)=>{const level=cue.barLevels[i];bar.scale.y=.35+level*2.2;bar.position.y=.18+bar.scale.y/2;bar.material.emissive.setHex(cue.color);bar.material.emissiveIntensity=level*2.5;});
 }
}
