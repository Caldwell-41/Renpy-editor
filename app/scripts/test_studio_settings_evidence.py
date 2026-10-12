"""Reject altered reused artifacts, unsafe archives and missing focused evidence."""
import importlib.util
import json
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock
import zipfile

spec=importlib.util.spec_from_file_location('evidence',Path(__file__).with_name('studio-settings-evidence.py'))
e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
class EvidenceTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
 def tearDown(self):self.tmp.cleanup()
 def archive(self,name='ok.txt',mode=0):
  p=self.root/'artifact.zip'
  with zipfile.ZipFile(p,'w') as z:
   i=zipfile.ZipInfo(name)
   # ZipInfo normalizes backslashes on Windows; preserve the intentionally unsafe fixture.
   i.filename=name;i.orig_filename=name;i.external_attr=mode<<16;z.writestr(i,b'fixture')
  with zipfile.ZipFile(p) as z: self.assertEqual([i.orig_filename for i in z.infolist()],[name])
  return p
 def test_safe_archive(self):
  e.extract(self.archive(),self.root/'out');self.assertEqual((self.root/'out/ok.txt').read_bytes(),b'fixture')
 def test_unsafe_archive(self):
  for i,name in enumerate(('../x','/x','C:/x','a\\x','a//x','./x')):
   with self.subTest(name=name),self.assertRaises(AssertionError):e.extract(self.archive(name),self.root/str(i))
 def test_windows_normalization_cannot_hide_unsafe_filename(self):
  with mock.patch.object(zipfile.os,'sep','\\'):
   archive=self.archive('a\\x')
   with zipfile.ZipFile(archive) as z:
    entry=z.infolist()[0];self.assertEqual(entry.orig_filename,'a\\x');self.assertEqual(entry.filename,'a/x')
   with self.assertRaises(AssertionError): e.extract(archive,self.root/'out')
 def test_symlink_archive(self):
  with self.assertRaises(AssertionError):e.extract(self.archive(mode=stat.S_IFLNK|0o777),self.root/'out')
 def test_duplicate_archive(self):
  p=self.archive()
  with zipfile.ZipFile(p,'a') as z:z.writestr('ok.txt',b'other')
  with self.assertRaises(AssertionError):e.extract(p,self.root/'out')
 def test_manifest_alteration(self):
  (self.root/'a').write_bytes(b'original');e.write(self.root/'manifest.json',{'schemaVersion':1,'files':{'a':e.digest(b'original')}})
  e.manifest(self.root,'manifest.json');(self.root/'a').write_bytes(b'changed')
  with self.assertRaises(AssertionError):e.manifest(self.root,'manifest.json')
 def test_manifest_missing(self):
  e.write(self.root/'manifest.json',{'schemaVersion':1,'files':{'a':'absent'}})
  with self.assertRaises(AssertionError):e.manifest(self.root,'manifest.json')
 def identity(self,target='Darwin'):
  e.write(self.root/'identity.json',{'passed':True,'os':target,'packageBuilds':0,'appLaunches':0})
  e.write(self.root/'validator-result.json',{'passed':True})
 def test_mac_terminal_without_package_or_launch(self):
  self.identity();self.assertTrue(e.finish(self.root));self.assertEqual(e.load(self.root/'pipeline.json')['appLaunches'],0)
 def test_missing_validator_not_pass(self):
  self.identity();(self.root/'validator-result.json').unlink();self.assertFalse(e.finish(self.root))
 def test_failed_acquisition_not_pass(self):
  self.identity();e.write(self.root/'identity.json',{'passed':False,'os':'Darwin','packageBuilds':0,'appLaunches':0});self.assertFalse(e.finish(self.root))
 def test_missing_windows_native_not_pass(self):
  self.identity('Windows');self.assertFalse(e.finish(self.root))
 def test_failed_windows_native_not_pass(self):
  self.identity('Windows');(self.root/'native').mkdir();e.write(self.root/'native/terminal.json',{'passed':False,'launchOrdinals':[8,9]});self.assertFalse(e.finish(self.root))
 def test_failed_launch_counts_retained(self):
  self.identity('Windows');(self.root/'native').mkdir();e.write(self.root/'native/terminal.json',{'passed':False,'launchOrdinals':[8]});self.assertFalse(e.finish(self.root));self.assertEqual(e.load(self.root/'pipeline.json')['appLaunches'],1)
 def test_boolean_only_native_refused(self):
  self.identity('Windows');(self.root/'native').mkdir();e.write(self.root/'native/terminal.json',{'passed':True,'launchOrdinals':[8,9]});self.assertFalse(e.finish(self.root))
 def test_missing_preparation_is_sealed_failure(self):
  self.assertFalse(e.finish(self.root));self.assertTrue((self.root/'artifact-manifest.json').is_file())
 def test_reserved_starts_count_without_terminal(self):
  self.identity('Windows');(self.root/'native').mkdir()
  for ordinal in (8,9): e.write(self.root/f'native/launch-{ordinal}-reserved.json',{'ordinal':ordinal})
  self.assertFalse(e.finish(self.root));self.assertEqual(e.load(self.root/'pipeline.json')['appLaunches'],2)
 def test_reserved_starts_count_with_malformed_terminal(self):
  self.identity('Windows');(self.root/'native').mkdir();e.write(self.root/'native/launch-8-reserved.json',{'ordinal':8})
  (self.root/'native/terminal.json').write_text('malformed')
  self.assertFalse(e.finish(self.root));self.assertEqual(e.load(self.root/'pipeline.json')['appLaunches'],1)
 def test_mac_reservation_is_failure_and_counted(self):
  self.identity();(self.root/'native').mkdir();e.write(self.root/'native/launch-8-reserved.json',{'ordinal':8})
  self.assertFalse(e.finish(self.root));self.assertEqual(e.load(self.root/'pipeline.json')['appLaunches'],1)
if __name__=='__main__':unittest.main()
