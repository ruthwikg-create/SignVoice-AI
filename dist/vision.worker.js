// Classic worker is required by this pinned MediaPipe WASM loader: it uses
// importScripts internally. Dynamic import still loads our shared ESM modules.
let CONFIG, featuresFromResult, predictProfile;
const dependencies=Promise.all([import('./config.js'),import('./recognition.js')]);
let recognizer;
let generation=0;
let profile=null, frames=[], lastClassified=0, lastPrediction=null;
self.onmessage=async ({data})=> {
  if(data.type==='profile') {profile=data.model;frames=[];lastPrediction=null;lastClassified=0;}
  else if(data.type==='init') {
    const gen=++generation;
    try {
      const [config,recognition]=await dependencies;
      CONFIG=config.CONFIG;featuresFromResult=recognition.featuresFromResult;predictProfile=recognition.predictProfile;
      const {GestureRecognizer,FilesetResolver}=await import(CONFIG.visionModule);
      const files=await FilesetResolver.forVisionTasks(CONFIG.wasmRoot);
      const r=await GestureRecognizer.createFromOptions(files,{
        baseOptions:{modelAssetPath:CONFIG.gestureModel,delegate:'CPU'},runningMode:'VIDEO',numHands:2,
        minHandDetectionConfidence:0.6,minHandPresenceConfidence:0.6,minTrackingConfidence:0.6,
      });
      if(gen!==generation){r.close();return;}
      recognizer?.close();recognizer=r;self.postMessage({type:'ready'});
    }catch(error){self.postMessage({type:'error',message:'Tracking model could not load. Verify the packaged vendor/model files are intact and use a current Chrome or Edge browser. '+error.message});}
  } else if(data.type==='frame') {
    try {
      if(!recognizer)return;
      const started=performance.now();
      const r=recognizer.recognizeForVideo(data.bitmap,data.timestamp);
      const feature=featuresFromResult(r);
      frames.push({timestamp:data.timestamp,feature});
      frames=frames.filter(f=>data.timestamp-f.timestamp<=CONFIG.recordingMs);
      if(data.timestamp-lastClassified>330) {
        lastPrediction=predictProfile(frames.map(f=>f.feature),profile);lastClassified=data.timestamp;
      }
      if(!r.landmarks.length)lastPrediction=null;
      self.postMessage({type:'result',result:{landmarks:r.landmarks,handedness:r.handedness,gestures:r.gestures},feature,prediction:lastPrediction,timestamp:data.timestamp,latency:performance.now()-started});
    }catch(error){self.postMessage({type:'frame-error',message:error.message});}
    finally {data.bitmap?.close();}
  }
};
