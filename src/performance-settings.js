/** Replicated presentation configuration, never a clock or choreography timeline. */
export const DEFAULT_PERFORMANCE=Object.freeze({energy:1.8,lightingEnabled:true,lightingLevel:.85});
export function performanceSettings(settings={}){
 const finite=(value,fallback,lo,hi)=>Number.isFinite(value)?Math.max(lo,Math.min(hi,value)):fallback;
 return Object.freeze({energy:finite(settings.energy,DEFAULT_PERFORMANCE.energy,0,3),lightingEnabled:typeof settings.lightingEnabled==='boolean'?settings.lightingEnabled:DEFAULT_PERFORMANCE.lightingEnabled,lightingLevel:finite(settings.lightingLevel,DEFAULT_PERFORMANCE.lightingLevel,0,1)});
}
