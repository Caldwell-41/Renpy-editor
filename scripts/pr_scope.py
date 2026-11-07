"""Select code checks unless the tested PR merge is positively docs-only."""
import json
import os
from pathlib import Path, PurePosixPath
import subprocess


def documentation(path):
    name = PurePosixPath(path)
    return (path == '.github/validation-plan.json'
            or (name.suffix == '.md' and (len(name.parts) == 1 or name.parts[0] == 'docs')))


def git(*args):
    return subprocess.check_output(['git', *args], stderr=subprocess.PIPE)


def select_scope(event_name, event, read_git=git):
    if event_name != 'pull_request':
        return True, 'Code checks required outside pull requests.'
    try:
        pr = event['pull_request']
        for parent, side in (('HEAD^1', 'base'), ('HEAD^2', 'head')):
            if read_git('rev-parse', parent).decode().strip() != pr[side]['sha']:
                return True, 'Code checks required: checkout does not match the PR parents.'
        raw = read_git('diff', '--no-renames', '--name-only', '-z', 'HEAD^1', 'HEAD', '--')
        if not raw or not raw.endswith(b'\0'):
            return True, 'Code checks required: no complete changed-path list.'
        paths = raw.decode('utf-8').split('\0')[:-1]
        if not all(documentation(path) for path in paths):
            return True, f'Code checks required: {len(paths)} changed paths include non-documentation inputs.'
        return False, f'Documentation-only PR: {len(paths)} paths; repository validation remains required.'
    except (KeyError, TypeError, ValueError, UnicodeError, OSError, subprocess.CalledProcessError):
        return True, 'Code checks required: PR comparison unavailable.'


def main():
    try:
        event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text(encoding='utf-8'))
    except (KeyError, OSError, ValueError):
        event = {}
    code, reason = select_scope(os.environ.get('GITHUB_EVENT_NAME'), event)
    print(reason)
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as summary:
        summary.write(reason + '\n')
    # Publish only after the decision and its explanation are complete.
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
        output.write('code=' + str(code).lower() + '\n')


if __name__ == '__main__':
    main()
