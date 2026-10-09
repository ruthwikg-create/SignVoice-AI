"""Refresh sign-title/reference metadata only. Never download sign videos or lessons."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT_ID='1U-Pr4r1-cupgNOOq9NH_uTsQnPSVEKco'
BASE=Path(__file__).resolve().parent.parent/'dist'/'catalog'

class ASLIndex(HTMLParser):
    def __init__(self,url):
        super().__init__();self.url=url;self.href=None;self.text=[];self.entries=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.href=dict(attrs).get('href');self.text=[]
    def handle_data(self,text):
        if self.href:self.text.append(text)
    def handle_endtag(self,tag):
        if tag!='a' or not self.href:return
        url=urljoin(self.url,self.href).replace('http://','https://')
        raw=' '.join(''.join(self.text).split()).strip('"')
        # Labels and source links only. No ASLU prose, image or video is included.
        label=re.sub(r'\[.*?\]','',raw).strip(' -')
        if url.startswith('https://www.lifeprint.com/asl101/pages-signs/') and label:
            aliases=[x.strip(' -') for x in re.split(r'[/;]',label) if x.strip(' -')]
            self.entries.append({'id':'asl-'+hashlib.sha256((url+'|'+label).encode()).hexdigest()[:20],'language':'ASL','label':label.title(),'aliases':aliases,'referenceUrl':url,'source':'Lifeprint / ASL University','kind':'reference','category':'Dictionary','media':None})
        self.href=None

class DriveIndex(HTMLParser):
    def __init__(self):
        super().__init__();self.href=None;self.text=[];self.title=False;self.items=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a':self.href=attrs.get('href');self.text=[]
        if tag=='div' and attrs.get('class')=='flip-entry-title':self.title=True
    def handle_data(self,text):
        if self.title:self.text.append(text)
    def handle_endtag(self,tag):
        if tag=='div' and self.title:self.title=False
        if tag=='a' and self.href:
            title=''.join(self.text).strip()
            if title and self.href.startswith('https://drive.google.com/'):
                self.items.append((title,self.href))
            self.href=None

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir',type=Path,help='Optional local public-HTML snapshot cache; not bundled in the app')
    args=parser.parse_args()
    def fetch(url,key):
        path=args.cache_dir/(key+'.html') if args.cache_dir else None
        if path and path.exists():return path.read_bytes()
        with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0 SignVoiceAI/1.1 reference-index'}),timeout=45) as response:raw=response.read()
        if path:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
        return raw
    asl=[]
    def asl_letter(letter):
        url='https://www.lifeprint.com/asl101/index/'+letter+'.htm'
        p=ASLIndex(url);p.feed(fetch(url,'asl-'+letter).decode('cp1252',errors='replace'));return p.entries
    with ThreadPoolExecutor(max_workers=3) as pool:
        for items in pool.map(asl_letter,'abcdefghijklmnopqrstuvwxyz'):asl.extend(items)
    asl=list({e['id']:e for e in asl}.values())
    visited=set();queue=[(ROOT_ID,'ISL Dictionary')];isl={};directories=[];missing=[]
    while queue:
        batch=[]
        while queue and len(batch)<3:
            fid,label=queue.pop(0)
            if fid in visited:continue
            visited.add(fid);batch.append((fid,label))
        if len(visited)>150:raise ValueError('Directory traversal exceeded 150 published folders')
        def read_folder(item):
            fid,label=item
            try:
                p=DriveIndex();p.feed(fetch('https://drive.google.com/embeddedfolderview?id='+fid,'isl-embedded-'+fid).decode('utf-8'));return item,p.items,None
            except Exception as error:return item,[],str(error)
        with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(read_folder,batch))
        for (fid,category),items,error in results:
            if error:missing.append({'id':fid,'label':category,'error':error});print('Unavailable:',category,flush=True);continue
            directories.append({'id':fid,'label':category});count=0
            for name,url in items:
                folder=re.search(r'/folders/([\w-]+)',url)
                if folder:
                    child=folder.group(1)
                    if child not in visited:queue.append((child,category+'/'+name))
                    continue
                video=re.search(r'/file/d/([\w-]+)',url)
                if not video or not re.search(r'\.(mp4|mov|webm|m4v)$',name,re.I):continue
                vid=video.group(1)
                if vid in isl:continue
                label=re.sub(r'\.(mp4|mov|webm|m4v)$','',name,flags=re.I).replace('_',' ').strip()
                label=re.sub(r'\s+',' ',label)
                alias=re.sub(r'\s*\((?:copy|sign\s*\d+|\d+)\)','',label,flags=re.I).strip()
                alias=re.sub(r'\s+\d+$','',alias).strip()
                aliases=[alias] if alias and alias!=label else []
                part=category.removeprefix('ISL Dictionary/');part='Dictionary' if len(part)==1 or part=='ISL Dictionary' else part
                isl[vid]={'id':'isl-'+vid,'language':'ISL','label':label,'aliases':aliases,'referenceUrl':'https://drive.google.com/file/d/'+vid+'/view','source':'ISLRTC official public dictionary','kind':'reference','category':part,'media':{'type':'drive','id':vid}}
                count+=1
            print(category+': '+str(count)+' newly indexed videos',flush=True)
    if len(asl)<1000 or len(isl)<1000:raise ValueError('Unexpectedly small catalog. Existing files are preserved.')
    BASE.mkdir(parents=True,exist_ok=True)
    for language,entries in [('ASL',asl),('ISL',list(isl.values()))]:
        entries.sort(key=lambda e:e['label'].casefold())
        data={'schemaVersion':1,'language':language,'entries':entries,'sourceNote':'Title/reference metadata only. No dictionary video, ASLU lesson prose or ASLU image is copied. Entries are not trained recognition classes.'}
        target=BASE/(language.lower()+'.json');tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8');tmp.replace(target)
    metadata={'schemaVersion':1,'retrievedAt':datetime.now(timezone.utc).date().isoformat(),'ASL':{'count':len(asl),'source':'https://www.lifeprint.com/dictionary.htm','coverage':'All links exposed in the fetched A–Z indexes; not every possible ASL sign'},'ISL':{'count':len(isl),'source':'https://drive.google.com/drive/folders/'+ROOT_ID,'directories':len(directories),'missingDirectories':missing,'coverage':'Video references exposed in the fetched published directory tree, including variants. No claim of a complete language or recognition model.'},'directories':directories}
    (BASE/'metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Saved {len(asl)} ASL references and {len(isl)} ISL video references. Missing folders: {len(missing)}')

if __name__=='__main__':main()
