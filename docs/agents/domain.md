# Domain docs

Loomlight uses a single-context layout with a root GLOSSARY.md and
repository-wide decisions in docs/adr/.

## Before domain exploration

Read GLOSSARY.md if it exists. Read docs/adr/README.md and the ADRs relevant
to the work. Use docs/INDEX.md to find canonical product, architecture,
data and workflow contracts.

If a glossary is absent, continue without creating a placeholder.
The domain-modeling skill can add terms when they are resolved.

## Vocabulary and decisions

Use glossary terms consistently in issues, proposals, code and tests.
Check existing contracts before introducing a new domain term.

Identify conflicts with an existing ADR explicitly. Follow
docs/adr/README.md when recording decisions or proposing supersession.

Current delivery and acceptance live in GitHub Issues. An ADR's status
does not prove implementation or acceptance.
