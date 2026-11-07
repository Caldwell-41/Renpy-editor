"""Exercise selection against real merge trees, including removed code paths."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import pr_scope


class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-b', 'base')
        self.write('docs/guide.md', 'guide\n')
        self.write('app/src/example.ts', 'export const value = 1;\n')
        self.commit()
        self.git('checkout', '-b', 'change')

    def git(self, *args):
        return subprocess.check_output(['git', '-c', 'user.name=Fixture',
            '-c', 'user.email=fixture@example.com', '-c', 'commit.gpgsign=false',
            *args], cwd=self.root, stderr=subprocess.PIPE)

    def write(self, path, value):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(value, encoding='utf-8')

    def commit(self):
        self.git('add', '.')
        self.git('commit', '--no-verify', '-m', 'fixture')

    def merge(self):
        self.commit()
        head = self.git('rev-parse', 'HEAD').decode().strip()
        self.git('checkout', 'base')
        base = self.git('rev-parse', 'HEAD').decode().strip()
        self.git('merge', '--no-ff', '--no-verify', '-m', 'merge', 'change')
        return {'pull_request': {'base': {'sha': base}, 'head': {'sha': head}}}

    def test_docs_and_branch_plan_complete_without_code_checks(self):
        self.write('docs/guide.md', 'updated\n')
        self.write('.github/validation-plan.json', '{}\n')
        event = self.merge()
        code, reason = pr_scope.select_scope('pull_request', event, self.git)
        self.assertFalse(code)
        self.assertIn('2 paths', reason)
        with tempfile.TemporaryDirectory() as output:
            folder = Path(output)
            (folder / 'event').write_text(json.dumps(event))
            with patch.dict('os.environ', {'GITHUB_EVENT_NAME': 'pull_request',
                    'GITHUB_EVENT_PATH': str(folder / 'event'),
                    'GITHUB_OUTPUT': str(folder / 'output'),
                    'GITHUB_STEP_SUMMARY': str(folder / 'summary')}), \
                    patch.object(pr_scope, 'select_scope', return_value=(code, reason)):
                pr_scope.main()
            self.assertEqual((folder / 'output').read_text(), 'code=false\n')
            self.assertIn('repository validation', (folder / 'summary').read_text())

    def test_mixed_pr_keeps_code_checks(self):
        self.write('docs/guide.md', 'updated\n')
        self.write('app/src/example.ts', 'export const value = 2;\n')
        self.assertTrue(pr_scope.select_scope('pull_request', self.merge(), self.git)[0])

    def test_rename_into_docs_cannot_hide_removed_code(self):
        self.git('mv', 'app/src/example.ts', 'docs/example.md')
        self.assertTrue(pr_scope.select_scope('pull_request', self.merge(), self.git)[0])

    def test_deleted_code_keeps_code_checks(self):
        self.git('rm', 'app/src/example.ts')
        self.assertTrue(pr_scope.select_scope('pull_request', self.merge(), self.git)[0])

    def test_missing_or_mismatched_parents_and_non_pr_events_keep_checks(self):
        self.assertTrue(pr_scope.select_scope('pull_request', {}, self.git)[0])
        self.write('docs/guide.md', 'updated\n')
        event = self.merge()
        for side in ('base', 'head'):
            wrong = json.loads(json.dumps(event))
            wrong['pull_request'][side]['sha'] = '0' * 40
            self.assertTrue(pr_scope.select_scope('pull_request', wrong, self.git)[0])
        self.assertTrue(pr_scope.select_scope('push', event, self.git)[0])
        self.git('checkout', event['pull_request']['head']['sha'])
        self.assertTrue(pr_scope.select_scope('pull_request', event, self.git)[0])

    def test_unavailable_or_empty_diff_keeps_checks(self):
        event = {'pull_request': {'base': {'sha': 'base'}, 'head': {'sha': 'head'}}}
        for result in (b'', b'not-terminated', subprocess.CalledProcessError(1, 'git')):
            def read(*args):
                if args[0] == 'rev-parse':
                    return b'base' if args[1] == 'HEAD^1' else b'head'
                if isinstance(result, Exception):
                    raise result
                return result
            self.assertTrue(pr_scope.select_scope('pull_request', event, read)[0])

    def test_allowlist_does_not_include_assets_fixtures_or_workflows(self):
        for path in ('docs/guide.md', 'README.md', '.github/validation-plan.json'):
            self.assertTrue(pr_scope.documentation(path), path)
        for path in ('docs/design/approval.json', 'docs/example.py', 'app/README.md',
                     'tests/fixture.md', '.github/workflows/quality.yml', 'LICENSE', ''):
            self.assertFalse(pr_scope.documentation(path), path)


if __name__ == '__main__':
    unittest.main()
