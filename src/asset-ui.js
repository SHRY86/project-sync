const $=id=>document.getElementById(id);
export class AssetUI {
  constructor(audio,getStage){
    const report=message=>{$('importReport').textContent=message;};
    $('audioFiles').onchange=async event=>{try{const files=[...event.target.files];report('Decoding local WAVs…');report((await audio.loadFiles(files)).join('\n'));}catch(e){report(`Audio import failed: ${e.message}`);}event.target.value='';};
    for(const kind of ['model','animation'])$(`${kind}File`).onchange=async event=>{
      const file=event.target.files[0],id=Number($('assetPerformer').value),stage=getStage();
      if(!file)return;if(!stage){report('3D renderer unavailable; audio and agents still work.');return;}
      report(`Loading ${file.name} locally…`);
      const success=await (kind==='model'?stage.loadModelFile(id,file):stage.loadAnimationFile(id,file));
      report(`${['NOVA','LUNA','ECHO'][id]}: ${kind==='model'?stage.assetStatus[id]:stage.animationStatus[id]}${success?' · no upload':''}`);event.target.value='';
    };
  }
}
