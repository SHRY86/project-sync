import { AgentFleet } from './agents.js';
import { VocalMixer } from './audio.js';
import { ConcertStage } from './stage.js';
import { ConcertUI } from './ui.js';

const vocals = new VocalMixer();
const fleet = new AgentFleet();
const ui = new ConcertUI(fleet, vocals);
let stage;
try { stage = new ConcertStage(document.getElementById('stage')); }
catch (error) { ui.showError(`3D renderer failed: ${error.message}`); console.error(error); }
fleet.start();
setInterval(() => { ui.update(fleet.states); vocals.update(fleet.states); }, 100);
function animate() { stage?.render(fleet.states); requestAnimationFrame(animate); }
animate();
window.addEventListener('pagehide', () => fleet.stop());
