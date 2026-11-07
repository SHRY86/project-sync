import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AGENT_COLORS } from './score.js';

/** Visualization only: renders states chosen independently by the workers. */
export class ConcertStage {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#080d1d');
    this.scene.fog = new THREE.FogExp2(0x070b16, .025);
    this.camera = new THREE.PerspectiveCamera(39, 1, .1, 100);
    this.camera.position.set(0, 5.2, 17); this.camera.lookAt(0, 2, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    container.prepend(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xb8e6ff, 0x221734, 2.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(3, 8, 9); this.scene.add(key);
    this.drawStage();
    this.dancers = AGENT_COLORS.map((_, i) => this.makeDancer(i));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.cameraMode='front';this.assetStatus=Array(3).fill('Procedural fallback');this.loadModels();
  }
  async loadModels() {
    const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
    await Promise.all(['nova','luna','echo'].map(async(name,id)=>{
      try {
        const check=await fetch(`/models/${name}.vrm`,{method:'HEAD'});if(!check.ok || check.headers.get('content-type')?.includes('text/html'))return;
        const gltf=await loader.loadAsync(`/models/${name}.vrm`);const vrm=gltf.userData.vrm;if(!vrm?.humanoid)throw new Error('No VRM humanoid');
        VRMUtils.rotateVRM0(vrm);
        vrm.scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(vrm.scene);const height=bounds.max.y-bounds.min.y;
        if(!Number.isFinite(height)||height<.1)throw new Error('Invalid proportions');
        vrm.scene.scale.setScalar(3.5/height);vrm.scene.position.y=-bounds.min.y*3.5/height;
        const d=this.dancers[id];d.torso.visible=false;d.root.add(vrm.scene);d.vrm=vrm;d.rest=new Map();
        for(const bone of ['hips','spine','leftUpperArm','rightUpperArm','leftUpperLeg','rightUpperLeg']){const b=vrm.humanoid.getNormalizedBoneNode(bone);if(b)d.rest.set(bone,b.quaternion.clone());}
        this.assetStatus[id]='VRM loaded';
      }catch(e){this.assetStatus[id]=`Procedural fallback (${e.message})`;console.info(name,e);}
    }));
  }
  applyVRM(d,pose,state){
    const offsets={hips:[0,pose.turn,pose.body],spine:[0,pose.turn*.3,pose.body*.5],leftUpperArm:[0,0,1.25+pose.armL*.7],rightUpperArm:[0,0,-1.25-pose.armR*.7],leftUpperLeg:[pose.legL,0,0],rightUpperLeg:[pose.legR,0,0]};
    for(const [name,angles] of Object.entries(offsets)){const b=d.vrm.humanoid.getNormalizedBoneNode(name),rest=d.rest.get(name);if(b&&rest)b.quaternion.copy(rest).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles)));}
    // Synthetic vowels are coarse cues only, never asserted to match WAV lyrics.
    for(const vowel of ['aa','ih','ou','ee','oh'])d.vrm.expressionManager?.setValue(vowel,0);
    const vowel={a:'aa',i:'ih',u:'ou',e:'ee',o:'oh'}[state.voice.vowel];
    if(vowel)d.vrm.expressionManager?.setValue(vowel,state.playing && state.voice.pitch > 0 ? .15 : 0);
    d.vrm.expressionManager?.setValue('blink',Math.max(0,1-Math.abs((state.beat%9)-8.8)*10));
    d.vrm.update(1/60);
  }
  add(geometry, material, parent, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  drawStage() {
    const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x142442, metalness: .55, roughness: .3 });
    this.add(box(28, .35, 14), floorMat, this.scene, 0, -.25, 0);
    const platform = this.add(new THREE.CylinderGeometry(7.5, 8, .28, 64), floorMat, this.scene, 0, .02, -.7);
    const ring = this.add(new THREE.TorusGeometry(7.3, .055, 7, 80), new THREE.MeshBasicMaterial({ color: 0x44d7dc }), this.scene, 0, .19, -.7); ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < 15; i++) {
      const color = i % 2 ? 0x124365 : 0x492267;
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .9 });
      this.add(box(.84, 1.2 + ((i * 7) % 5) * .3, .22), mat, this.scene, (i - 7) * 1.65, 1.3, -6.3);
    }
    this.zoneRings=AGENT_COLORS.map((color,i)=>{
      const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65});
      const ring=this.add(new THREE.TorusGeometry(1.3,.025,6,64),mat,this.scene,(i-1)*3.5,.23,0);ring.rotation.x=Math.PI/2;return ring;
    });
    const accent = [0x42e8df, 0xff82c0, 0xb2a0ff];
    this.spots = accent.map((color, i) => {
      const s = new THREE.SpotLight(color, 80, 25, Math.PI / 7, .65, 1);
      s.position.set((i - 1) * 5, 8, -2); s.target.position.set((i - 1) * 3.5, 0, 0);
      this.scene.add(s, s.target);
      return s;
    });
  }
  makeDancer(id) {
    const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
    const color = AGENT_COLORS[id];
    const outfit = new THREE.MeshStandardMaterial({ color, roughness: .46 });
    const face = new THREE.MeshStandardMaterial({ color: 0xffded9, roughness: .8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x17152a, roughness: .55 });
    const hair = new THREE.MeshStandardMaterial({ color, roughness: .52 });
    const root = new THREE.Group(); root.position.x = (id - 1) * 3.5; this.scene.add(root);
    const torso = new THREE.Group(); root.add(torso);
    this.add(box(.8, 1.05, .4), outfit, torso, 0, 2.08);
    this.add(new THREE.CylinderGeometry(.45, .6, .5, 6), outfit, torso, 0, 1.47);
    this.add(new THREE.SphereGeometry(.45, 18, 12), face, torso, 0, 3.07);
    this.add(new THREE.SphereGeometry(.47, 18, 12, 0, Math.PI * 2, 0, Math.PI * .53), hair, torso, 0, 3.2);
    for (const sign of [-1, 1]) {
      this.add(box(.12, .10, .04), dark, torso, sign * .18, 3.08, .43);
      const tail = this.add(new THREE.ConeGeometry(.22, 1.1, 7), hair, torso, sign * .58, 2.86, -.18); tail.rotation.z = sign * .2;
    }
    const arms = [], legs = [];
    for (const sign of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(sign * .51, 2.5, 0); torso.add(arm);
      this.add(box(.25, .88, .27), face, arm, sign * .06, -.5); arms.push(arm);
      const leg = new THREE.Group(); leg.position.set(sign * .24, 1.31, 0); torso.add(leg);
      this.add(box(.30, .97, .34), dark, leg, 0, -.51);
      this.add(box(.34, .2, .53), outfit, leg, 0, -1, .1); legs.push(leg);
    }
    const glow = new THREE.PointLight(color, 10, 4.5); glow.position.set(root.position.x, 2.4, .5); this.scene.add(glow);
    return { root, torso, arms, legs, glow };
  }
  render(states) {
    states.forEach((state, i) => {
      this.dancers[i].root.visible=!!state&&!state.killed;
      if (!state || state.killed) {this.spots[i].intensity=0;this.dancers[i].glow.intensity=0;return;}
      const { pose, light } = state;
      const dancer = this.dancers[i];
      dancer.root.position.x = (i - 1) * 3.5 + pose.offset;
      dancer.root.position.y = pose.hop;
      if(dancer.vrm)this.applyVRM(dancer,pose,state);
      dancer.torso.rotation.z = pose.body;
      dancer.torso.rotation.y = pose.turn;
      dancer.arms[0].rotation.z = -.25 + pose.armL * .7;
      dancer.arms[1].rotation.z = .25 - pose.armR * .7;
      dancer.legs[0].rotation.x = pose.legL;
      dancer.legs[1].rotation.x = pose.legR;
      dancer.glow.position.x = dancer.root.position.x;
      dancer.glow.intensity = 5 + light.intensity * 11;
      const ring=this.zoneRings[i];ring.material.color.setHex(light.color);ring.material.opacity=.3+light.intensity*.5;ring.scale.setScalar(1+pose.hop*.3);
      this.spots[i].color.setHex(light.color);
      this.spots[i].intensity = 25 + light.intensity * (light.chorus ? 120 : 85);
      this.spots[i].target.position.x = (i - 1) * 3.5 + light.pan;
    });
    const beat=states.find(s=>s?.playing)?.beat||0;
    if(this.cameraMode==='orbit')this.camera.position.set(Math.sin(beat*.025)*14,6,Math.cos(beat*.025)*17);
    else if(this.cameraMode==='cinematic')this.camera.position.set(Math.sin(beat*.04)*5,4.5,13);
    else this.camera.position.set(0,5.2,17);
    this.camera.lookAt(0,2,0);
    this.renderer.render(this.scene, this.camera);
  }
  resize() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height);
  }
}
