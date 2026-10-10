# Sourced human motion and narration — v1.7

In Text → signs choose a sign language, then open **Language motion studio**. This editor uses the same textured human and synchronized hand close-ups. Nothing in an empty profile is presented as a sign.

1. Enter a word or complete phrase in the script you want to use, and an HTTPS demonstration source. Add a movement description and, optionally, review attribution and translated spoken instructions.
2. Set the signer's right/left hand state, handshape, body-relative position and offsets in metres. Finger and palm directions must use different axes. Set face/head movement, transition and hold durations.
3. Inspect the pose, add it as a step and repeat for the movement path. Preview the sequence before saving. The anatomical presets are a limited authoring vocabulary, not every possible handshape. Facial presets are geometric controls, not automatic grammar rules.
4. Save the motion and type its label in the practice text. Saving an existing normalized label replaces that motion in the current language. Review the geometry against the source with a fluent Deaf signer. Review names are author-supplied; no certification or identity verification occurs.
5. Export a backup; local storage is neither an account nor a shared dictionary. Settings' data deletion clears packs along with learning data.

Only experimental ASL animations are bundled. Other profiles (including Indian ISL and International Sign) require sourced motions to be entered or imported. The viewer and pack schema accept all 87 registered profiles; this is engine/storage support, not comprehensive linguistic coverage. Video/image imports and webcam recognition recordings do not become avatar motion. No learned text-to-sign model or video-to-motion extractor is delivered.

Matching normalizes labels, chooses the longest exact phrase first, and preserves input label order. Native-script words work; Chinese/Japanese use device word segmentation where available. Whitespace-separated labels and exact full phrases remain usable. Unavailable non-ASL words cause the entire animation to stop with a missing-label list; no foreign-language sign or alphabet is substituted. An authored full-phrase sequence can carry its own syntax, but the software does not generate grammar. ASL custom single-word motions can mix with bundled signs and explicitly labeled fingerspelling.

## Pack format

JSON `{ "version": 1, "motions": [] }` is the empty pack. Each motion contains:

| Field | Value |
|---|---|
| `language` | Registered ID, e.g. `ASL`, `ISL` (Indian), `ILS` (International Sign), `BFI` (BSL), `KVK` (Korean), `XKI` (Kenyan) |
| `label` | 1–200 characters, word or exact phrase |
| `source` | HTTPS reference URL without embedded credentials |
| `description`, `reviewer` | Optional text; supplied attribution is not independently verified |
| `speech` | Optional locale-to-text object, e.g. `{ "hi": "हाथों को देखें।" }`; text must already be in that spoken language |
| `phases` | 1–24 steps; each has `t` (.1–3 s), `hold` (0–3 s), `right`/`left`, `face`, and optional `head` |

A hand is `"rest"` or `{ "shape": "5", "at": { "anchor": "sternum", "out": 0.15, "up": 0, "forward": 0.2 }, "fingers": "up", "palm": "forward" }`. This example describes an arbitrary geometric pose, **not a validated sign**. Supported values match the editor selections. Head values are `nod` ±35°, `turn` ±45° and `tilt` ±25°. Offsets are ±.55 metres. Each motion may last up to 30 seconds; packs allow 200 motions and imports up to 1 MB. Invalid packs are rejected before replacing existing data. Duplicate normalized labels within one language are rejected. Import replaces matching entries only in their own profile.

## Speech

Spoken language is independent of sign language. Select an installed browser/OS voice. English reads the word and motion description; 11 additional languages have general coaching prompts. A personal motion's own narration for the selected locale takes priority. Other voice locales use user-entered narration rather than pretending to translate English.

Speech is opt-in. **Pause to hear guidance, then animate each word** freezes the animation clock until speech finishes or is canceled; the next motion then begins. Explain-current-movement pauses playback. Stop narration can release the waiting animation; pause/seek/input changes, reference mode, leaving practice and backgrounding cancel speech. Speed/volume settings affect narration only. Visible narration remains available. Matching voices are required; unavailable voices do not silently speak in another language. Browser/OS synthesis may use a remote speech service.

## Verification

Automated tests cover language separation, native-script matching, full-phrase priority, missing-word refusal, finite normalized motion tracks, bounded import validation, all registered profiles, narration locale selection and cancellation/completion. These verify software behavior, not sign accuracy. Physical webcam, browser WebGL rendering, voice playback and fluent Deaf signer comprehensibility review remain outstanding.
