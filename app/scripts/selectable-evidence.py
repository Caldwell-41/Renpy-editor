"""Retain bounded SDK acquisition and pipeline failures before qualification starts."""
import argparse, hashlib, json, os, platform, subprocess, sys
from pathlib import Path
REPO = Path(__file__).resolve().parents[2]
SDK_NAME = 'renpy-8.5.3-sdk.tar.bz2'
SDK_HASH = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
CHECKSUMS = REPO / 'spikes/renpy-sdk/published/8.5.3-checksums.txt'
CHECKSUMS_HASH = '4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b'
SDK_URL = 'https://www.renpy.org/dl/8.5.3/' + SDK_NAME

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''): h.update(block)
    return h.hexdigest()

def write(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')

def prepare(output, identity):
    output.mkdir(parents=True, exist_ok=False)
    write(output / 'bootstrap.json', {'schemaVersion': 1, **identity,
        'sdkVersion': '8.5.3', 'sdkURL': SDK_URL,
        'publishedChecksumsURL': 'https://www.renpy.org/dl/8.5.3/checksums.txt',
        'publishedChecksumsSHA256': CHECKSUMS_HASH,
        'sdkAcquisitionPassed': False, 'packageBuilds': 0, 'appLaunches': 0})

def verify_archive(archive):
    sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
    from archive_safety import expected_sha256
    assert sha(CHECKSUMS) == CHECKSUMS_HASH, 'Published checksum snapshot changed'
    assert expected_sha256(CHECKSUMS.read_text(encoding='utf-8'), SDK_NAME) == SDK_HASH
    assert archive.name == SDK_NAME and sha(archive) == SDK_HASH, 'SDK archive differs from published pin'

def acquire(output, archive):
    receipt = json.loads((output / 'bootstrap.json').read_text(encoding='utf-8'))
    source = 'restored SHA-keyed official archive' if archive.exists() else 'official HTTPS download'
    log = output / 'sdk-acquisition.log'
    try:
        assert not receipt['sdkAcquisitionPassed'], 'SDK preparation already consumed'
        if not archive.exists():
            partial = archive.with_suffix(archive.suffix + '.partial')
            assert not partial.exists(), 'Preexisting partial archive refused'
            args = ['curl', '--proto', '=https', '--tlsv1.2', '--fail', '--location',
                '--connect-timeout', '20', '--max-time', '300', '--output', str(partial), SDK_URL]
            r = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=310)
            log.write_text(r.stdout + r.stderr, encoding='utf-8')
            assert r.returncode == 0, f'Official SDK download failed: exit {r.returncode}'
            # Verify the bytes before publishing the final archive name.
            assert sha(partial) == SDK_HASH, 'Downloaded archive differs from published pin'
            partial.replace(archive)
        else:
            log.write_text('Restored archive is verified against the previously qualified published checksum snapshot and fixed SDK pin.\n', encoding='utf-8')
        verify_archive(archive)
        receipt.update(sdkAcquisitionPassed=True, sdkSource=source, archiveSHA256=sha(archive))
    except Exception as error:
        receipt.update(sdkSource=source, failure=type(error).__name__ + ': ' + str(error))
        if not log.exists(): log.write_text(receipt['failure'] + '\n', encoding='utf-8')
        raise
    finally:
        write(output / 'bootstrap.json', receipt)

def finish(output):
    # A failed acquisition/identity/test must remain failed even when no result was produced.
    bootstrap = json.loads((output / 'bootstrap.json').read_text(encoding='utf-8'))
    child = output / 'qualification'
    errors = []
    def read(name, default, kind):
        path = child / name
        if not path.is_file(): return default
        try:
            value = json.loads(path.read_text(encoding='utf-8'))
            assert isinstance(value, kind), name + ' has invalid shape'
            return value
        except (OSError, ValueError, AssertionError) as error:
            errors.append(name + ': ' + str(error)); return default
    result = read('result.json', {}, dict)
    ledger = read('attempt-ledger.json', [], list)
    identity = read('identity.json', {}, dict)
    cleanup = read('cleanup.json', {}, dict)
    manifest = read('manifest.json', {}, dict)
    if any(not isinstance(e, dict) or e.get('kind') not in ('package-build', 'app-launch') for e in ledger):
        errors.append('Invalid attempt ledger entries'); ledger = []
    counts = {'packageBuilds': sum(e['kind'] == 'package-build' for e in ledger), 'appLaunches': sum(e['kind'] == 'app-launch' for e in ledger)}
    bound = all(identity.get(k) == bootstrap.get(k) for k in ('candidate', 'runId', 'attempt', 'os', 'architecture'))
    child_files = {p.relative_to(child).as_posix(): sha(p) for p in child.rglob('*') if p.is_file() and p != child / 'manifest.json'}
    sealed = manifest.get('schemaVersion') == 1 and bool(child_files) and manifest.get('files') == child_files
    passed = not errors and bound and sealed and cleanup.get('cleanupComplete') is True and bootstrap.get('sdkAcquisitionPassed') is True and result.get('passed') is True and all(result.get(k) == v for k, v in counts.items())
    write(output / 'pipeline.json', {'schemaVersion': 1, 'passed': passed,
        'candidate': bootstrap['candidate'], 'runId': bootstrap['runId'],
        'qualificationPresent': bool(result), **counts,
        'failure': None if passed else '; '.join(errors) or bootstrap.get('failure') or result.get('failure') or 'Qualification did not produce successful terminal evidence with matching identity'})
    files = {p.relative_to(output).as_posix(): sha(p) for p in output.rglob('*') if p.is_file() and p != output / 'artifact-manifest.json'}
    write(output / 'artifact-manifest.json', {'schemaVersion': 1, 'files': files})
    return passed

def main():
    p = argparse.ArgumentParser(); p.add_argument('stage', choices=('prepare', 'acquire', 'finish')); p.add_argument('--output', type=Path, required=True); p.add_argument('--archive', type=Path); a = p.parse_args()
    if a.stage == 'prepare':
        assert os.environ['GITHUB_RUN_ATTEMPT'] == '1' and os.environ['GITHUB_REF'] == 'refs/heads/codex/provider-qualification'
        prepare(a.output, {'candidate': os.environ['GITHUB_SHA'], 'runId': os.environ['GITHUB_RUN_ID'], 'attempt': 1, 'os': platform.system(), 'architecture': platform.machine()})
    elif a.stage == 'acquire':
        assert a.archive is not None; acquire(a.output, a.archive)
    else:
        if not finish(a.output): raise SystemExit('Selectable qualification failed; bootstrap and complete failure evidence retained')
if __name__ == '__main__': main()
