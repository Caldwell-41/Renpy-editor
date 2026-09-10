# Ren'Py SDK adapter and installer spike

This disposable Phase 0 spike tests two boundaries without becoming application code:

- a version-pinned, allowlisted Ren'Py 8.5.3 command adapter; and
- checksum-first, hostile-archive-resistant SDK installation.

The repository never stores an SDK archive or extracted SDK. Unit tests use only
synthetic archives. A real SDK probe must use a disposable directory outside the
repository and requires an explicit `--allow-project-execution` flag for commands
that load project code.

## Commands

```bash
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/renpy-sdk/probe.py --help
```

See [the recorded Linux results](../../docs/research/RENPY_SDK_SPIKE_RESULTS.md)
before repeating the networked probe.
