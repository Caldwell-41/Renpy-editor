"""Retire only six explicitly authorised, unchanged, content-integrated refs."""
import json
import os
import subprocess
import urllib.error
import urllib.parse
import urllib.request

REPO = "Caldwell-41/Renpy-editor"
EXPECTED = (
    ("ci/cost-controls", "3e2e5db8dc9e0ed89e369b532f6c7b29856917b2", None),
    ("security/public-release-hardening", "a4909a5aa7843b455ddd980249166e89bf98dfa2", "3aa30bf604f73395b820c2ff343c9e5f5851aac9"),
    ("phase1c-corrective", "5fe37d3a538d5d0514eb0347b15c7878d234c084", "6040682521e69e0980a863fa80d3ab12463ddac8"),
    ("phase1c-corrective-targets", "136adc9ba14c7820980e8c3c7a7273f06db4cdbd", "08daf385246c345f53f46f9dedc43762a1c060e9"),
    ("phase1c-corrective-closure", "907bab039a47e1d68baeb7fb20138e4d8d0639d9", "146a3033e6af5c57a0b23f8f627b29780268f4f9"),
    ("phase-1c-crash-consistency", "91b89dc5b1dc35e8aa321be61eb569218f5e93ce", "d405820b355be026dacd1905b665d38440828374"),
)


def api(path: str, method: str = "GET"):
    request = urllib.request.Request(
        "https://api.github.com/repos/" + REPO + "/" + path,
        headers={"Authorization": "Bearer " + os.environ["GH_TOKEN"],
                 "Accept": "application/vnd.github+json", "User-Agent": "loomlight-reconciliation"},
        method=method,
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read()
    return json.loads(data) if data else None


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()


def check_ancestor(ancestor: str, descendant: str) -> None:
    subprocess.run(["git", "merge-base", "--is-ancestor", ancestor, descendant], check=True)


if os.environ.get("GITHUB_REPOSITORY") != REPO:
    raise SystemExit("Unexpected repository")
main = api("git/ref/heads/main")["object"]["sha"]
open_prs = []
page = 1
while True:
    batch = api(f"pulls?state=open&per_page=100&page={page}")
    open_prs.extend(batch)
    if len(batch) < 100:
        break
    page += 1

# Validate every proof before performing any deletion.
for name, tip, integrated in EXPECTED:
    check_ancestor(integrated or tip, main)
    if integrated and git("rev-parse", tip + "^{tree}") != git("rev-parse", integrated + "^{tree}"):
        raise SystemExit("Tree-equivalence proof failed: " + name)
    if any(pr["head"]["ref"] == name or pr["base"]["ref"] == name for pr in open_prs):
        raise SystemExit("An open PR depends on branch: " + name)
    try:
        live = api("git/ref/heads/" + urllib.parse.quote(name, safe="/"))["object"]["sha"]
    except urllib.error.HTTPError as error:
        if error.code == 404:
            continue
        raise
    if live != tip:
        raise SystemExit("Branch advanced; preserving it: " + name)

for name, tip, integrated in EXPECTED:
    path = urllib.parse.quote(name, safe="/")
    try:
        # Recheck just before deletion; never force-push or replace a branch.
        live = api("git/ref/heads/" + path)["object"]["sha"]
    except urllib.error.HTTPError as error:
        if error.code == 404:
            print("Already absent: " + name)
            continue
        raise
    if live != tip:
        raise SystemExit("Branch advanced; preserving it: " + name)
    api("git/refs/heads/" + path, "DELETE")
    try:
        api("git/ref/heads/" + path)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            print("Retired: " + name + " | tip=" + tip + " | integrated=" + (integrated or tip))
            continue
        raise
    raise SystemExit("Deletion was not verified: " + name)
print("Main unchanged by cleanup; network-fix source and active correction retained.")
