"""Optional offline isolated-sign GRU baseline. Not the deployed browser model."""
import argparse
import copy
import json
from pathlib import Path
import random
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

DIM, STEPS, NEUTRAL = 132, 24, '__neutral__'

def resample(frames):
    a = np.asarray(frames, dtype=np.float32)
    if a.ndim != 2 or a.shape[1] != DIM or len(a) < 18 or not np.isfinite(a).all():
        raise ValueError('Expected at least 18 frames with 132 finite features per frame')
    positions = np.linspace(0, len(a)-1, STEPS)
    lo, hi = np.floor(positions).astype(int), np.ceil(positions).astype(int)
    ratio = (positions-lo).astype(np.float32)[:, None]
    return a[lo]*(1-ratio) + a[hi]*ratio

class TemporalGRU(nn.Module):
    def __init__(self, classes):
        super().__init__()
        self.encoder = nn.GRU(DIM, 64, num_layers=2, batch_first=True, bidirectional=True, dropout=.15)
        self.classifier = nn.Sequential(nn.Dropout(.2), nn.Linear(128, classes))

    def forward(self, x):
        encoded, _ = self.encoder(x)
        return self.classifier(encoded.mean(dim=1))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dataset', type=Path)
    parser.add_argument('--language', choices=['ISL', 'ASL'], required=True)
    parser.add_argument('--group', choices=['session', 'signer'], default='session')
    parser.add_argument('--validation-group', required=True)
    parser.add_argument('--test-group', required=True)
    parser.add_argument('--output', type=Path, default=Path('training/output'))
    parser.add_argument('--epochs', type=int, default=80)
    args = parser.parse_args()
    if args.validation_group == args.test_group:
        raise ValueError('Validation and test groups must be different')
    if not 1 <= args.epochs <= 1000:
        raise ValueError('Epochs must be between 1 and 1000')
    random.seed(17); np.random.seed(17); torch.manual_seed(17)
    torch.set_num_threads(min(4, torch.get_num_threads()))
    data = json.loads(args.dataset.read_text(encoding='utf-8'))
    if data.get('schemaVersion') != 1 or data.get('featureVersion') != 'hands-v1-132':
        raise ValueError('Unsupported dataset contract')
    entries = [e for e in data['entries'] if e['language'] == args.language]
    if len({e['id'] for e in entries}) != len(entries):
        raise ValueError('Duplicate class IDs')
    if not any(e['id'] == NEUTRAL for e in entries) or len(entries) < 2:
        raise ValueError('Need neutral/background and at least one sign')
    entries.sort(key=lambda e: (e['id'] != NEUTRAL, e['label']))
    labels = [{k:e[k] for k in ['id','label','speech','language','kind']} for e in entries]
    splits = {name: ([], []) for name in ['train','validation','test']}
    groups = set()
    for class_index, entry in enumerate(entries):
        counts = {name:0 for name in splits}
        for sample in entry['samples']:
            group = sample[args.group]
            if not group:
                raise ValueError('Empty split group')
            groups.add(group)
            split = 'test' if group == args.test_group else ('validation' if group == args.validation_group else 'train')
            splits[split][0].append(resample(sample['frames']))
            splits[split][1].append(class_index); counts[split] += 1
        if counts['train'] < 3 or counts['validation'] < 1 or counts['test'] < 1:
            raise ValueError(f"Class {entry['label']!r} needs >=3 training, >=1 validation and >=1 test examples in separate {args.group} groups. Found {counts}")
    if len(groups) < 3:
        raise ValueError('Need at least three independent groups')
    tensors = {split:(torch.from_numpy(np.stack(x)), torch.tensor(y, dtype=torch.long)) for split,(x,y) in splits.items()}
    loader = DataLoader(TensorDataset(*tensors['train']), batch_size=16, shuffle=True)
    model = TemporalGRU(len(entries))
    counts = torch.bincount(tensors['train'][1], minlength=len(entries)).float()
    criterion = nn.CrossEntropyLoss(weight=counts.sum()/(counts*len(entries)))
    optimizer = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=.01)
    best, best_loss = None, float('inf')
    for epoch in range(args.epochs):
        model.train()
        for x,y in loader:
            optimizer.zero_grad(); loss=criterion(model(x),y); loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0); optimizer.step()
        model.eval()
        with torch.no_grad():
            val_loss = criterion(model(tensors['validation'][0]),tensors['validation'][1]).item()
        if val_loss < best_loss:
            best_loss=val_loss; best=copy.deepcopy(model.state_dict())
        if (epoch+1)%10 == 0 or epoch == 0:
            print(f'Epoch {epoch+1}: validation loss {val_loss:.4f}', flush=True)
    model.load_state_dict(best); model.eval()
    with torch.no_grad():
        predictions=model(tensors['test'][0]).argmax(dim=1).numpy()
    truth=tensors['test'][1].numpy(); confusion=np.zeros((len(entries),len(entries)),dtype=int)
    for expected,predicted in zip(truth,predictions): confusion[expected,predicted] += 1
    args.output.mkdir(parents=True,exist_ok=True)
    torch.jit.trace(model, torch.zeros(1,STEPS,DIM)).save(str(args.output/'temporal_gru.pt'))
    metadata = {'language':args.language,'featureVersion':'hands-v1-132','steps':STEPS,'inputShape':['batch',STEPS,DIM],'output':'unnormalized class logits','labels':labels,'architecture':'2-layer bidirectional GRU, hidden=64, temporal mean pooling','splitField':args.group,'validationGroup':args.validation_group,'testGroup':args.test_group,'splitCounts':{k:len(v[1]) for k,v in splits.items()},'testAccuracy':float((truth==predictions).mean()),'confusion':confusion.tolist(),'seed':17,'warning':'Offline isolated-sign research baseline. Scores are not calibrated; browser runtime not integrated. Does not segment or translate continuous signing.'}
    (args.output/'model-card.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(metadata,ensure_ascii=False,indent=2))

if __name__ == '__main__':
    main()
