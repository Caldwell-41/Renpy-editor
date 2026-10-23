"""Bounded structural admission for native canvas evidence, separate from pixel comparison."""
import base64
import binascii
import math
import struct
import zlib


def image_ok(value, width, height):
    if not isinstance(value,str) or not value.startswith('data:image/png;base64,'):
        return False
    try:
        raw=base64.b64decode(value.split(',',1)[1],validate=True)
        if len(raw)>8*1024*1024 or raw[:8]!=b'\x89PNG\r\n\x1a\n':
            return False
        offset=8; header=None; compressed=bytearray(); ended=False
        while offset+12<=len(raw):
            length=struct.unpack('>I',raw[offset:offset+4])[0]
            kind=raw[offset+4:offset+8];end=offset+8+length
            if end+4>len(raw) or zlib.crc32(raw[offset+4:end])!=struct.unpack('>I',raw[end:end+4])[0]:
                return False
            data=raw[offset+8:end]
            if kind==b'IHDR':
                if offset!=8 or length!=13:
                    return False
                header=struct.unpack('>IIBBBBB',data)
            elif kind==b'IDAT':
                compressed.extend(data)
            elif kind==b'IEND':
                if length or end+4!=len(raw):
                    return False
                ended=True
            elif not kind or not kind[0]&32:
                return False
            offset=end+4
        if not ended or header not in [(width,height,8,6,0,0,0),(width,height,8,2,0,0,0)]:
            return False
        channels=4 if header[3]==6 else 3;size=height*(1+width*channels)
        decoder=zlib.decompressobj();pixels=decoder.decompress(compressed,size+1)
        return (decoder.eof and not decoder.unused_data and len(pixels)==size
                and all(pixels[row*(1+width*channels)]<=4 for row in range(height)))
    except (ValueError,TypeError,struct.error,binascii.Error,zlib.error):
        return False


def canvas_details_ok(details, target_os=None):
    recorded_os = details.get('targetOs')
    if recorded_os not in ('windows', 'macos') or (target_os is not None and target_os != recorded_os):
        return False
    if details.get('canvasShutdown') != dict(cleanupComplete=True, cooperative=True, exitCode=0):
        return False
    renderer = 'angle2' if recorded_os == 'windows' else 'gl2'
    startup=details.get('startupImageLoadMilliseconds')
    if (details.get('nativeWebView') is not True or details.get('nativeKeyboard') is not False
            or details.get('nativeFocusObserved') is not False or details.get('warmPresentationProof') is not False
            or type(startup) not in (int,float) or not math.isfinite(startup) or startup<=0
            or details.get('error')):
        return False
    frames=details.get('frames')
    if not isinstance(frames,list) or len(frames)!=2:
        return False
    for frame,(width,height,x,y) in zip(frames,[(1280,720,320,180),(1024,768,192,204)]):
        if (not isinstance(frame,dict) or frame.get('width')!=width or frame.get('height')!=height
                or frame.get('phase')!='ready' or frame.get('renderer')!=renderer
                or not isinstance(frame.get('revision'),str) or len(frame['revision'])!=64
                or any(c not in '0123456789abcdef' for c in frame['revision'])
                or not image_ok(frame.get('image'),width,height)):
            return False
        geometry=frame.get('geometry')
        if not isinstance(geometry,list) or any(not isinstance(g,dict) for g in geometry):
            return False
        panel=[g for g in geometry if g.get('start')==113]
        if len(panel)!=1 or any(type(panel[0].get(k)) not in (int,float) or not math.isfinite(panel[0][k]) or panel[0][k]!=v
                               for k,v in dict(x=x,y=y,width=640,height=360).items()):
            return False
    return True


def canvas_observation_ok(value, editor_pid, target_os):
    if target_os not in ('windows', 'macos') or not isinstance(value, dict):
        return False
    helpers = value.get('helperPIDs')
    if (value.get('editorPID') != editor_pid or value.get('stopped') is not True
            or type(value.get('samples')) is not int or value['samples'] <= 10
            or type(value.get('helperSamples')) is not int or not 10 < value['helperSamples'] <= value['samples']
            or not isinstance(helpers, list) or len(helpers) != 1
            or type(helpers[0]) is not int or helpers[0] <= 0 or helpers[0] == editor_pid
            or any(type(value.get(key)) is not int or value[key] != 0 for key in ('visibleSamples', 'foregroundChanges', 'inventoryFailures'))):
        return False
    gap = value.get('maximumSampleGapMilliseconds')
    if type(gap) not in (int, float) or not math.isfinite(gap) or gap <= 0:
        return False
    return (value.get('activationEventsObserved') is (target_os == 'macos')
            and value.get('activationChanges') == (0 if target_os == 'macos' else None))
