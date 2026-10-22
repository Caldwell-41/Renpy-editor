"""Regression fixtures for repository documentation links."""

import contextlib
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import validate


class MarkdownLinkTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.root_patch = patch.object(validate, "ROOT", self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def check(self, source, target="# Valid heading\n", name="guide.md"):
        self.write("README.md", source)
        self.write(name, target)
        errors = []
        validate.check_markdown_links(list(self.root.rglob("*.md")), errors)
        return errors

    def test_missing_section_in_existing_file_is_rejected(self):
        errors = self.check("[Continue](guide.md#removed-heading)\n")
        self.assertEqual(len(errors), 1)
        self.assertIn("removed-heading", errors[0])
        self.assertIn("README.md", errors[0])

    def test_same_file_heading_and_named_anchors(self):
        source = '''# Current state
<a id="Exact-ID"></a>
<a name='legacy-anchor'></a>
[Current](#current-state), [Exact](#Exact-ID), [Legacy](#legacy-anchor).
'''
        self.assertEqual(self.check(source), [])
        self.assertEqual(len(self.check(source + "[Wrong case](#exact-id)\n")), 1)

    def test_headings_keep_unicode_code_and_duplicate_suffixes(self):
        target = "## Révisions & `source_map`\n## Repeat\n## Repeat\n## Repeat-1\n"
        source = "[Unicode](guide.md#r%C3%A9visions--source_map) [Second](guide.md#repeat-1) [Collision](guide.md#repeat-1-1)\n"
        self.assertEqual(self.check(source, target), [])
        self.assertEqual(len(self.check("[Missing](guide.md#repeat-2)\n", target)), 1)

    def test_fenced_examples_and_comments_are_not_links_or_anchors(self):
        source = '''[Real](guide.md#visible)
````markdown
[Example](missing.md#example)
```
[Still an example](also-missing.md)
````
~~~text
[Tilde example](absent.md)
~~~
<!-- [Comment](unwritten.md) -->
`[Inline example](missing-inline.md)`
'''
        target = "# Visible\n```md\n# Hidden\n<a id='fake'></a>\n```\n<!--\n# Comment\n-->\n"
        self.assertEqual(self.check(source, target), [])
        self.assertEqual(len(self.check("[Hidden](guide.md#hidden)\n[Fake](guide.md#fake)\n[Comment](guide.md#comment)\n", target)), 3)

    def test_setext_heading_and_inline_formatting(self):
        target = "A **bold** _title_ &amp; [link](#a-bold-title--link)\n===\n"
        self.assertEqual(self.check("[Read](guide.md#a-bold-title--link)\n", target), [])

    def test_encoded_paths_angle_destinations_and_titles(self):
        source = '[Read](<notes/My guide.md#valid-heading> "Guide")\n'
        self.assertEqual(self.check(source, name="notes/My guide.md"), [])

    def test_reference_links_check_used_destinations(self):
        source = '''[Continue][Current section]
[Shortcut]
[current section]: guide.md#valid-heading
[shortcut]: guide.md#removed
'''
        errors = self.check(source)
        self.assertEqual(len(errors), 1)
        self.assertIn("removed", errors[0])

    def test_nested_list_links_are_checked_and_indented_code_is_ignored(self):
        source = "- Parent\n    - [Missing](absent.md#gone)\n    - [Stale](guide.md#missing)\n"
        self.assertEqual(len(self.check(source)), 2)
        examples = "    [Code](absent.md)\n\n- Parent\n\n      [Nested code](absent.md)\n"
        self.assertEqual(self.check(examples), [])

    def test_markdown_escapes_resolve_real_paths_and_fragments(self):
        self.assertEqual(self.check(r"[Read](guide\(1\).md#x\_y)" + "\n", "# x_y\n", name="guide(1).md"), [])

    def test_heading_inline_code_keeps_literal_text(self):
        target = "# `Vec<T>`\n# `[label](file)`\n# `__literal__`\n"
        source = "[Type](guide.md#vect) [Syntax](guide.md#labelfile) [Underscores](guide.md#__literal__)\n"
        self.assertEqual(self.check(source, target), [])

    def test_literal_comment_markers_do_not_hide_later_real_links(self):
        examples = [
            "`<!--`\n[Broken](absent.md)\n",
            "```html\n<!--\n```\n[Broken](absent.md)\n",
            "<!--\n```\n-->\n[Broken](absent.md)\n",
        ]
        for source in examples:
            with self.subTest(source=source):
                self.assertEqual(len(self.check(source)), 1)

    def test_external_and_non_markdown_fragments(self):
        self.write("diagram.svg", '<svg id="figure"/>\n')
        source = "[Web](https://example.com/guide#remote) [Mail](mailto:author@example.com) [Asset](diagram.svg#figure) [Top](guide.md#)\n"
        self.assertEqual(self.check(source), [])
        self.assertEqual(len(self.check("[Missing file](absent.md#section)\n")), 1)

    def test_validator_exit_status_rejects_a_removed_section(self):
        self.write("README.md", "[Continue](guide.md#removed)\n")
        self.write("guide.md", "# Valid heading\n")
        with patch.object(validate, "REQUIRED", ()), patch.object(validate, "check_git_diff"), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(validate.main(), 1)
            self.write("guide.md", "# Removed\n")
            self.assertEqual(validate.main(), 0)


if __name__ == "__main__":
    unittest.main()
