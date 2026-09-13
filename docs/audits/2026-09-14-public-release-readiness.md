# Public release readiness audit — 2026-09-14

## Scope

This review considers whether changing `Caldwell-41/Renpy-editor` from private to
public would expose credentials, personal information, private creative content,
unsafe CI behavior, or misleading release artifacts. It does not change repository
visibility and does not authorize Phase 1B or later product work.

## Current assessment

No current tracked secret, personal email address, real name, absolute user-home path,
private game content, signing material, or production credential was identified during
the repository review. Commit metadata uses the GitHub noreply identity. The fixture
game and test data are synthetic.

The repository already has useful defense-in-depth controls: ignored local secrets and
signing material, placeholder-only environment examples, read-only GitHub Actions
permissions, commit-pinned third-party Actions, a repository privacy validator, and a
security threat model.

## Findings to close before changing visibility

### 1. Full-history secret scan

Run a dedicated secret scanner across all reachable Git history immediately before the
visibility change. The repository validator checks the current checkout; it cannot
prove that a secret was never committed and later deleted. Any real credential found
in history must be revoked or rotated before history remediation is considered.

### 2. Historical Actions exposure

Changing the repository to public makes historical Actions logs and run metadata
publicly visible. Review old runs for paths, diagnostics, credentials, or private
content before the switch.

Do not expose retained experimental desktop packages as if they were releases. Allow
short-retention Phase 0/Phase 1A package artifacts to expire or delete them before the
visibility change. The repository currently has no GitHub Releases.

### 3. Repository privacy validation

`scripts/validate.py` must scan application and script source formats as well as
Markdown/configuration files. The public-release hardening change expands coverage to
Rust, TypeScript/JavaScript, Ren'Py, HTML/CSS, PowerShell, and shell sources and adds
several common credential patterns. This remains defense in depth rather than a
replacement for GitHub secret scanning or a dedicated history scanner.

### 4. GitHub account privacy

Before publication, verify that the GitHub account's public profile does not expose a
personal email unless that is intentional, and keep repository commit identity on the
GitHub noreply address.

### 5. Public repository controls

After changing visibility to public:

- enable GitHub Secret Protection / secret scanning and repository push protection;
- enable private vulnerability reporting;
- keep `main` protected against force-push and deletion and require the lightweight
  repository-quality check where practical;
- do not attach personal computers as self-hosted runners to workflows that can execute
  untrusted public pull-request code;
- keep workflow token permissions least-privilege and do not expose signing or provider
  secrets to pull requests from forks.

## Publication checklist

- [ ] Current `main` is the intended public source state.
- [ ] `python3 scripts/validate.py` passes on the exact commit to be published.
- [ ] A full reachable-history secret scan passes, or every finding is manually
      classified and real credentials are rotated.
- [ ] Historical Actions logs have been reviewed for private information.
- [ ] Experimental package artifacts have expired or been removed.
- [ ] GitHub public-profile email exposure is intentional or disabled.
- [ ] Repository licence choice is explicit; lack of an open-source licence is
      intentional if source is only being made publicly visible.
- [ ] Root `SECURITY.md` is present and private vulnerability reporting is enabled.
- [ ] Secret scanning and push protection are enabled after publication.
- [ ] `main` force-push/deletion protection is configured.
- [ ] No public workflow executes untrusted pull-request code on a personal/self-hosted
      runner.

## Residual risk

Pattern-based scanning cannot establish that arbitrary text is non-sensitive, and a
public repository is permanently copyable once published. Repository visibility should
therefore change only after the exact public commit and its reachable history have been
reviewed. If a secret is found after publication, revoke/rotate it first; deleting the
file or rewriting Git history alone is not credential remediation.
