import { AGENT_NAMES, AGENT_COLORS } from './score.js';
const $ = id => document.getElementById(id);
const asHex = color => `#${color.toString(16).padStart(6, '0')}`;
function roundDelta(a, b) {
  const d = Math.abs(a - b) % 32;
  return Math.min(d, 32 - d);
}
export class ConcertUI {
  constructor(fleet, vocals) {
    this.fleet = fleet; this.vocals = vocals;
    $('audioButton').onclick = async () => {
      try { const enabled = await vocals.toggle(); $('audioButton').textContent = enabled ? '■ Mute synthesized vocals' : '▶ Enable synthesized vocals'; }
      catch (error) { this.showError(`Audio could not start: ${error.message}`); }
    };
    $('restartButton').onclick = () => fleet.start();
    $('isolateButton').onclick = () => { fleet.isolated = !fleet.isolated; fleet.applyNetwork(); this.refreshButtons(); };
    $('lossButton').onclick = () => { fleet.packetLoss = !fleet.packetLoss; fleet.applyNetwork(); this.refreshButtons(); };
    $('restoreButton').onclick = () => { fleet.isolated = fleet.packetLoss = false; fleet.applyNetwork(); this.refreshButtons(); };
    $('noise').oninput = event => { fleet.clockNoise = Number(event.target.value); $('noiseValue').textContent = `${fleet.clockNoise}×`; fleet.applyNetwork(); };
    $('barVisualization').innerHTML = Array.from({length: 13}, () => '<i></i>').join('');
    this.refreshButtons();
  }
  showError(message) { $('stageError').hidden = false; $('stageError').textContent = message; }
  refreshButtons() {
    $('isolateButton').textContent = this.fleet.isolated ? '✓ Reconnect LUNA' : '◎ Isolate LUNA';
    $('isolateButton').classList.toggle('active', this.fleet.isolated);
    $('lossButton').textContent = this.fleet.packetLoss ? '✓ Disable packet loss' : '◌ 60% packet loss';
    $('lossButton').classList.toggle('active', this.fleet.packetLoss);
    $('networkBadge').textContent = this.fleet.isolated ? '● LUNA ISOLATED' : this.fleet.packetLoss ? '● NETWORK UNSTABLE' : '● PEERS ONLINE';
    $('networkBadge').classList.toggle('warning', this.fleet.isolated || this.fleet.packetLoss);
    $('showStatus').textContent = this.fleet.isolated ? 'LUNA: offline from peers — choreography, lighting and vocal melody continue locally.' :
      this.fleet.packetLoss ? 'Unreliable P2P channel — agents use cached scores and local time.' :
      'All stage controllers are exchanging show-clock estimates.';
  }
  update(states) {
    if (states.some(s => !s)) return;
    const beat = states.map(s => s.beat);
    const error = Math.max(roundDelta(beat[0], beat[1]), roundDelta(beat[0], beat[2]), roundDelta(beat[1], beat[2]));
    $('beatError').textContent = error.toFixed(3);
    $('packetsDropped').textContent = states.reduce((sum, s) => sum + s.dropped, 0).toLocaleString();
    $('messagesReceived').textContent = states.reduce((sum, s) => sum + s.received, 0).toLocaleString();
    $('showBeat').textContent = states[0].beat.toFixed(1);
    $('agents').replaceChildren(...states.map((s, id) => {
      const row = document.createElement('div'); row.className = 'agent';
      const dot = document.createElement('div'); dot.className = 'dot'; dot.style.background = s.isolated ? '#ff7898' : asHex(AGENT_COLORS[id]);
      const details = document.createElement('div'); details.className = 'agent-detail';
      const name = document.createElement('b'); name.textContent = `${AGENT_NAMES[id]} / AGENT ${id + 1}`;
      const info = document.createElement('small'); info.textContent = `${s.section} · ${s.isolated ? 'HOLDOVER' : `${s.peers} PEERS`} · ${s.voice.vowel.toUpperCase()} ${s.voice.pitch ? Math.round(s.voice.pitch) + 'Hz' : 'REST'}`;
      details.append(name, info);
      const count = document.createElement('strong'); count.textContent = s.beat.toFixed(2);
      row.append(dot, details, count); return row;
    }));
  }
}
