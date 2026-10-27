#!/usr/bin/env python3
"""Inspect a public HLS feed. Writes metadata/manifests, never stores media in output."""
import argparse
import datetime
from collections import Counter
import json
import re
import shutil
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT = 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/master.m3u8'
HEADERS = ['content-type','content-length','access-control-allow-origin','cache-control','date','age','server','accept-ranges','etag']

def fetch(url, limit=2_000_000):
    request = urllib.request.Request(url, headers={'Origin':'https://wan-audio-magical-baseball.trycloudflare.com','User-Agent':'Openwave-HLS-Inspection/1.0'})
    with urllib.request.urlopen(request, timeout=20) as response:
        return {'url': response.url, 'status': response.status,
                'headers': {key: response.headers.get(key) for key in HEADERS if response.headers.get(key) is not None}}, response.read(limit)

def attributes(line):
    return dict((key, value.strip('"')) for key, value in re.findall(r'([A-Z0-9-]+)=("[^"]*"|[^,]*)',line.split(':',1)[1]))

def variants(text, base):
    result=[]
    lines=[line.strip() for line in text.splitlines() if line.strip()]
    for i,line in enumerate(lines):
        if line.startswith('#EXT-X-STREAM-INF:'):
            entry=attributes(line)
            entry['url']=urllib.parse.urljoin(base,lines[i+1])
            result.append(entry)
    return result

def playlist(text, base):
    def tag(name):
        match=re.search(r'^#'+name+r':([^\r\n]+)', text, re.M)
        return match.group(1) if match else None
    durations=[float(x) for x in re.findall(r'^#EXTINF:([\d.]+)',text,re.M)]
    segments=[urllib.parse.urljoin(base,line.strip()) for line in text.splitlines() if line.strip() and not line.startswith('#')]
    return {'sequence':int(tag('EXT-X-MEDIA-SEQUENCE')) if tag('EXT-X-MEDIA-SEQUENCE') else None,
            'target_duration_seconds':tag('EXT-X-TARGETDURATION'), 'playlist_type':tag('EXT-X-PLAYLIST-TYPE'),
            'has_endlist':'#EXT-X-ENDLIST' in text, 'program_date_time':tag('EXT-X-PROGRAM-DATE-TIME'),
            'segment_duration_counts':dict(Counter(durations)), 'window_seconds':sum(durations),
            'segment_count':len(segments), 'first_segment_url':segments[0] if segments else None,
            'last_segment_url':segments[-1] if segments else None,
            'key_tags':sorted(set(re.findall(r'^#EXT-X-KEY:([^\r\n]+)',text,re.M)))}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url',default=DEFAULT)
    parser.add_argument('--output',default='docs/evidence/dw-english')
    parser.add_argument('--interval',type=float,default=8)
    args=parser.parse_args()
    if args.interval<0: parser.error('--interval must be nonnegative')
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    report={'observed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':args.url}
    report['master_response'],raw=fetch(args.url)
    master=raw.decode();(out/'master.txt').write_text(master)
    report['variants']=variants(master,args.url)
    media_url=report['variants'][0]['url'] if report['variants'] else args.url
    report['media_response'],raw=fetch(media_url)
    media=raw.decode();(out/'media-first.txt').write_text(media)
    report['first']=playlist(media,media_url)
    started=time.monotonic()
    segment=report['first']['last_segment_url']
    if segment:
        report['segment_response'],data=fetch(segment)
        report['segment_sample_bytes']=len(data)
        report['mpeg_ts_sync_byte']=data[:1].hex()
        if shutil.which('ffprobe'):
            with tempfile.NamedTemporaryFile(suffix='.ts') as temp:
                temp.write(data);temp.flush()
                result=subprocess.run(['ffprobe','-v','error','-show_entries','stream=index,codec_name,codec_type,profile,width,height,r_frame_rate,sample_rate,channels:format=format_name,duration,bit_rate','-of','json',temp.name],capture_output=True,text=True,timeout=20)
                report['ffprobe']=json.loads(result.stdout) if result.returncode==0 else {'error':result.stderr[:500]}
    time.sleep(max(0,args.interval-(time.monotonic()-started)))
    report['media_second_response'],raw=fetch(media_url)
    media2=raw.decode();(out/'media-second.txt').write_text(media2)
    report['second']=playlist(media2,media_url)
    a,b=report['first']['sequence'],report['second']['sequence']
    report['sequence_advanced']=a is not None and b is not None and b>a
    report['observation_interval_seconds']=round(time.monotonic()-started,2)
    (out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'report':str(out/'report.json'),'source':args.url,'sequence_advanced':report['sequence_advanced'],'first_sequence':a,'second_sequence':b,'segment_status':report.get('segment_response',{}).get('status')},indent=2))

if __name__=='__main__':main()
