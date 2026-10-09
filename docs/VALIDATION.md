# Validation and remaining limits

## Completed checks

- 23 Node tests cover stable left/right feature slots, missing hands, temporal resampling/DTW, near-match acceptance, unknown/background rejection, ISL/ASL separation, ambiguity rejection, minimum samples, malformed imports, repeated-event suppression and grouped evaluation, plus phrase matching, ASL fingerspelling, missing words, motion-letter guidance, recognition status, catalog search/paging and both bundled reference catalogs.
- `npm run check` checks JavaScript syntax, every statically referenced UI element, catalog schema/count consistency, the alphabet PNG signature, existence of the packaged model/runtime files, and WASM magic bytes.
- The publicly linked ISL directory tree was indexed across 45 folders with no failed folder requests. Its 15,438 video IDs are unique; variants/language versions are separate references. The fetched ASL A–Z indexes supply 2,085 word/concept links. Individual lessons/videos were not all viewed or linguistically validated, and future source availability is not guaranteed.
- The gesture task bundle was inspected as an archive: it contains trained hand detector, hand landmark detector, gesture embedder and canned gesture classifier models.
- Bundled MediaPipe assets are pinned to Tasks Vision 0.10.21; the gesture model is the upstream float16 revision 1. Integrity hashes are recorded in `dist/assets.sha256`.
- Upstream loader compatibility was checked in source. This version invokes `importScripts`, so the vision runtime uses a classic worker and dynamically imports the app’s shared ESM modules.
- Optional Python extraction and GRU-training scripts pass Python syntax compilation.

## Not verified in this environment

- Browser visual QA and a physical webcam session were unavailable. Camera permissions, worker/WebGL behavior on a specific browser/GPU, live recognition latency and audible speech need testing on the user’s machine. The app targets current desktop Chrome/Edge.
- No human-sign recordings were supplied. No ISL accuracy, unseen-signer accuracy, pretrained starter accuracy, or sentence-translation accuracy was measured. Numerical fixtures test algorithms, not sign-language understanding.
- Optional Python dependencies are not installed here, so video extraction and GRU training were not executed end to end. They are explicitly separate research tools, not hidden requirements for running the browser app.

## User acceptance checks

1. Enable the webcam on HTTPS/localhost, confirm both hands are tracked, and stop/restart the camera. Denied permission and a busy/disconnected webcam should show an actionable message.
2. In ASL mode, test the pretrained “I love you” handshape. Hold briefly, review the subtitle/message, and select Speak message. Hold the same sign to verify it is not emitted repeatedly; lower hands before repeating it.
3. In ISL mode with no personal model, confirm no ISL words are fabricated. Record a verified sign with three independent takes and three background takes, train, and try fresh performances.
4. Test neutral hands, unrelated gestures, occlusion and low light. Count false accepted signs; add varied negatives and reduce vocabulary if errors are frequent.
5. Remove a take, retrain, delete a sign, export/import recordings, reload, and confirm the local vocabulary is restored. Changing browser/origin requires importing a backup.
6. Test installed English/Hindi voices, speaking rate, volume, replay, cancel and history/export. Hindi selection should not silently translate English, and missing Hindi voices should be reported.
7. Collect real distinct sessions/signers and run the evaluator before making any accuracy claim. Test continuous webcam event quality separately from full-clip classification.
8. Open Text → sign practice, select each language and enter `hello water thank you`. Inspect each demonstrated concept and variant. Test an unknown English name with ASL fingerspelling, motion letters J/Z, and an unknown ISL word with the explicit missing-reference state. Do not expect sentence translation.
9. Browse/filter both catalogs. Test an ISL source player and its separate-open fallback; ASL lessons should open on their source website. Disable network and confirm local recognition remains independent of reference playback.
10. Practice an untrained reference and confirm it is marked training-needed. Train that language and sign with background examples, return to practice, and verify feedback/optional next-step behavior only follows accepted matches. Confirm changing the practice language changes the camera profile.
11. Export a practice plan, import an additional valid reference catalog, reload and verify persistence. Importing references must not create a trained webcam model. Delete local data and confirm imported references and recordings are removed.
