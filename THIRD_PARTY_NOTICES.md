# Third-party notices and provenance

The original SignVoice AI application source is supplied under the MIT license in `LICENSE`. Upstream model/runtime assets retain their own terms.

## Experimental ASL character motion engine (v1.5)

- Upstream: `nirholas/three.ws`, `packages/sign-language`, pinned commit `66624fbe184f50ae55f89fa01537d99497984cfd`.
- Source: https://github.com/nirholas/three.ws/tree/66624fbe184f50ae55f89fa01537d99497984cfd/packages/sign-language
- License: Apache License, Version 2.0; copyright 2026 nirholas. Full license and upstream README are included in `dist/vendor/sign-avatar/` with `PROVENANCE.json`.
- Vendored modules: canonical rest skeleton, finger handshapes/fingerspelling, sign rig, clip timeline, dictionary and speech compiler. SignVoice modifies `sign-speech.js` to use stride 1 for scalar facial tracks when joining clips. The change is identified in the file header and provenance record.
- Original application motion overrides for WANT, GO and HOME are informed by ASL University / Lifeprint descriptions: https://www.lifeprint.com/asl101/pages-signs/w/want.htm , https://www.lifeprint.com/asl101/pages-signs/g/go.htm , https://www.lifeprint.com/asl101/pages-signs/h/home.htm . These source links are available during playback. No source videos, images or lesson text are bundled for these animations.
- The motion engine is an experimental English-order lexical animation system, not a trained sentence translator. Neither its signs nor SignVoice's character/overrides have been validated by Deaf signers.

## MediaPipe Tasks Vision

- Package: `@mediapipe/tasks-vision`, version **0.10.21**.
- Upstream: https://github.com/google-ai-edge/mediapipe
- Package distribution: https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/
- License: Apache License, Version 2.0. Copyright Google LLC / MediaPipe contributors. Included source headers are preserved.
- Vendored files: `vision_bundle.mjs` and the SIMD/non-SIMD `vision_wasm*_internal.js` and `.wasm` artifacts.
- License text: `dist/vendor/mediapipe/LICENSE`.

## Gesture Recognizer model

- Upstream MediaPipe model bundle, float16, revision **1**.
- Source: https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task
- Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
- Used for two-hand tracking and the limited pretrained `ILoveYou` classifier only.
- No proprietary or researcher-provided ISL/ASL dictionary model is bundled.
- See upstream model documentation/metadata for model-specific terms and training provenance. Asset integrity hashes are listed in `dist/assets.sha256`.

No WLASL, INCLUDE, CISLR or iSign video/pose dataset is distributed in this project. References to them describe future research options, not training data used here. Synthetic numerical test fixtures are not signs.

## ISL reference metadata

- Official source: Indian Sign Language Research and Training Centre, https://islrtc.nic.in/ and its publicly linked directory https://drive.google.com/drive/folders/1U-Pr4r1-cupgNOOq9NH_uTsQnPSVEKco .
- Bundled metadata: public video titles, source IDs, source links and directory names in `dist/catalog/isl.json`; fetched October 9, 2026. No video/audio files are copied or distributed.
- Demonstrations play from the public source's Google Drive player when requested. Source ownership and terms remain with ISLRTC and credited contributors. Public access is not represented as blanket permission to redistribute videos or train a model.

## ASL lesson references

- Source: ASL University / Lifeprint, Dr. Bill Vicars, https://www.lifeprint.com/dictionary.htm .
- Bundled metadata: word/concept titles and reference URLs exposed by the A–Z indexes in `dist/catalog/asl.json`.
- Permission page: https://www.lifeprint.com/asl101/pages-layout/permission.htm . It permits linking; the app links to source lessons and does not copy/embed ASLU lesson text, images, video or curriculum. Attribution does not grant redistribution rights.

## Public-domain ASL alphabet chart

- File: `dist/media/asl-alphabet.png`.
- Creator: Darren Stone / Dancor; Wikimedia Commons file `Asl_alphabet_gallaudet_ann.png`.
- Source and public-domain declaration: https://commons.wikimedia.org/wiki/File:Asl_alphabet_gallaudet_ann.png .
- Original asset: https://upload.wikimedia.org/wikipedia/commons/4/4a/Asl_alphabet_gallaudet_ann.png .
- The original sheet is displayed whole and through CSS letter viewports; J/Z motion arrows remain part of the source image. The short handshape instructions in `dist/alphabet.js` are original application text. The chart supports visual reference, not a trained alphabet classifier.

## International resource directory
Factual resource metadata and language identifiers were checked against Universität Hamburg’s Sign Language Dataset Compendium v1.5.0 on October 9, 2026. Each resource retains its source-record URL; external video media remain with their providers. Citation: Kopf, M., Schulder, M., & Hanke, T. (2022), The Sign Language Dataset Compendium: Creating an Overview of Digital Linguistic Resources. https://www.sign-lang.uni-hamburg.de/lr/compendium/ . Media rights are not transferred by this app’s MIT source-code license.

## v1.3 learning links and embeds
Language learning links are attributed in `dist/learning-resources.js`. Deaf Action's BSL alphabet is linked to its Vimeo player (537654929). Surdités Info Service's LSF dactylologie is linked to its YouTube player (2-n1icoDxLM). These external videos are not copied, modified, cached offline or included in the application license; provider restrictions and availability apply. Other alphabet resources open at their official/community sources. Personal lesson links, images and videos must be verified by their owner and used with the relevant permission and consent.
