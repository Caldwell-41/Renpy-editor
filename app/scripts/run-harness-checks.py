"""Run existing inexpensive harness regressions; never build or launch Loomlight.

All groups run independently. Failures stay failures, with raw logs and a summary.
The host gates are shared with the qualified Thinking workflow, not emulated OSes.
"""
import argparse
import ast
import importlib.util
import json
import platform
from pathlib import Path
import re
import subprocess
import sys

APP = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('thinking_gate', APP / 'scripts/check-thinking-evidence.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def retention_gate(output, host):
    source = ast.parse((APP / 'scripts/test-q1-package-retention.py').read_text(encoding='utf-8'))
    expected = {'__main__.PackageRetentionTests.' + node.name
                for cls in source.body if isinstance(cls, ast.ClassDef) and cls.name == 'PackageRetentionTests'
                for node in cls.body if isinstance(node, ast.FunctionDef) and node.name.startswith('test_')}
    rows = re.findall(r'^test_\w+ \(([\w.-]+)\) \.\.\. (ok|skipped [^\n]+)\s*$', output, re.M)
    skipped = {name for name, status in rows if status.startswith('skipped ')}
    excluded = {'__main__.PackageRetentionTests.test_macos_tar_preserves_symlinks'} if host == 'Windows' else set()
    runs = re.findall(r'^Ran (\d+) tests? in [^\n]+$', output, re.M)
    summaries = re.findall(r'^OK(?: \(skipped=(\d+)\))?\s*$', output, re.M)
    if (not expected or runs != [str(len(expected))] or len(rows) != len(expected)
            or {name for name, _ in rows} != expected or skipped != excluded
            or summaries != [str(len(excluded)) if excluded else '']
            or re.search(r'^(?:FAILED|ERROR:|FAIL:|UNEXPECTED SUCCESS:)', output, re.M)):
        raise ValueError('Retention cases did not execute exactly once with only their named host exclusion')


def checks(host):
    return (
        ('python', [sys.executable, '-m', 'unittest', 'discover', '-s', 'scripts', '-p', 'test_*.py', '-v'],
         lambda text: gate.verify_python(text, host)),
        ('q1-rejection', [sys.executable, 'scripts/check-q1-prep-gates.py', 'self-test'], None),
        ('q1-source', [sys.executable, 'scripts/check-q1-prep-gates.py', 'source-audit', '..'], None),
        ('retention', [sys.executable, 'scripts/test-q1-package-retention.py', '-v'],
         lambda text: retention_gate(text, host)),
    )


def run_checks(output, groups, execute=subprocess.run):
    records = []
    for name, command, validate in groups:
        record = {'name': name, 'passed': False, 'exitCode': None, 'timedOut': False}
        text = ''
        try:
            result = execute(command, cwd=APP, capture_output=True, text=True,
                             encoding='utf-8', errors='replace', timeout=180)
            text = result.stdout + result.stderr
            record['exitCode'] = result.returncode
            if result.returncode:
                raise ValueError('Command failed')
            if validate:
                validate(text)
            record['passed'] = True
        except subprocess.TimeoutExpired as error:
            def decoded(value):
                return value.decode('utf-8', errors='replace') if isinstance(value, bytes) else value or ''
            text = decoded(error.stdout) + decoded(error.stderr)
            record.update(timedOut=True, failure='TimeoutExpired')
        except Exception as error:
            record['failure'] = type(error).__name__ + ': ' + str(error)
        records.append(record)
        (output / (name + '.log')).write_text(text, encoding='utf-8')
        # Assertions must be visible in CI even when the group fails.
        print(f'\n[{name}]', flush=True)
        print(text, end='' if text.endswith('\n') else '\n', flush=True)
        print(json.dumps(record), flush=True)
        (output / 'checks.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf-8')
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if sys.version_info < (3, 11):
        parser.error('Python 3.11 or later is required')
    host = {'Darwin': 'macOS', 'Windows': 'Windows'}.get(platform.system())
    if host is None:
        parser.error('Run on the actual supported Windows or macOS host')
    args.output.mkdir(parents=True, exist_ok=False)
    records = run_checks(args.output, checks(host))
    result = {'schemaVersion': 1, 'host': host, 'architecture': platform.machine(),
              'python': platform.python_version(), 'checks': records,
              'passed': len(records) == 4 and all(row['passed'] for row in records)}
    (args.output / 'result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    summary = '\n'.join(f"- {row['name']}: {'PASS' if row['passed'] else 'FAIL'}" for row in records) + '\n'
    (args.output / 'summary.md').write_text(summary, encoding='utf-8')
    print(summary)
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
