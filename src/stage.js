import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
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
      if (!state) return;
      const { pose, light } = state;
      const dancer = this.dancers[i];
      dancer.root.position.x = (i - 1) * 3.5 + pose.offset;
      dancer.root.position.y = pose.hop;
      dancer.torso.rotation.z = pose.body;
      dancer.torso.rotation.y = pose.turn;
      dancer.arms[0].rotation.z = -.25 + pose.armL * .7;
      dancer.arms[1].rotation.z = .25 - pose.armR * .7;
      dancer.legs[0].rotation.x = pose.legL;
      dancer.legs[1].rotation.x = pose.legR;
      dancer.glow.position.x = dancer.root.position.x;
      dancer.glow.intensity = 5 + light.intensity * 11;
      this.spots[i].intensity = 25 + light.intensity * (light.chorus ? 120 : 85);
      this.spots[i].target.position.x = (i - 1) * 3.5 + light.pan;
    });
    this.renderer.render(this.scene, this.camera);
  }
  resize() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height);
  }
}
