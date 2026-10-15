# Character workspace concepts — 2026-10-15

Status: **B selected; refined expanded/focus states awaiting review**. The original
three built-in ImageGen mockups were informed by
one user-requested research-only subagent and owner source/visual review. No application
implementation, source/reference mutation, new app launch or Studio request. The live
Mara draft remains unsaved and untouched. These concepts extend the agreed unified
character/game-setup/card direction; they do not establish phase acceptance.

The user dislikes the current hierarchy, layout shifts and inconsistent creation
placement. Relationships feel cluttered; Story links & knowledge notes is unclear.
Essentials lead in every concept. Relationships become concise summaries with editing
on demand, while knowledge/lore/applicability receive separate plain labels. One cast
list, explicit Planning only/In game state, Create game character/Link existing paths,
consistent creation position and stable save actions remain shared requirements.

| Concept | Image | Why compare it | Tradeoff |
| --- | --- | --- | --- |
| A — Character notebook | [Full image](a-character-notebook.png) | Direct prose, essentials visible together, optional details in a quiet rail. Owner's suggested starting point for writing comfort. | Long notes still need document navigation; generated serif headings are illustrative, not a new accepted font system. |
| B — Focused section editor | [Full image](b-section-editor.png) | Choose a topic, then edit just that topic. Explicit section navigation separates writing from relationships and knowledge. | More navigation/panels; compact behavior needs design and verification. |
| C — Visual character overview | [Full image](c-character-overview.png) | Fixed grid summarizes identity, motivations, voice and relationships at a glance, with optional reference imagery. | More visual framing and less room for long prose. Portraits are illustrative; reference-image functionality is not separately selected by this mockup. |

Images are each1586×992. Owner inspected all three; C received one targeted refinement
to restore Writing/Game setup, remove Edit-unlock actions, quiet game-creation actions
and anchor New character independently of game status. Three initial generations plus
one refinement were used. Preserve the implementation's ordinary direct editing and
source/refusal/approval behavior; generated UI details are not authoritative contracts.
Static mockups cannot prove stable switching, keyboard use, draft retention or native
responsive behavior. Both accepted themes remain required if implementation is selected.

## Refined B — more room for writing

The user prefers B and requests helpers under every card text field, a collapsible
character list, and more editor space. These refinements are proposed, not implemented.

| State | Image | Intended behavior |
| --- | --- | --- |
| Expanded character list | [B refined — expanded](b-refined-expanded-v2.png) | Slim cast list has Hide characters. Topics move above the editor, the right inspector is removed, and game-link settings remain under Game setup. |
| Focused writing | [B refined — focus](b-refined-focus-v2.png) | Character list is hidden and app navigation becomes icons. Show characters and Exit focus provide visible restore paths. The selected name, topic, text/help and save controls remain reachable. |

Ordinary cast-list collapse should preserve the user's selection/draft and remember
the layout choice. Focus is an explicit extra action; switching topics/characters must
not unexpectedly toggle it. At compact widths, topic navigation can become one labelled
selector instead of reintroducing a sidebar. This is a behavioral design requirement,
not something the generated screenshots prove.

Persistent helper text sits immediately below each card writing field, separate from
placeholder text and errors. [Draft helper copy](b-field-help.json) covers other fields.
For the visible fields:

- Personality: describe traits, habits and reactions; concrete examples help the AI
  keep behavior consistent.
- Motivations: state what they want and why it matters; this helps give their choices
  a clear reason.

One note explains that the AI uses a card only when included in a request. Help must
not suggest automatic sends, guaranteed model compliance or automatic tracking of what
a character knows. No AI/provider operation was initiated for these examples.

Built-in ImageGen used three B-refinement calls: expanded draft, one targeted creation-
button correction, and focus state. Cumulative design calls7 (original3, C correction1,
B refinement3); researcher count remains1. Owner visually reviewed both final1586×992
outputs; no native app, fixture draft or source change. Earlier A/B/C images remain
preserved. Static examples do not prove compact wrapping, keyboard use or no layout shift.

Exact prompts: [expanded](b-refined-expanded.txt), [header correction](b-refined-expanded-header-fix.txt),
[focus](b-refined-focus.txt). Next: user review of width, collapse controls and helper text.

## Research and design interpretation

- [Novelcrafter: Anatomy of a Codex Entry](https://www.novelcrafter.com/help/docs/codex/anatomy-codex-entry)
  documents a constant identity header and changing tab contents, with a freeform
  description and optional details. This informs stable identity and progressive disclosure.
- [Scrivener: Advanced Character Sketch Templates](https://www.literatureandlatte.com/blog/using-advanced-character-sketch-templates-in-scrivener)
  documents prose sketches and nested character documents. This informs A's notebook.
- [World Anvil: Character Template](https://www.worldanvil.com/learn/article-templates/character)
  starts with free writing and offers optional structured prompts. This informs essentials-first editing.
- [Campfire: Characters Tutorial](https://www.campfirewriting.com/learn/characters-tutorial)
  documents discrete character panels. This informs grouped, bounded overview sections.
- [Milanote: Character Profile](https://milanote.com/templates/creative-writing/character-profile)
  demonstrates visual arrangements of notes and reference images. This informs C's
  overview; its fixed grid is our adaptation, not copied product behavior.

Research used official public pages and documented interface examples, not logged-in
product testing. The three arrangements and their expected benefits are design
inferences. No other product's exact interface or branding is copied.

## Reproduction and review

- [A prompt](a-character-notebook.txt)
- [B prompt](b-section-editor.txt)
- [C initial prompt](c-character-overview.txt) and [targeted refinement](c-character-overview-refinement.txt)
- [Research records](research.json) and [image hashes/review manifest](manifest.json)

Next: review the refined B expanded/focus states. Record the user's decision
before selecting any implementation scope, budget or replacement app build. All earlier
walkthrough feedback and the unreviewed unsaved-profile request preview remain open.
