/** Bootstrapping and fault injection only; this is NOT a show conductor. */
export class AgentFleet {
  constructor(onState) {
    this.onState = onState;
    this.workers = [];
    this.states = Array(3).fill(null);
    this.isolated = false;
    this.packetLoss = false;
    this.clockNoise = 3;
  }
  start() {
    this.stop();
    this.states.fill(null);
    const session = crypto.randomUUID();
    // One-time start cue. Runtime decisions remain entirely inside each worker.
    const startAt = performance.timeOrigin + performance.now() + 400;
    for (let id = 0; id < 3; id++) {
      const worker = new Worker(new URL('./agent.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.type === 'state') { this.states[data.id] = data; this.onState?.(data); }
      };
      worker.onerror = (event) => console.error(`Agent ${id} crashed:`, event.message);
      worker.postMessage({ type: 'init', id, session, startAt, clockNoise: this.clockNoise });
      this.workers.push(worker);
    }
    this.applyNetwork();
  }
  applyNetwork() {
    this.workers.forEach((worker, id) => worker.postMessage({
      type: 'network', isolated: this.isolated && id === 1,
      lossProbability: this.packetLoss ? 0.6 : 0, clockNoise: this.clockNoise
    }));
  }
  stop() { this.workers.forEach(worker => worker.terminate()); this.workers = []; }
}
