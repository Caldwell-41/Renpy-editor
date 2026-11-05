"""Admission checks for the #51/#52 public-core accepted-source export.

Importing this module and checking receipts never starts an SDK or canvas helper.
"""
import importlib.util
from pathlib import Path
import re


EXPORT_TEST = 'screens::tests::controls::export_screen_controls_public_core_fixture'
STATES = ('normal', 'hover', 'selected', 'selectedHover', 'disabled', 'selectedDisabled')
RESOLUTIONS = ((1280, 720), (1024, 768))

_spec = importlib.util.spec_from_file_location(
    'screen_controls_file_utilities', Path(__file__).with_name('qualify-help-panel.py'))
files = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(files)
require, load_json, digest = files.require, files.load_json, files.digest
portable_file = files.portable_file


def validate_core_output(text, manifest_sha):
    """Require the selected test and one source-bound, engine-free receipt."""
    require(isinstance(manifest_sha, str) and re.fullmatch('[a-f0-9]{64}', manifest_sha),
            'invalid manifest hash')
    lines = text.splitlines()
    require(lines.count('test ' + EXPORT_TEST + ' ... ok') == 1,
            'required controls exporter missing/duplicated')
    summaries = [line for line in lines if line.startswith('test result:')]
    require(len(summaries) == 1 and re.fullmatch(
        r'test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; '
        r'\d+ filtered out; finished in [0-9.]+s', summaries[0]),
        'controls exporter did not run exactly once successfully')
    rows = [load_json(line.removeprefix('SCREEN_CONTROLS_FIXTURE '))
            for line in lines if line.startswith('SCREEN_CONTROLS_FIXTURE ')]
    require(rows == [dict(schemaVersion=1, manifestSHA256=manifest_sha,
                          publicCoreRequests=True, engineStarted=False)],
            'wrong/incomplete controls exporter receipt')
    row = rows[0]
    require(type(row['schemaVersion']) is int and row['publicCoreRequests'] is True
            and row['engineStarted'] is False, 'wrong controls exporter receipt types')


def validate_files(root, records):
    """Bind every accepted game input; metadata sidecars stay outside game/."""
    require(type(records) is list and 1 <= len(records) <= 32,
            'missing/unbounded accepted controls files')
    hashes = {}
    for record in records:
        require(type(record) is dict and set(record) == {'path', 'sha256', 'bytes'},
                'invalid accepted file receipt')
        relative = record['path']
        require(isinstance(relative, str) and relative.startswith('game/')
                and relative.endswith(('.rpy', '.png')) and relative not in hashes
                and '.renpy-editor' not in Path(relative).parts,
                'unexpected/duplicate accepted game input')
        path = portable_file(root, relative)
        require(type(record['bytes']) is int and 0 <= record['bytes'] <= 2_000_000
                and path.stat().st_size == record['bytes'], 'wrong accepted file size')
        require(isinstance(record['sha256'], str)
                and re.fullmatch('[a-f0-9]{64}', record['sha256'])
                and digest(path) == record['sha256'], 'changed accepted game input')
        hashes[relative] = record['sha256']
    actual = set()
    for path in (root / 'game').rglob('*'):
        require(not path.is_symlink(), 'linked accepted game input')
        if path.is_file():
            actual.add(path.relative_to(root).as_posix())
    require(actual == set(hashes), 'missing/undeclared accepted game input')
    return hashes
