"""Admission regressions: missing/foreign/changed native proof cannot release a stage."""
import copy
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest
import zlib
from rewrite_native_evidence import NATIVE_STAGES, validate_native_stage


def png(seed):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind+data))
    pixels=b''.join(b'\0'+bytes((x*13+y*7+seed)%256 for x in range(600)) for y in range(100))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',200,100,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(pixels))+chunk(b'IEND',b'')


class NativeEvidenceGate(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)

    def receipt(self, stage):
        captures=[]
        for i in range(2 if stage.startswith('physical-') else 1):
            data=png(i)
            name=f'{stage}-{i}.png';(self.root/name).write_bytes(data)
            captures.append({'file':name,'sha256':hashlib.sha256(data).hexdigest(),'width':200,'height':100,'sampleRange':80,'meanBrightness':220 if stage=='observe-light' else 40})
        checks={name:True for name in ('ownedWindow','nativeControls','captureNonblank','controlsInViewport','themeLight','themeDark','compactWidth','osMouseInput','inertProposalObserved','savedOnceObserved')}
        return {'stage':stage,'passed':True,'processId':42,'executableSHA256':'a'*64,'inputDesktop':'Default','layer':'Windows UI Automation observation and OS SendInput; automated, not human acceptance','checks':checks,'captures':captures,'dpi':96}

    def validate(self, stage, value):
        (self.root/f'{stage}.json').write_text(json.dumps(value))
        return validate_native_stage(self.root,stage,42,'a'*64)

    def test_all_native_stages_require_exact_owner_and_every_assertion(self):
        for stage in NATIVE_STAGES:
            value=self.receipt(stage);self.validate(stage,value)
            for key,new in [('stage','different'),('passed',False),('processId',43),('executableSHA256','b'*64),('inputDesktop','Winlogon'),('layer','browser mock')]:
                invalid=copy.deepcopy(value);invalid[key]=new
                with self.assertRaises(ValueError):self.validate(stage,invalid)
            for key in ('ownedWindow','nativeControls','captureNonblank','controlsInViewport'):
                invalid=copy.deepcopy(value);invalid['checks'][key]=False
                with self.assertRaises(ValueError):self.validate(stage,invalid)

    def test_missing_traversal_corruption_and_blank_capture_are_rejected(self):
        stage='observe-light';value=self.receipt(stage)
        for captures in ([],None):
            invalid=copy.deepcopy(value);invalid['captures']=captures
            with self.assertRaises(ValueError):self.validate(stage,invalid)
        for key,new in [('file','../outside.png'),('sha256','b'*64),('width',201),('sampleRange',0),('meanBrightness',20)]:
            invalid=copy.deepcopy(value);invalid['captures'][0][key]=new
            with self.assertRaises(ValueError):self.validate(stage,invalid)
        (self.root/value['captures'][0]['file']).write_bytes(b'not a screenshot')
        with self.assertRaises(ValueError):self.validate(stage,value)

    def test_actions_need_before_after_and_observed_result(self):
        for stage,result in [('physical-send','inertProposalObserved'),('physical-accept','savedOnceObserved')]:
            value=self.receipt(stage)
            for key in ('osMouseInput',result):
                invalid=copy.deepcopy(value);invalid['checks'][key]=False
                with self.assertRaises(ValueError):self.validate(stage,invalid)
            invalid=copy.deepcopy(value);invalid['captures']=invalid['captures'][:1]
            with self.assertRaises(ValueError):self.validate(stage,invalid)
            invalid=copy.deepcopy(value);invalid['captures'][1]=invalid['captures'][0]
            with self.assertRaises(ValueError):self.validate(stage,invalid)

    def test_wrong_theme_and_noncompact_geometry_are_rejected(self):
        value=self.receipt('observe-dark');value['captures'][0]['meanBrightness']=220
        with self.assertRaises(ValueError):self.validate('observe-dark',value)
        value=self.receipt('observe-narrow');value['dpi']=0
        with self.assertRaises(ValueError):self.validate('observe-narrow',value)


if __name__=='__main__':unittest.main()
