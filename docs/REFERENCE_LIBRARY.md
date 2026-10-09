# ASL / ISL reference library

The reference library is separate from the trained recognition library. Watching a lesson teaches the user; it does not teach the browser classifier. Recognition still uses the pretrained ASL “I love you” starter and actual personal recordings.

## Snapshot and coverage

| Source | Bundled references | Demonstration behavior |
| --- | --- | --- |
| Official ISLRTC public directory | 15,438 unique video IDs across 45 fetched folders | Loads the source Google Drive preview on request; separate-open fallback |
| Lifeprint / ASL University A–Z indexes | 2,085 word/concept links | Opens the lesson at its source; no copied/embedded Lifeprint media |
| Public-domain ASL alphabet chart | 26 letter entries | Local visual handshapes, short instructions and full chart |

Retrieved October 9, 2026. ISL references include regional variants, English/Hindi versions and specialist sections, not 15,438 distinct words. ASL entries include different meanings and overlapping links, not a measured model vocabulary. A finite directory cannot contain every possible sign, inflected form, name, sentence or regional variant. No linguist verified all entries here. The catalogs preserve source titles and links; choose meanings carefully.

The full sources remain accessible from the app. `dist/catalog/metadata.json` records date, count, directory coverage and any failed folder requests. No source videos were downloaded, rehosted or used to train recognition. Source playback needs internet and is subject to changes, public-access settings and browser policies. The separate-open link remains available after starting a video.

## Typed-text planner

The planner normalizes Unicode text (preserving Indic combining marks), ignores punctuation and matches available phrases of up to eight words before single words. It presents concepts in input order, with alternate references for matching titles/aliases. It does not translate grammar or select contextual meaning automatically. Input is bounded to 120 tokens and 160 steps with a visible shortening notice.

Unknown Latin words in ASL can be fingerspelled. Unknown ISL words, digits without a reference and unsupported scripts are shown as missing. ASL and ISL never share references implicitly. The alphabet is visual guidance only, including motion for J/Z; users must train letters if they want personal camera recognition.

In guided practice, a step is recognizable only when an eligible personal class exists in that language, or the ASL label is the supported pretrained “I love you” starter. Optional advancement requires an accepted prediction with that class ID. This reports a classifier match, not correctness of all signing details or sentence meaning. Subtitles, transcript and speech consume the same accepted events as the live interpreter.

## Import additional verified references

In Sign library, select **Import additional reference catalog** and choose a JSON file smaller than 25 MB. Imports replace only previous imported references after a confirmation, preserve bundled references and personal recordings, and persist on this browser origin. The maximum is 30,000 entries. Use verified labels, distinct IDs, HTTPS source links, and permission-compatible source playback. Avoid personal/private source links if sharing exports.

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "your-verified-water-reference",
      "language": "ISL",
      "label": "Water",
      "aliases": ["drinking water"],
      "kind": "reference",
      "category": "Everyday vocabulary",
      "source": "Your verified source and creator",
      "referenceUrl": "https://example.org/verified-sign-lesson",
      "instruction": "Optional original guidance for the verified demonstration.",
      "media": null
    }
  ]
}
```

The example URL is a placeholder, not an actual sign lesson. Replace it with the verified public source. `media` may be null, or a supported public preview descriptor such as `{"type":"drive","id":"ACTUAL_PUBLIC_VIDEO_FILE_ID"}` or `{"type":"youtube","id":"ACTUAL_11_CHARACTER_ID"}`. The validator checks syntax, not ownership, availability, permission or sign-language accuracy. Use `kind: "reference"` for imported lessons. Do not use ASL alphabet guidance for ISL.

Reference import/export is different from recording import/export. A reference file contains labels and links; a recording file contains landmark sequences used to train. Exported practice plans contain references and recognition-status descriptions, not portable model weights or video files. Delete all local data removes imported references; it does not remove the bundled catalogs.

## Refresh public-source metadata

Python 3 with the standard library is sufficient:

```bash
python3 scripts/refresh_catalog.py
npm test
npm run check
```

The script fetches Lifeprint A–Z indexes and walks the official public ISLRTC directory tree, including nested folders. It writes catalog JSON and coverage metadata; it does not fetch video bytes. `--cache-dir /path/to/public-html-snapshots` can reuse snapshots during a development run. Changes in upstream markup/access may break indexing. Review counts, failed directories and representative links before releasing a refreshed catalog. A successful fetch is not proof of linguistic correctness or model accuracy.

## Permissions and provenance

Lifeprint permits linking but restricts embedding/copying its lessons into apps, so ASL word demonstrations open on the source website. The ASL alphabet chart has a public-domain declaration and is bundled with attribution. ISL videos remain with the official source and its contributors. See `../THIRD_PARTY_NOTICES.md` for exact URLs and attribution. References confer no blanket training, download or redistribution rights.
