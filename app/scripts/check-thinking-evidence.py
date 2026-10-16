"""Reject missing, skipped, partial or failed selected Cargo results."""
from pathlib import Path
import re
import sys


def verify_cargo(listing, output):
    selected = re.findall(r'^([^\s]+): test$', listing, re.M)
    passed = re.findall(r'^test ([^\s]+) \.\.\. ok$', output, re.M)
    summaries = re.findall(r'test result: ok\. (\d+) passed; (\d+) failed; (\d+) ignored;', output)
    if (not selected or len(set(selected)) != len(selected) or len(passed) != len(selected)
            or set(passed) != set(selected) or summaries != [(str(len(selected)), '0', '0')]):
        raise ValueError('Selected Cargo tests did not all execute and pass exactly once')
    return len(selected)


if __name__ == '__main__':
    print(verify_cargo(Path(sys.argv[1]).read_text(encoding='utf-8'), Path(sys.argv[2]).read_text(encoding='utf-8')))
