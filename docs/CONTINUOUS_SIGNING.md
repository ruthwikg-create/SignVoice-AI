# Expansion to continuous signing

The shipped recognizer processes isolated signs in sliding windows. It concatenates verified labels into an editable message. That is not continuous sign-language translation. Keep these layers distinct when expanding:

1. **Landmark extraction:** replace or extend `vision.worker.js` with body and facial landmarks. Preserve real timestamps, occlusion masks, resolution and feature-version metadata. Hands alone omit nonmanual markers, spatial references and much of grammar.
2. **Temporal event segmentation:** collect continuous streams with sign boundaries, transition movements and background segments. Add a streaming temporal network or CTC model trained on sentence/gloss sequences. Sliding DTW windows are a baseline, not a learned boundary detector.
3. **Recognition:** train separate ISL and ASL label spaces on consented, verified recordings. Use signer-independent train/validation/test splits and compare against the existing DTW classifier. Do not split adjacent frames from one recording across folds.
4. **Translation:** if spoken-language sentences are required, use verified sign-to-sentence pairs and a separate translation model. Do not silently “correct” low-confidence recognition with fluent invented language. Expose uncertain glosses and preserve the source sequence.
5. **Speech:** keep the existing reviewed-message composer and optional auto-speak gate. Add stable phrase-boundary speech rather than speaking every rolling-frame prediction. Preserve cancel, replay and user correction.

## Interface boundary

The camera worker returns `{type: 'result', result, feature, prediction, timestamp, latency}`. Replace the classifier while maintaining `prediction = {id, label, speech, score, source}` or `null`. Continue emitting unrecognized segments as `null`. Upgrade the gate when the model emits boundaries, rather than requiring a fixed hold time for every dynamic sign.

The recording export contract is `schemaVersion: 1`, `featureVersion: 'hands-v1-132'`, with language-tagged entries and `samples[].frames`, `signer`, `session`, and `id`. Extending body/face features requires a new version and new models. A checkpoint trained on OpenPose or Holistic features cannot accept this 132-value vector without an explicit adapter and validation.

## Included neural training baseline

`training/train_temporal.py` trains a compact bidirectional GRU on the exported isolated clips, with whole-signer or whole-session held-out groups. It exports a TorchScript model, ordered labels, a model card and confusion counts. This is an offline research baseline, **not integrated into the shipped browser UI** and not a continuous translator. The script refuses to report evaluation when class coverage or separate groups are insufficient.

To deploy that baseline later, export to an explicitly supported ONNX opset, compare TorchScript/ONNX numerical outputs on held-out recordings, add an ONNX Runtime Web worker or a FastAPI service, and retain the exact feature normalization and label order. Do not advertise a neural mode until those steps are implemented and measured.

For a streaming model, prefer causal GRU/TCN/Transformer encoders; the included bidirectional model is an offline full-window comparator with lookahead. Add timestamps and masks to variable-length training examples; include transitions and null labels. CTC needs unsegmented sequence labels and translation needs sentence targets, neither supplied by the isolated recording export.

## Measurements before wider use

Report event precision/recall, null false-acceptance rate, duplicate rate, end-of-sign-to-subtitle latency, confidence calibration, per-signer performance, occlusion/lighting robustness and grammatical translation metrics only if a translation model exists. Include fluent Deaf-community review in vocabulary selection and failure analysis. Report ISL and ASL separately. Research dataset accuracy is not equivalent to real webcam performance.
