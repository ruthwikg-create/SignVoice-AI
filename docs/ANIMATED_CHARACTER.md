# Human signing studio — v1.6

The default view is now a textured human model with depth, lighting, articulated hands and mapped facial channels. A dark blue shirt and selectable background contrast keep hands visible. Synchronized close-ups of the signer's right and left hand use the **same weighted mesh surface and skeleton** as the main character. The hand views do not synthesize a separate approximation.

Focus choices include face/arms/hands, both hands, or either isolated hand. Five viewing angles and zoom are available. For detailed study, use 0.25× speed, one-frame stepping, repeat-current-word or pause-after-every-word. Fullscreen enlarges the entire studio. Space and left/right arrow keys work when the studio itself has keyboard focus; they do not override text entry. System reduced-motion preferences prevent autoplay.

Save up to 20 phrases in the device phrasebook, load or remove them individually, and mark a sequence practiced. Review counts are self-reported and do not assert sign accuracy. Settings' Delete all local data also removes these phrases/counts. This data is local to the browser, without account synchronization.

In **Text → signs**, select **American Sign Language** and **Animated character**. Type `I want to go home`, then select **Show me the signs**. The character uses articulated shoulders, elbows, wrists and five jointed fingers per hand. Word subtitles and clickable word chips follow the playback clock. Pause, replay, seek, previous/next word, speed, loop and front/angled views are available.

For this example the sequence is **I → WANT → fingerspell TO → GO → HOME**. All input words remain visible. TO is not presented as a lexical sign. This preserves the written input's order; it is vocabulary practice, not a grammatical ASL translation of the sentence. Expressions, direction, inflection, regional variants and context require a fluent signer.

## Delivered motion coverage

The bundled motion dictionary contains 32 canonical word entries, plus GO and HOME. WANT is overridden with an open-hand-to-curled-hand motion. I aliases ME, HI aliases HELLO, and THANKS aliases THANK. There are **37 available input labels**. Other labels are fingerspelled; synonyms such as NEED/WANT, MY/ME and LIKE/GOOD are deliberately not treated as equivalent signs. ASL A–Z and digits 0–9 are available, including moving J/Z and repeated-letter transitions.

Only ASL character motion is supplied. Choosing ISL, BSL or any other language clears the animation and presents that language's existing source practice. The international resource library does not imply international avatar coverage. Personal webcam recordings and source videos do not automatically train this character.

Input is limited to English ASCII characters, 40 words, 400 characters and three minutes of resulting motion. Unsupported scripts, emoji and overlong clips receive an error rather than a silently shortened animation. The character's controls and old sequence reset whenever input or language changes. Source video playback stops when the ASL character takes over. Background tabs and leaving the practice view pause the character.

## Implementation and provenance

This is deterministic authored motion playback, **not generative AI**. No text-to-sign neural model, translation backend or API key is included. A JavaScript motion compiler produces quaternion and facial-weight tracks. Three.js retargets these onto the human model, with an upright bind orientation, preserved limb lengths and wrist inverse-kinematics correction. Playback uses `requestAnimationFrame`. The SVG renderer provides an enlarged lightweight hand fallback. No runtime npm installation or external avatar-service dependency is needed.

The human asset is adapted from the MIT-licensed SignON-realizer Eva model, pinned commit `61588cee7b5cae305a9d3eb3bbe52579e5e5805e`. It retains 15 useful facial channels and resized textures. The 29 MB original is reduced to about 2.3 MB for download. Vendored Three.js is version 0.180.0. Model and renderer provenance/license files are included, with asset hashes. The model loads lazily when practice opens; a modern browser with WebGL 2 and `DecompressionStream` is required. The service worker caches its bundle after first use and the first-party rendering modules with the shell.

The Apache-2.0 sign-language engine is vendored from `nirholas/three.ws`, commit `66624fbe184f50ae55f89fa01537d99497984cfd`. Its license, README and provenance record are in `dist/vendor/sign-avatar/`. A facial-track stride bug is fixed and documented in the source and provenance record. The application also adds original GO/HOME/WANT motion specifications informed by the linked ASL University pages. It does not copy those providers' media or curriculum. See `THIRD_PARTY_NOTICES.md`.

## Validation and remaining work

`npm test` checks the requested example, all bundled motion labels, fingerspelling, finite normalized tracks, facial-channel joins, sampled contact/direction geometry, unsupported-language gating, limits, label escaping, controls' lifecycle and offline module coverage. It also parses the shipped human geometry/skeleton on the CPU, checks all motion labels' retargeted wrist positions and rotations, verifies that hand close-ups share the main weighted surface, checks rotated camera framing, word repeat/pause behavior and bounded phrasebook storage. `npm run check` checks syntax, HTML element references and packaged assets. Offline renders inspect the human asset's posed geometry and texture placement.

These checks verify software behavior and geometry, **not linguistic accuracy**. The character and motion dictionary have not been reviewed by Deaf signers. Browser interaction, physical webcam use and source-video playback still need hands-on verification. Before treating this as a sentence translator, obtain fluent Deaf signer review, a licensed/validated motion vocabulary, language-specific grammar and appropriate nonmanual markers, then evaluate comprehensibility with users. Character motion for each additional sign language requires separate validated data.
