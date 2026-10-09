# SignVoice AI — World Languages v1.3

## World Languages learning edition

The requested ASL, Indian ISL, BSL, Auslan, NZSL, French LSF, Mexican LSM, Chinese CSL, Zimbabwean ZGS/ZSL, JSL, Libras, LSE, DGS, LIS, SASL, Norwegian NS/NTS, HKSL, Korean KSL, Taiwan TSL, Filipino FSL, Kenyan KSL, LGP and International Sign choices are available with full names. Duplicated Auslan appears once.

Typed sentences become ordered vocabulary practice with playable-video counts, missing-word lookup, verified lesson-link editing, and local video/image playback. Select **Watch sequence** and use **Next sign** for provider videos; local videos can advance automatically when they end. Alphabet guides are linked or embedded where verified. The full dictionaries/alphabets of every listed language are not bundled.

The app now includes 87 language profiles, 91 resource records and 73 country/territory associations. Browse by country or language, open provider demonstrations, bookmark resources, keep learning notes, and study permission-confirmed local clips with speed and loop controls. All listed profiles have separate user-trainable isolated-sign vocabularies.

**Coverage remains partial.** International providers are linked at source; their videos are not copied into this repository. The original 15,438 ISL references, 2,085 ASL lesson links and ASL alphabet remain indexed. Other profiles use source guides, verified saved/imported references and permitted local videos or images for typed word practice. Only ASL “I love you” has pretrained recognition. This is a functional learning platform with limited personal recognition, not a complete translator for all sign languages.

Run `npm start` and open http://localhost:3000. New users can begin in **World languages**. No npm installation step is required. Optional offline downloads, app icons, privacy/usage pages, compatible static-host headers and Netlify publishing configuration are included.

See [Sentence & alphabet practice](docs/SENTENCE_PRACTICE.md), [World languages](docs/WORLD_LANGUAGES.md) and [Publishing](docs/PUBLISHING.md). The v1.1 documentation below describes the retained ASL/ISL core.


A desktop-webcam web application with searchable ASL/ISL references, typed-text vocabulary practice, real hand tracking, live isolated-sign recognition, subtitles, an editable message composer, speech, and separate trainable ISL and ASL vocabularies.

**Scope:** ASL ships with one pretrained “I love you” handshape. ISL and broader ASL recognition require real, labeled recordings through the included trainer. This is a functional personal recognition prototype—not a complete pretrained bilingual translator. Continuous signing is an expansion plan, not a delivered translation feature.

Version 1.1 includes **15,438 ISL video references**, **2,085 ASL word/concept lesson links** and **26 ASL letter diagrams**. These are a source-directory snapshot, not every sign in either language. ISL counts include variants and English/Hindi versions; they are not counts of distinct words. Dictionary availability does not mean that the camera recognizes those entries.

## Run on Windows

1. Extract this ZIP, for example to `D:\SignVoice-AI`.
2. Install Node.js 20 or newer if it is not already installed.
3. Open Command Prompt:

```bat
cd /d D:\SignVoice-AI
npm start
```

4. Open **http://localhost:3000** in desktop Chrome or Edge.
5. Select **Enable camera**, grant camera permission, and keep both hands visible.

There is no `npm install` step, backend server, database account, or API key for the browser application. The source is plain JavaScript and static HTML/CSS. Bundled MediaPipe JS/WASM/model assets are served locally.

If port 3000 is already used, Command Prompt:

```bat
set SIGNVOICE_PORT=3001
npm start
```

PowerShell:

```powershell
cd D:\SignVoice-AI
$env:SIGNVOICE_PORT = "3001"
npm start
```

macOS/Linux:

```bash
cd SignVoice-AI
npm start
```

You can also serve the `dist` folder with Python:

```bat
cd /d D:\SignVoice-AI\dist
py -m http.server 3000 --bind 127.0.0.1
```

Use `localhost`, not a file URL or an unencrypted LAN IP. Camera permission requires a secure context (HTTPS or localhost). The included development server binds to your computer only. For HTTPS deployment, host the contents of `dist` with `.wasm` files served as `application/wasm` and module scripts as JavaScript. Private hosting may require signing in.

## First working ASL test

In **Live interpreter**, select ASL and enable the camera. Extend your thumb, index finger and little finger, keeping the middle and ring fingers folded, for the ASL “I love you” handshape. Hold briefly. The subtitle and conversation should show “I love you”. Review the message and click **Speak message**. Lower your hands for about a second before repeating. The trained classifier is from MediaPipe; generic gestures are not relabeled as sign-language words.

Enable **Auto-speak** if you want accepted matches spoken immediately. It is off by default and resets off when the page reloads. Recognition errors can still occur.

## Type text and learn the actions

1. Open **Text → sign practice**, choose ASL or ISL, type words or a phrase, and click **Show me the signs**. For example, start with `hello water thank you`.
2. Choose a practice step. For ISL, select **Play demonstration** to watch the official source video, or **Open video separately** if embedding fails. For ASL words, **Open source sign lesson** opens the lesson on Lifeprint; its lessons are linked rather than copied or embedded.
3. Follow the source's complete demonstration: fingers, palm orientation, location, motion and facial expression. Confirm the intended word sense, and select another indexed variant when needed. The app does not generate an animation for unknown signs.
4. Unmatched English words in ASL can be fingerspelled with the included public-domain alphabet chart and short handshape instructions. J and Z require motion. ISL has no automatic fingerspelling fallback. Missing words are marked explicitly.
5. Select **Enable camera** in the practice panel. Only a step marked pretrained or personally trained can receive recognition feedback. **Train this sign** opens the recorder with its language and label prefilled. Train that sign plus background examples, return, and rebuild the sequence if needed.
6. Accepted signs appear as subtitles and in Conversation, and can be spoken through the message controls. Optional **Advance after this sign is recognized** moves to the next practice step when the actual trained class matches. A match does not assess every detail of signing technique.

This is **lexical vocabulary practice, not sentence translation**. It matches the longest available phrases and otherwise works through words in input order; it does not convert English/Hindi grammar into ASL/ISL grammar. Fingerspelling a word is not a substitute for learning its lexical sign. Ask fluent signers to validate usage.

In **Sign library**, choose a reference language, search words/concepts, filter by initial/category and page through the catalog. Additional verified reference catalogs can be imported as JSON; these references do not add trained recognition. See `docs/REFERENCE_LIBRARY.md` for the schema, sources, permissions and refresh command.

## Train ISL and more ASL signs

1. Open **Teach a sign**, choose ISL or ASL, and enable the camera. The recording screen includes a live preview.
2. Enter a verified sign label and the spoken words you want. Choose static handshape or motion, then create the sign.
3. Record **at least 3 independent examples**. Each take has a 3-second preparation countdown and a 2.2-second capture window. Perform the whole sign during that window. For motion signs, finish the motion and briefly hold its final position.
4. Create **Neutral / background** for that language and record at least 3 examples of varied resting hands and unrelated movements. These are never spoken.
5. Click **Train selected language**. Classes with insufficient examples are excluded. Try the trained language in the Live interpreter.
6. Add additional distinguishable signs and retrain. Start with 3–5 signs. Use 6–12 examples per class for a more useful personal baseline. Record with varied speed, hand position and real sessions. Ask fluent signers to validate labels and signs.

Models are trained by storing and calibrating recorded temporal examples; this is a supervised DTW exemplar classifier, not a hard-coded finger-count dictionary. ISL and ASL examples never mix. There is no synthetic “ISL” recognition fallback.

Recordings are saved in browser IndexedDB. Models are rebuilt from eligible recordings when you reload. Removing an example invalidates that language’s current personal model until retraining. You can remove an individual take, delete a sign, export/import all recordings as JSON, and delete local data from Settings. Export before clearing browser storage or moving to another device/origin. Changing the server port changes the browser origin and its stored recordings.

## Speech, subtitles and messages

Recognized labels appear as live subtitles and in Conversation. Their configured spoken words append to the editable message. Click Speak message to read it, or replay an individual recognized item. Export conversation text when needed.

English and Hindi speech use available browser/OS voices. Selecting Hindi changes pronunciation; **it does not translate English**. Supply each sign’s spoken phrase in Hindi to produce Hindi content. If no Hindi voice is installed, the app reports that limitation. Install a Hindi system voice or use English. Some system voices use network synthesis; only voices reporting local service can offer local speech.

Camera frames are not uploaded or stored. The shipped application uses no microphone. Settings, imported reference entries and hand-landmark training examples stay on the device. Conversation history stays in memory unless local history saving is enabled. Opening external lessons or playing reference videos contacts their respective sites and requires network access; the reference player does not receive webcam frames. Auto-speech, video privacy, and speech-service behavior are separate controls.

## Evaluation and optional research tools

```bash
npm test
npm run check
node training/evaluate.mjs signvoice-recordings.json ISL session evaluation.json
```

The evaluator holds out complete sessions or signers, not random frames. Each class needs at least 3 examples remaining in training outside every held-out group. Record distinct real sessions and varied negatives. The shipped test fixtures verify recognition algorithms, rejection, feature order and repeat suppression; they are not real sign-language recordings or an accuracy benchmark.

### Import your own or licensed isolated videos

Use Python 3.10–3.12 in a virtual environment for the pinned extractor. Windows:

```bat
py -3.11 -m venv .venv-extract
.venv-extract\Scripts\activate
pip install -r training\extraction-requirements.txt
python training\extract_clips.py training\manifest.example.json --output signvoice-recordings.json
```

First copy and replace the example manifest with paths to real verified videos. Each clip should contain one complete isolated sign, already trimmed to around 1.3–4 seconds, using the same unmirrored camera convention. Add at least 3 clips per sign and a background class. Import the resulting JSON in Sign library. Dataset licenses and annotation formats must be handled before extraction; the script does not scrape or redistribute dataset videos.

### Optional neural baseline

The optional PyTorch trainer is separate from the running browser model:

```bat
py -3.11 -m venv .venv-train
.venv-train\Scripts\activate
pip install -r training\requirements.txt
python training\train_temporal.py signvoice-recordings.json --language ISL --group session --validation-group session-2 --test-group session-3 --output training\output\isl
```

Use the actual session IDs from your exported recordings. Every class needs >=3 training examples, >=1 validation example, and >=1 test example in distinct groups. The trainer exports TorchScript weights and ordered label metadata. It is an isolated-window research baseline, **not integrated with browser inference** and not a continuous translator. See the expansion document for the integration and evaluation work required.

## Source map

| File | Purpose |
| --- | --- |
| `dist/index.html`, `styles.css`, `app.js` | UI, camera lifecycle, training, subtitles and speech |
| `dist/vision.worker.js` | Off-thread MediaPipe tracking and personal model inference |
| `dist/recognition.js` | Feature contract, temporal matching, rejection and speech gate |
| `dist/storage.js` | Browser recording persistence |
| `dist/learning-ui.js`, `lesson-engine.js` | Reference search, phrase planning and guided webcam practice |
| `dist/alphabet.js`, `media/asl-alphabet.png` | ASL letter instructions and public-domain visual chart |
| `dist/catalog/` | ASL/ISL reference metadata and coverage snapshot |
| `dist/config.js` | Pinned local tracking assets and inference settings |
| `dist/vendor/`, `dist/models/` | Bundled upstream runtime/model assets |
| `scripts/serve.mjs` | Dependency-free localhost server |
| `tests/recognition.test.mjs` | Automated algorithm/regression tests |
| `tests/lessons.test.mjs` | Phrase matching, language separation and reference validation tests |
| `scripts/refresh_catalog.py` | Refresh publicly linked reference metadata; does not download videos |
| `training/evaluate.mjs` | Grouped evaluation of the actual browser classifier |
| `training/extract_clips.py` | Own/licensed trimmed-video landmark extractor |
| `training/train_temporal.py` | Optional offline GRU baseline |
| `docs/MODEL_CARD.md` | Supported vocabulary, limitations and dataset provenance |
| `docs/CONTINUOUS_SIGNING.md` | Expansion architecture and evaluation plan |
| `docs/VALIDATION.md` | Verified checks and remaining verification limits |
| `docs/REFERENCE_LIBRARY.md` | Lesson sources, coverage and reference-import format |

## Troubleshooting

- **Camera denied:** allow camera permission in the browser site settings, then retry. Check Windows Settings → Privacy & security → Camera → allow desktop apps.
- **Camera busy:** close Zoom, Teams or other webcam applications. No camera found means a webcam is disconnected or disabled.
- **Tracking model fails:** verify that `dist/vendor` and `dist/models` were extracted intact. Use a current Chrome/Edge browser with WebAssembly, workers and worker dynamic imports enabled. The pinned MediaPipe loader uses a classic worker because it calls `importScripts`. `npm run check` verifies packaged assets.
- **No ISL matches:** no pretrained ISL vocabulary is included. Train a verified sign and background with at least 3 examples each, then select ISL in Live interpreter.
- **Reference video does not play:** check network access and open the source separately. Public-source videos may be removed, changed or blocked by browser/privacy settings. ASL word lessons intentionally open on their source website.
- **Typed text has missing words:** try a different spelling/word sense or use the full-source links. ASL English-word fingerspelling is optional. There is no guaranteed sign or translation for every possible input.
- **Motion sign not accepted:** slow down, complete the motion within about 2 seconds, hold briefly at the end, and pause between signs. Very similar or occluded signs need a stronger model; adding arbitrary labels does not teach semantics.
- **Repeated words:** lower your hands or return to a neutral pose for a second before repeating the same sign. A different recognized sign can follow without repeating the last one.
- **Speech silent:** choose an installed voice, set nonzero volume, press Speak message directly, and check system sound. Hindi requires an available Hindi voice.
- **Camera stops after switching browser tabs:** this is intentional; click Enable camera to resume. Switching app views keeps the camera running for training.
- **Recordings disappeared:** local browser storage is per origin/profile. Import your exported backup after changing browser, port or machine.

## Limitations and dataset sources

Both sign languages have grammar, spatial structure, facial markers and regional/signer variation. Hand-only isolated matching does not translate unrestricted sentences. Three samples are a working minimum, not a guarantee of accuracy. The personal match score is a distance heuristic, not confidence calibration. Review speech before using it for meaningful communication.

OpenHands offers research pose models across languages, but upstream software and dataset licenses differ and its repository is no longer actively maintained. WLASL is for isolated ASL words and disallows commercial data use under its agreement. iSign provides distinct ISL translation and recognition research tasks. None trained this delivered personal classifier. Read their actual terms before model or dataset integration:

- https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js
- https://github.com/AI4Bharat/OpenHands
- https://github.com/dxli94/WLASL
- https://exploration-lab.github.io/iSign/

See `docs/MODEL_CARD.md` for the full model limitations and `THIRD_PARTY_NOTICES.md` for asset provenance.
