"""Extract owned/licensed, already trimmed isolated-sign clips into the browser dataset."""
import argparse
import json
from pathlib import Path
import uuid
import cv2
import mediapipe as mp
import numpy as np

def features(result):
    out=np.zeros(132,dtype=float); used=set()
    for index,hand in enumerate(result.hand_landmarks):
        slot=0 if result.handedness[index][0].category_name=='Left' else 1
        if slot in used: slot=1-slot
        if slot in used: continue
        used.add(slot); offset=slot*66; w,m=hand[0],hand[9]
        scale=max(float(np.hypot(m.x-w.x,m.y-w.y)),.035)
        for i,p in enumerate(hand):
            out[offset+i*3:offset+i*3+3]=np.clip([(p.x-w.x)/scale,(p.y-w.y)/scale,(p.z-w.z)/scale],-5,5)
        out[offset+63:offset+66]=[w.x*2,w.y*2,1]
    return out.tolist()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest',type=Path)
    parser.add_argument('--model',type=Path,default=Path('dist/models/gesture_recognizer.task'))
    parser.add_argument('--output',type=Path,default=Path('signvoice-recordings.json'))
    args=parser.parse_args()
    clips=json.loads(args.manifest.read_text(encoding='utf-8'))['clips']
    entries={}
    for clip in clips:
        for field in ['path','language','label','speech','kind','signer','session']:
            if field not in clip: raise ValueError('Missing field: '+field)
        if clip['language'] not in ['ASL','ISL'] or clip['kind'] not in ['motion','static','neutral']:
            raise ValueError('Unsupported language or kind')
        if not clip['label'].strip() or not clip['signer'].strip() or not clip['session'].strip():
            raise ValueError('Label, signer and session cannot be empty')
        key=(clip['language'], '__neutral__' if clip['kind']=='neutral' else clip['label'])
        if key not in entries:
            entries[key]={'id':'__neutral__' if clip['kind']=='neutral' else str(uuid.uuid4()),'language':clip['language'],'label':clip['label'],'speech':clip['speech'],'kind':clip['kind'],'samples':[]}
        entry=entries[key]
        if len(entry['samples'])>=12: raise ValueError('Maximum 12 clips per sign for the browser prototype')
        path=Path(clip['path']); path=path if path.is_absolute() else args.manifest.parent/path
        capture=cv2.VideoCapture(str(path)); fps=capture.get(cv2.CAP_PROP_FPS)
        if not capture.isOpened() or not np.isfinite(fps) or fps<1: raise ValueError('Cannot open video: '+str(path))
        options=mp.tasks.vision.GestureRecognizerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(args.model)),running_mode=mp.tasks.vision.RunningMode.VIDEO,num_hands=2,min_hand_detection_confidence=.6,min_hand_presence_confidence=.6,min_tracking_confidence=.6)
        frames=[]; frame_index=0; next_time=0.; last_ms=-1
        try:
            with mp.tasks.vision.GestureRecognizer.create_from_options(options) as recognizer:
                while True:
                    ok,image=capture.read()
                    if not ok: break
                    seconds=frame_index/fps; frame_index+=1
                    if seconds+1e-6<next_time: continue
                    next_time=seconds+1/15
                    timestamp=max(last_ms+1,int(seconds*1000)); last_ms=timestamp
                    rgb=cv2.cvtColor(image,cv2.COLOR_BGR2RGB)
                    result=recognizer.recognize_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb),timestamp)
                    frames.append(features(result))
                    if len(frames)>100: raise ValueError('Trim isolated sign clips to 1.3–4 seconds; max 100 sampled frames')
        finally: capture.release()
        if len(frames)<18: raise ValueError('Clip too short: need >=18 frames at 15 fps')
        if entry['kind']!='neutral' and sum(bool(f[65] or f[131]) for f in frames)/len(frames)<.75:
            raise ValueError('Too many missing hand detections: '+str(path))
        entry['samples'].append({'id':str(uuid.uuid4()),'signer':clip['signer'],'session':clip['session'],'frames':frames})
        print(f'Extracted {path.name}: {len(frames)} frames',flush=True)
    if len(entries)>60: raise ValueError('Too many signs for the browser prototype')
    output={'schemaVersion':1,'featureVersion':'hands-v1-132','entries':list(entries.values())}
    args.output.write_text(json.dumps(output,ensure_ascii=False),encoding='utf-8')
    print('Saved '+str(args.output))

if __name__=='__main__':
    main()
