# Design Lab rules

Use the [README](README.md) for the add-screen recipe. These rules own browser
prototype behaviour; product acceptance remains under [TESTING](../../docs/TESTING.md).

- Keep each screen's code, fictional sample data and scoped experimental CSS in its
  own `screens/` directory. Register its layouts and named states in `registry.ts`.
  Choose `prototype` for experimental UI or `component-preview` for an existing
  production renderer. Describe which parts are simulated.
- Reuse production styles and icons by import. Production imports must remain
  independent of Design Lab. Keep lab entries and assets outside production `src`,
  `public` and build inputs. Preserve the existing production build configuration.
- Mount individual renderers through sample callbacks. The lab's native substitute
  supplies memory-only preferences and refuses every other operation. Supply data
  through explicit renderer callbacks; unknown operations must fail visibly rather
  than return a successful empty response. Keep sample actions in browser memory.
- Use fresh fictional data on each mount. Scenario changes and Reset open a fresh
  document. Keep project files, credentials, model requests and SDK execution in
  their existing application workflows.
- Keep the current fonts, colours and icons unless the selected task changes them.
  Use real editable controls and enough interaction to review the selected task.
  Preserve existing capabilities; identify additions, removals and changed behaviour
  in the screen's review notes.
- Before review, run the local module check and try the changed interaction at the
  relevant sizes and themes. Add a focused screen check when the interaction needs
  repeatable proof. Repair failed checks at their actual layer. Browser evidence
  establishes sample rendering and interaction, not real saves or native acceptance.
- Approval, promotion or app integration: read [INTEGRATION](INTEGRATION.md) before
  changing approval records or product code. It defines the source/approval checks,
  real-operation mapping, comparison loop and completion criteria.
