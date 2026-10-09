# v1.2 profile expansion

The World Languages edition allows separate personal isolated-sign profiles for the 83 source-listed languages. Only the ASL starter is pretrained. New selectors do not add linguistic recognition capability or a pretrained national-language model. See WORLD_LANGUAGES.md for IDs, resource scope and the 30-class/profile, 500-entry import limits. The original model architecture and limitations below remain applicable.

# SignVoice AI prototype model card

## Delivered recognition scope

| Profile | Immediately available | After local training |
| --- | --- | --- |
| ASL | One pretrained handshape: “I love you” | User-recorded, verified isolated signs |
| ISL | Hand tracking; no pretrained sign vocabulary | User-recorded, verified isolated signs |

This project is a functional **personal isolated-sign prototype**, not a complete ISL/ASL translator. It does not include a pretrained general-vocabulary ISL model. The reference library contains lesson links and a visual ASL alphabet, separate from recognition. No pretrained ASL alphabet classifier, arbitrary-sign recognition, automatic Hindi translation, facial grammar recognition, or sentence-level translator is claimed. There are no generated or hand-coded sign examples masquerading as a trained model.

## Reference lessons and typed-text practice

The October 9, 2026 snapshot indexes 15,438 official ISL video references (including variants and English/Hindi versions), 2,085 ASL word/concept links, and a separate 26-letter ASL chart. These metadata entries are **not training examples or model weights**. The app does not download or train on the linked videos. Only actual eligible local recordings enable personal recognition.

Typed text is normalized and greedily matched to the longest indexed phrase, then individual words. Unmatched Latin words can be ASL-fingerspelled; other unmatched words remain explicit gaps. The planner does not model sign-language grammar, spatial references, facial markers, word senses or inflection. The recognition badge uses the selected language and actual trained class, not the presence of a demonstration. Personal class labels may be mistaken or ambiguous; having a matching label is not independent semantic verification. Feedback reports the accepted class and does not grade signing form.

## Models

### Pretrained tracking and ASL starter

Google MediaPipe Tasks Vision 0.10.21 and the float16 Gesture Recognizer model, revision 1. The model detects hands, extracts landmarks, and classifies a small set of generic gestures. Only its `ILoveYou` output is admitted into the ASL profile. Closed fist, open palm, thumbs up/down, pointing and victory are not mapped to sign-language words.

The app checks the model score against a configurable default 0.80 and requires a 650 ms stable prediction. This score is not an independently calibrated accuracy estimate for this app. No ASL benchmark was run here.

Primary documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js

### Personal ISL and ASL models

The working trainer uses supervised exemplar learning with banded dynamic time warping (DTW). Training retains the real labeled landmark sequences and estimates per-class acceptance distances from within-class nearest-neighbor distances. This is a legitimate small-data classifier; it does not optimize a neural network or claim universal language understanding.

Each unmirrored frame has 132 values: two consistent left/right hand slots, each with 63 wrist-relative XYZ coordinates, absolute wrist XY and a presence mask. Relative coordinates use wrist-to-middle-MCP distance as scale. Absolute position is included to partially retain two-hand relationships; without a body reference this is sensitive to camera framing. Handedness and occlusion errors propagate into the features.

The worker maintains a 2.2-second sliding window at a target 15 inference frames/second, resamples to 24 steps and compares to templates. Temporal comparison handles modest changes in signing speed. Missing-hand mismatches are penalized; blank frames do not become a recognized sign. Training requires at least three full recordings per sign and three neutral/background recordings. Classes with fewer recordings are omitted. A trained neutral class is required before any personal prediction.

A prediction must be within a conservative distance radius and have relative separation of at least 0.16 from the next class. The displayed personal match score is a heuristic similarity, **not a calibrated probability**. The 650 ms hold/release gate suppresses repeated output. A neutral pause or lowering hands rearms the same sign; a different recognized sign can be accepted next.

No sign-language accuracy is measured or guaranteed. Three examples are only a functional minimum. Start with 3–5 clearly distinguishable signs, collect 6–12 examples per class across varied sessions, and include neutral/irrelevant hand movements. Similar handshapes, signer variation, rapid movement, self-occlusion and lighting can fail. Some motion signs may require completing the motion and briefly holding the final position for the rolling window to stabilize.

## Datasets and rights

The delivered personal model uses only recordings collected by the user. No third-party sign-language training-video/pose dataset is bundled or represented as having trained this prototype. Public lesson metadata and a public-domain alphabet image are bundled for reference only; see `REFERENCE_LIBRARY.md` and `../THIRD_PARTY_NOTICES.md`.

| Candidate | Appropriate research use | Important limitation |
| --- | --- | --- |
| INCLUDE / OpenHands | Isolated ISL research and pose baselines | Match pose layout, label ordering, preprocessing and checkpoint provenance. OpenHands software is Apache-2.0; dataset terms are separate. Its repository says it is no longer actively maintained. |
| WLASL | Isolated ASL word recognition | The authors restrict the dataset to academic/computational use and disallow commercial use under its agreement. Source videos can disappear. A 2,000-word research dataset does not establish continuous translation. |
| iSign / CISLR | ISL research, with distinct translation and isolated-word tasks | Read each dataset's actual terms and annotations. Isolated labels and continuous translation pairs are different supervision. Domain and reference quality vary. |

Sources: https://github.com/AI4Bharat/OpenHands ; https://github.com/dxli94/WLASL ; https://exploration-lab.github.io/iSign/

An upstream code license does not grant rights to all training videos or derived models. Review the specific dataset/checkpoint terms before redistribution or deployment. Obtain consent for your own recordings and have fluent ISL/ASL signers verify their labels. These are practical requirements for dataset use, not evidence that the personal browser prototype used those datasets.

## Evaluation

`node training/evaluate.mjs recordings.json ISL session report.json` evaluates the shipped classifier with leave-one-group-out folds. Each class needs at least 3 examples outside each held-out group. Use `signer` as the group field to measure unseen-signer generalization. For session holdout, record multiple actual sessions, rather than changing IDs on adjacent frames. For signer holdout, collect actual different signers.

The report contains confusion counts, full-clip classification accuracy, rejection rate and background false-acceptance rate. It does not measure webcam event segmentation or grammatical translation. Also evaluate idle-camera false events/hour, duplicated speech, event precision/recall, latency and recovery from low-confidence detections in live use. Hold back unrelated unknown signs as negatives; three rest examples cannot describe the open world.

Automated fixtures are synthetic numbers used to verify algorithms. They are **not** sign-language data and must not be used to claim sign recognition accuracy.

## Privacy and accessibility

Frames stay in the browser's camera/worker pipeline and are discarded. Audio capture is not requested. Landmark recordings, labels and settings remain in IndexedDB/local storage until deleted. Conversation persistence is off by default. Exports contain landmarks, labels and signer/session IDs, not RGB video. Treat these files as user data.

External reference playback and source links contact Google Drive, YouTube or lesson websites. Imported reference metadata stays in IndexedDB and is deleted by Delete all local data. Reference requests do not upload the webcam stream. Tracking assets and models are served locally; network access is needed for external lessons, and may be needed by speech voices.

Speech uses browser/OS voices. Some voices synthesize through network services; the application cannot promise offline speech for every installed voice. English/Hindi selection controls voice pronunciation, not translation. A Hindi spoken phrase must be supplied in Hindi; unavailable Hindi voices are reported explicitly.

Auto-speech is off by default. Users can review and correct messages before speaking. This prototype should not be treated as a substitute for a qualified interpreter where precise communication is essential.
