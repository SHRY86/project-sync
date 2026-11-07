import { AgentFleet } from './agents.js';
import { VocalMixer } from './audio.js';
import { AssetUI } from './asset-ui.js';
import { ConcertUI } from './ui.js';
const audio=new VocalMixer(),fleet=new AgentFleet(),ui=new ConcertUI(fleet,audio);
let stage;
new AssetUI(audio,()=>stage,config=>fleet.configureSong(config));
// Renderer failure must not prevent independent workers, audio or controls.
import('./stage.js').then(({ConcertStage})=>{stage=new ConcertStage(document.getElementById('stage'));}).catch(e=>ui.showError(`3D unavailable: ${e.message}`));
document.getElementById('camera').onchange=e=>{if(stage)stage.cameraMode=e.target.value;};
setInterval(()=>{ui.update(fleet.states);audio.update(fleet.states);document.getElementById('modelStatus').textContent=stage?.assetStatus.map((s,i)=>`${['NOVA','LUNA','ECHO'][i]}: ${s}; ${stage.animationStatus[i]}`).join(' · ')||'Loading stage…';},50);
function frame(){stage?.render(fleet.states);requestAnimationFrame(frame);}frame();
window.addEventListener('pagehide',()=>{fleet.stop();audio.reset();audio.ctx?.close();});
