export const CONFIG = Object.freeze({
  visionModule: './vendor/mediapipe/vision_bundle.mjs',
  wasmRoot: './vendor/mediapipe/wasm',
  gestureModel: './models/gesture_recognizer.task',
  frameRate: 15, sequenceFrames: 24, recordingMs: 2200,
  minSamples: 3, maxSamples: 12, featureVersion: 'hands-v1-132',
});
