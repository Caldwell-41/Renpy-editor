# Security policy

## Supported versions

Project Loomlight is pre-release software. Security fixes are applied to the current
`main` development line unless a release states otherwise.

## Reporting a vulnerability

Please do not disclose exploitable vulnerabilities, credentials, private user data, or
proof-of-concept attack details in a public issue or discussion.

When GitHub private vulnerability reporting is enabled for this repository, use the
repository **Security** tab and choose **Report a vulnerability**. This creates a private
security advisory visible only to the reporter and repository maintainers while the
issue is assessed and fixed.

If private vulnerability reporting is temporarily unavailable, open a minimal public
issue stating only that you need a private security-reporting channel. Do not include
technical exploit details, secrets, or affected user data in that issue.

Useful reports include the affected version or commit, operating system, impact,
reproduction prerequisites, and the smallest safe reproduction that does not expose
real secrets or private project content.

## Security design

The project's threat model, trust boundaries, privacy rules, credential handling,
Ren'Py execution boundary, and repository controls are documented in
[`docs/SECURITY.md`](docs/SECURITY.md).

The repository intentionally treats Ren'Py projects and LLM output as untrusted.
Opening a project for inspection must not execute project Python; actions that can
execute project-controlled code require an explicit trust boundary.

## Secrets

Never submit real API keys, GitHub tokens, signing identities, personal credentials,
private project content, absolute user-home paths, or unredacted diagnostic bundles in
issues, pull requests, fixtures, or vulnerability reports.
