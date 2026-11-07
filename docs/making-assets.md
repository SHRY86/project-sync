# Make your first concert assets

You can submit the project with its procedural characters and clearly labelled synthetic sound. Real voicebanks, avatars and motions are optional. The concert runs locally without accounts or cloud services. Some optional authoring tools below require downloads/accounts; none is a runtime dependency. This guide was checked against official documentation; the desktop authoring/export workflows were not run in this environment.

## Fastest option: original synthetic demo stems

Run `node scripts/make-demo-audio.mjs`. It creates `.demo-audio/nova.wav`, `luna.wav`, `echo.wav` and `concert-full.wav`, plus a text label. The folder is ignored by Git. In the concert, open **Load local assets → WAV stems or mix** and select the three stems together (the full mix is optional and will not play on top of stems). These are original simple instrumental oscillators, not singing, VOCALOID or a voicebank. They demonstrate genuinely separate stem scheduling without third-party media.

## Understand the target

A beat is a quarter note. At 120 beats/minute, each beat takes 0.5 seconds. A 4/4 bar has four beats, taking 2 seconds. **16 bars = 64 beats = 32 seconds.** A DAW is an audio editor with tracks on a timeline. A stem is one exported part, including silence where that part is absent. All exports must cover exactly the same 0–32-second range. Do not export just the vocal region starting later in the song.

Use original notes and lyrics. A simple plan: bars 1–2 intro, bars 3–8 verse, bars 9–14 chorus, bars 15–16 ending. These match the agent score sections. Begin with a four-note melody, one note per beat; duplicate it and change the final note. Add a bass note on each bar and a soft drum on beats 1 and 3. Keep levels below clipping and add short fades at the loop boundary. Avoid reverb tails beyond 32 seconds.

## GarageBand on a Mac: local workflow

1. Open GarageBand, make an empty project, and add a software-instrument track. Set the transport tempo to **120** and time signature **4/4**. Turn the metronome on while editing, not in exported audio.
2. Start your first region at **bar 1 beat 1**. Create 16 bars of music, ending at **bar 17 beat 1**. The bar-17 marker is the endpoint, not a seventeenth bar. Use the piano roll or musical typing to enter your own notes.
3. Put the lead/vocal part on a track named NOVA, harmony on LUNA, and bass/drums/backing on ECHO. Each stem can contain several tracks if you solo that group together.
4. Turn on Cycle and set the yellow range from bar 1 to bar 17. Use **Share → Export Song to Disk**, choose uncompressed WAVE, and export the cycle range. Menu wording varies by version. Solo NOVA, export `nova.wav`; solo LUNA, export `luna.wav`; solo ECHO, export `echo.wav`. Keep the cycle range unchanged for all three. Turn all parts on and export `concert-full.wav`.
5. Listen to the full mix and each solo stem. Import the files into this demo; it rejects duration outside **31.940–32.060 seconds**. If GarageBand adds tail audio, reopen the WAV in an audio editor and trim to exactly 32 seconds without trimming its initial silence. The browser adds only a 4 ms edge fade; it cannot repair a wrong arrangement or offset.

Search “Export songs to disk” in the [official GarageBand user guide](https://support.apple.com/guide/garageband/welcome/mac). Exact desktop menu interactions above remain manually unverified here.

## BandLab alternative

BandLab is an optional online authoring service and generally uses an account/cloud project; **PROJECT SYNC itself does not use it**. If you want an entirely local process, use GarageBand instead. In a new Studio song set 120 BPM and 4/4, arrange 16 bars from time zero, then download the individual tracks and mix. Inspect downloaded duration and initial silence; downloads may need a common 32-second trim. Rename the three aligned groups to the expected names. The [official download guide](https://help.bandlab.com/hc/en-us/articles/115002959774-Downloading-Mixdowns-and-Tracks) describes track/mix export. Availability and file formats depend on the authoring platform/version; do not rename compressed audio to pretend it is WAV.

## Add an actual sung melody

A speech engine is not automatically a singing engine. Use a piano-roll singing feature and an authorized voicebank, then bring its rendered WAV into the DAW. Set 120 BPM, enter a short original melody, attach a syllable to each note, render, and align the first intended note with the DAW grid. Export the **whole 32-second range** from the DAW afterward, including rests and initial silence.

- **VOICEVOX:** the official application documents prototype song and humming modes. Use its song piano roll, add notes and supported lyrics, select a compatible singer/style and render. Japanese syllable constraints can matter; test a short phrase first. Voice-specific attribution/use conditions still apply. Follow the [official song instructions](https://voicevox.hiroshiba.jp/how_to_use/).
- **Synthesizer V Studio Basic:** use it if you already have a legitimate Basic installer and compatible licensed/Lite database. Enter notes and syllables, render a vocal WAV, then align it in the DAW. Do not assume Basic, Lite banks or a permanent free download are currently available to everyone: the [official installer page](https://auth.dreamtonics.com/store/download) presents product-dependent access. A trial is not a guaranteed free submission licence; check the bank's terms separately. This route was not run here.
- **UTAU / OpenUtau:** UTAU is a singing editor, not a bundled licence for every voicebank. On Apple Silicon, OpenUtau is a more practical native path; its [official install instructions](https://github.com/openutau/OpenUtau/wiki/Install) list macOS builds. Install an authorized compatible bank, select the correct phonemizer, set tempo, draw notes, enter lyrics, render the vocal track, then align/export from the DAW. Voicebank compatibility varies. The [original UTAU site](https://utau2008.xrea.jp/) remains a separate project; do not assume Windows instructions work unchanged on a Mac.

You may place the lead singer in NOVA, harmony in LUNA and backing in ECHO, or use `concert-vocals.wav` plus `concert-instrumental.wav`. A premixed WAV gives this app no lyric timings. Its coarse mouth animation is not exact lip-sync. Do not describe VOICEVOX/UTAU/Synthesizer V output as a VOCALOID voicebank unless it actually is one.

## Make a character in VRoid Studio

Install VRoid Studio, create a new character, choose a base, and edit face, hair and clothing. Use your own textures or assets whose terms permit this use. Save the editable `.vroid` project for yourself. Export a **`.vrm`** from the export screen; `.vroid` is not the runtime format. Fill in the author/licence settings and prefer a self-contained VRM with embedded textures. The [official VRoid export help](https://vroid.pixiv.help/hc/en-us/articles/360014383713-How-to-create-a-VRM-file) explains the distinction and export route.

In PROJECT SYNC, choose the performer under **Load local assets**, then pick the VRM. Try one first, then repeat for the other performers. Invalid rigs, missing humanoid metadata or implausible dimensions leave that performer procedural. There are no bundled VRM models, so successful loading and artistic retargeting of your actual export still require manual QA.

## Optional dance motion → VRMA (conversion unverified)

VRM is an avatar; VRMA is a separate humanoid animation. Renaming `.fbx`, `.vmd` or `.glb` to `.vrma` does not convert it. The browser supports the [VRM Animation format](https://vrm.dev/vrma/) with the [official Three.js adapter](https://pixiv.github.io/three-vrm/docs/modules/three-vrm-animation.html).

A realistic path is **licensed Mixamo FBX → Blender → retarget/bake onto your VRM humanoid → VRMA export**. Import your VRM with the VRM add-on, import the FBX skeleton/action separately, map source hips/spine/limbs to the target humanoid, correct rest pose and scale, then bake the result into an action on the target armature. The add-on documents [VRMA export](https://vrm-addon-for-blender.info/en-us/ui/export_scene.vrma/). Installing the add-on alone does not guarantee that Mixamo bone names will retarget automatically.

For **MMD/VMD**, use a compatible MMD importer in Blender, retain required model/motion credits, retarget the imported motion to the VRM armature, bake, and use the same VRMA export. **Both retargeting paths, specific importer compatibility, root-motion cleanup and export settings are unverified in this environment.** Budget substantial time; use procedural choreography if conversion is troublesome. A different practical route is authoring a simple new action directly on the VRM rig in Blender and exporting that.

At 30 fps, a 32-second loop spans 960 frames (one loop endpoint should match the start). The app samples clip time = `(agentBeat modulo 64) × 0.5 seconds`, wrapping again at the clip's own duration if shorter. It does not time-stretch arbitrary motion to match music. Retiming to 120 BPM is your authoring responsibility. Prefer in-place motion; large root translations can move performers outside their stage zones. Load a VRM first, then select that performer's `.vrma`. Missing/invalid motion uses procedural dance. No demonstration clip is fabricated or bundled.

## File preparation and static manifests

The runtime file pickers are the easiest method. Files are decoded through temporary object URLs and are not uploaded or saved by the app. Reloading the page removes those imported assets.

For reusable local setup, place WAVs under `public/audio/` and add their filenames to `availableFiles` in `public/audio/manifest.json`. Paths for role names remain in that manifest. Declare only files actually present; an empty list intentionally avoids missing-file requests on a fresh clone. For example, `"availableFiles": ["nova.wav", "luna.wav", "echo.wav"]`. For VRM/VRMA, put files under `public/models/` and replace the corresponding null entries in its manifest with their local filenames. External model resources are blocked; embed textures/buffers. The runtime never fetches a cloud avatar URL.

Selection is exclusive: all three stems win over both mix files; the instrumental/vocals pair wins over the full mix; otherwise full mix; otherwise clearly labelled synthetic vowels. One partial stem or only the vocals file is not silently used as a complete show. Each asset report says what decoded and why the selected mode is active. WAV duration is checked, but tempo, content, rights and musical alignment cannot be inferred from that duration alone.

## Licence checklist

Before sharing, record the source, creator, licence text, required credit, redistribution permission and performance/video permission for each song, lyric, sample, voicebank, avatar, texture and motion. “Free download” does not imply redistribution or commercial rights. Confirm synthetic-voice terms and character restrictions separately. Use original composition or properly licensed material. Keep the media out of Git; check `git status` before committing. Manifests and source belong in the submission; deliver authorized media separately if permitted. No legal licence determination is automated by this app.

## Troubleshooting

| Symptom | Check |
|---|---|
| Rejected WAV | Confirm real WAV encoding and 32 s ±60 ms duration, not a renamed MP3. |
| Correct duration, wrong groove | Confirm 120 BPM / 4/4, no time-stretched import or pickup beat before bar 1. |
| Parts enter at different times | Export every stem from time zero; retain intentional leading silence; align all DAW regions. |
| Synthetic sound despite files | Read the mode/rejection report; complete the three-stem set or a supported mix alternative. |
| Doubled/too loud sound | The app chooses one mode; check your DAW or another browser tab is not also playing. |
| Click at loop | Trim tails, match boundary waveform/zero crossings, add fades; ensure a seamless arrangement. |
| Model remains procedural | Use exported VRM, not `.vroid`/FBX; embed resources; read the per-performer import error. |
| VRMA loads but nothing moves | Assign a VRM first, verify humanoid animation metadata, nonempty clip and retargeted tracks. |
| Pose moves offstage | Remove/bake unwanted root motion and fix rest pose in the authoring tool. |
| No sound | Press Start/Enable Audio, unmute the tab and OS output, raise master volume. |
