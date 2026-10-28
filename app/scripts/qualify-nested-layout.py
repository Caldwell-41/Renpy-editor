"""Qualify L04's public-core accepted layout and clipping in the pinned SDK.

This proves geometry and clipping pixels in normal software-rendered game entry.
It does not accept GPU pixel equivalence, pointer input or full canvas coverage.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import launcher_for, run_bounded

SDK_SHA = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
NAMES = ['outer', 'row', 'cells', 'one', 'two', 'three', 'clip', 'content', 'overflow']


def validate(record, aspect, opening, image=None):
    assert record['aspect'] == list(aspect)
    assert record['sdkVersion'].startswith('8.5.3')
    x, y = aspect[0] // 2 - 300, aspect[1] // 2 - 160
    expected = dict(outer=[x,y,600,320], row=[x+12,y+16,368,max(108,opening)],
                    cells=[x+12,y+16,168,108], one=[x+12,y+16,80,50],
                    two=[x+100,y+16,80,50], three=[x+12,y+74,80,50],
                    clip=[x+200,y+16,180,opening], content=[x+200,y+16,180,opening],
                    overflow=[x+200,y+16,180,opening])
    assert record['rectangles'] == expected, (record['rectangles'], expected)
    if image is not None:
        with Image.open(image) as png:
            assert png.size == aspect, png.size
            rgb = png.convert('RGB')
            background=rgb.getpixel((x+5,y+5))
            content=rgb.getpixel((x+290,y+86))
            assert content != background, 'Viewport interior missing'
            assert rgb.getpixel((x+385,y+86)) == background, 'Content leaks past right edge'
            assert rgb.getpixel((x+290,y+126)) == (content if opening == 200 else background), 'Viewport height does not control clipping'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['archive','checksums','accepted','output']:
        parser.add_argument('--'+name,type=Path,required=True)
    parser.add_argument('--allow-fixture-execution',action='store_true',required=True)
    parser.add_argument('--reuse-compile-lint',type=Path,help='Earlier retained compile/lint proof for byte-identical accepted inputs')
    args=parser.parse_args()
    output=args.output.resolve();output.mkdir(parents=True,exist_ok=False)
    result=dict(passed=False,sdkProcesses=0,os=platform.system(),architecture=platform.machine(),records=[],commands=[],cleanupComplete=False,
                candidate=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip())
    scratch=None
    try:
        # Wrong evidence must fail before any SDK process starts.
        for wrong in [{},dict(aspect=[1280,720],sdkVersion='8.5.3',rectangles={})]:
            try: validate(wrong,(1280,720),100)
            except (AssertionError,KeyError): pass
            else: raise AssertionError('Known wrong geometry was admitted')
        result['rejectingGateSelfCheck']=True
        accepted=json.loads(args.accepted.read_text())
        assert accepted['publicCoreRequests'] is True
        for source_key,hash_key in [('source','sha256'),('expandedSource','expandedSHA256')]:
            assert hashlib.sha256(accepted[source_key].encode()).hexdigest()==accepted[hash_key]
        assert expected_sha256(args.checksums.read_text(),args.archive.name)==SDK_SHA
        shutil.copyfile(args.accepted,output/'accepted.json')
        if args.reuse_compile_lint:
            previous=json.loads((args.reuse_compile_lint/'result.json').read_text())
            assert (args.reuse_compile_lint/'accepted.json').read_bytes()==args.accepted.read_bytes(), 'Compile/lint inputs changed'
            checked=previous['commands'][:2]
            assert [row['name'] for row in checked]==['compile','lint']
            assert all(row['exitCode']==0 and not row['timedOut'] and not row['outputLimited'] for row in checked)
            result['reusedCompileLint']=dict(commands=checked,receiptSHA256=hashlib.sha256((args.reuse_compile_lint/'result.json').read_bytes()).hexdigest(),acceptedInputsSHA256=hashlib.sha256(args.accepted.read_bytes()).hexdigest())
        with tempfile.TemporaryDirectory(prefix='loomlight-nested-sdk-') as temporary:
            scratch=Path(temporary)
            install_verified_tar(args.archive,SDK_SHA,scratch/'sdk')
            launcher=launcher_for(scratch/'sdk/renpy-8.5.3-sdk')
            project=scratch/'project';(project/'game/ui').mkdir(parents=True)
            (project/'game/script.rpy').write_text('label start:\n    show screen notes\n    show screen nested_finish_screen\n    $ renpy.pause(hard=True)\n    return\n')
            env=dict(os.environ,SDL_VIDEODRIVER='dummy',SDL_AUDIODRIVER='dummy',RENPY_RENDERER='sw',RENPY_SCALE_FACTOR='1',
                     RENPY_DISABLE_SOUND='1',RENPY_SKIP_MAIN_MENU='1',RENPY_SKIP_SPLASHSCREEN='1',RENPY_PATH_TO_SAVES=str(scratch/'saves'))
            for aspect in [(1280,720),(1024,768)]:
                for opening,source_key in [(100,'source'),(200,'expandedSource')]:
                    source=accepted[source_key].encode();(project/'game/ui/layout.rpy').write_bytes(source)
                    (project/'game/options.rpy').write_text(f'define config.name = "Loomlight nested layout proof"\ndefine config.screen_width = {aspect[0]}\ndefine config.screen_height = {aspect[1]}\ndefine config.save_directory = None\ndefine config.sound = False\n')
                    image=output/f'sdk-{aspect[0]}x{aspect[1]}-{opening}.png'
                    proof='''init python:
    def nested_finish():
        try:
            from renpy.test.testfocus import focus_from_displayable
            rectangles = {}
            for name in NAMES:
                widget = renpy.get_displayable("notes", name, base=True)
                assert widget is not None, name
                focus = focus_from_displayable(widget)
                assert focus is not None, name
                rectangles[name] = [focus.x, focus.y, focus.w, focus.h]
            # The pinned software framebuffer screenshot has a platform-dependent
            # pixel format. Export the real source screen's alpha Render instead.
            render = renpy.render(renpy.get_screen("notes"), config.screen_width, config.screen_height, 0, 0)
            surface = renpy.display.draw.render_to_texture(render, True)
            renpy.display.pgrender.pygame.image.save(surface, IMAGE)
            print("NESTED_GEOMETRY " + __import__("json").dumps(dict(aspect=[config.screen_width, config.screen_height], sdkVersion=renpy.version_only, rectangles=rectangles)), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)
screen nested_finish_screen():
    timer 0.5 action Function(nested_finish)
'''.replace('NAMES',repr(NAMES)).replace('IMAGE',repr(str(image)))
                    (project/'game/proof.rpy').write_text(proof)
                    commands=[('compile',['compile']),('lint',['lint','--error-code'])] if not args.reuse_compile_lint and aspect==(1280,720) and opening==100 else []
                    commands.append((f'layout-{aspect[0]}x{aspect[1]}-{opening}',['run']))
                    for name,arguments in commands:
                        result['sdkProcesses']+=1
                        previous=dict(os.environ)
                        try:
                            os.environ.clear();os.environ.update(env)
                            command=run_bounded(tuple(map(str,[*launcher,project,*arguments])),timeout_seconds=60,output_limit=2_000_000)
                        except OSError:
                            result['sdkProcesses']-=1
                            raise
                        finally:
                            os.environ.clear();os.environ.update(previous)
                        (output/(name+'.log')).write_text(command.output)
                        result['commands'].append(dict(name=name,exitCode=command.exit_code,timedOut=command.timed_out,outputLimited=command.output_limited))
                        if command.exit_code!=0 or command.timed_out or command.output_limited:
                            for filename in ['log.txt','traceback.txt','errors.txt']:
                                if (project/filename).is_file():shutil.copyfile(project/filename,output/(name+'-'+filename))
                        assert command.exit_code==0 and not command.timed_out and not command.output_limited,name+' failed'
                        assert (project/'game/ui/layout.rpy').read_bytes()==source,'Accepted source changed'
                    lines=[line[len('NESTED_GEOMETRY '):] for line in command.output.splitlines() if line.startswith('NESTED_GEOMETRY ')]
                    assert len(lines)==1,'Missing or duplicate geometry'
                    record=json.loads(lines[0]);validate(record,aspect,opening,image)
                    result['records'].append(dict(record,opening=opening,sourceSHA256=hashlib.sha256(source).hexdigest(),imageSHA256=hashlib.sha256(image.read_bytes()).hexdigest()))
        result['cleanupComplete']=not scratch.exists()
        result['passed']=result['cleanupComplete'] and len(result['records'])==4
    except Exception as error:
        result['failure']=dict(type=type(error).__name__,message=str(error));raise
    finally:
        if scratch is not None:result['cleanupComplete']=not scratch.exists()
        (output/'result.json').write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps(result,indent=2))


if __name__=='__main__': main()
