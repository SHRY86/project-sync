/** Position comes only from this agent's score command. No wall-clock mixer.update. */
export function animationTime(beat,duration){if(!Number.isFinite(beat)||!Number.isFinite(duration)||duration<=0)throw new Error('Invalid animation beat/duration');return Math.max(0,Math.min(beat*.5,duration));}
export function sampleAnimation(mixer,beat,duration){const time=animationTime(beat,duration);mixer.setTime(time);return time;}
