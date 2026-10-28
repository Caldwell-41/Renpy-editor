// Explicit L02 controller. Synthetic input reaches the production UI and core.
(async () => {
  const stages = [], started = performance.now();
  let stage = "open", serial = 0, sessionId, identity, acceptedSource, identities, awaitedControl = "recent project", keyObservation;
  const assert = (value, message) => { if (!value) throw Error(message); };
  const until = async condition => {
    const deadline = performance.now() + 30000;
    while (!await condition()) { if (performance.now() > deadline) throw Error(`Timeout: ${stage}`); await new Promise(resolve => setTimeout(resolve, 30)); }
  };
  const call = async (operation, payload = {}) => window.__loomlightProbeRetryBusy(async () => {
    const result = await window.__TAURI_INTERNALS__.invoke("core_request", { request: { protocolVersion: 1, requestId: `compose-${++serial}`, operation, payload: operation === "project.current" ? payload : { sessionId, ...payload } } });
    if (!result.ok) throw Object.assign(Error(`${operation}: ${result.error.code}`), { code: result.error.code });
    return result.value;
  });
  const find = window.__loomlightProbeFindButton;
  const click = async label => { awaitedControl = `button ${label}`; await until(() => find(label) && !find(label).disabled); find(label).click(); };
  const checkpoint = async name => { stage = name; stages.push({ stage, elapsedMs: Math.round(performance.now() - started) }); await window.__loomlightCompositionObserve?.(name); };
  const inspect = () => call("screens.inspect", { path: identity.path });
  const source = async () => (await call("source.open", { path: identity.path })).text;
  const nodes = document => document.screens.find(screen => screen.name === "travel_notes").nodes;
  const row = id => [...document.querySelectorAll(".screen-tree [data-node-id]")].find(element => element.dataset.nodeId === id);
  const selected = () => document.querySelector('.screen-tree [aria-selected="true"]')?.dataset.nodeId;
  const select = async id => { await until(() => row(id) && !row(id).disabled); row(id).click(); assert(selected() === id, "Hierarchy selects the stable element identity"); };
  const input = (label, value) => { const target = document.querySelector(`[aria-label="${label}"]`); assert(target, `${label} exists`); target.focus(); target.value = value; target.dispatchEvent(new Event("input", { bubbles: true })); return target; };
  const add = async (parent, kind, text = "") => {
    await select(parent); const before = await source();
    await click("Add element"); await until(() => document.querySelector(".screen-addition"));
    document.querySelector(`[data-kind="${kind}"]`).click();
    if (kind === "text" || kind === "textbutton") input("New element text", text);
    const captions = { fixed: "free layout group", frame: "frame", vbox: "vertical group", text: "text", textbutton: "button" };
    await click(`Add ${captions[kind]}`); await until(() => !document.querySelector(".screen-addition"));
    const documentAfter = await inspect(), added = nodes(documentAfter).find(node => node.id === selected());
    assert(added?.kind === kind && added.id !== parent, "Addition selects the newly owned node");
    assert((await source()).startsWith(before), "Appending an element preserves every prior source byte");
    return added.id;
  };
  const history = async (direction, expected, id) => {
    await click(direction); await until(async () => {
      if (await source() !== expected || selected() !== id) return false;
      const current = nodes(await inspect()), rows = [...document.querySelectorAll('.screen-tree [data-node-id]')];
      return rows.length === current.length && current.every((node, index) => rows[index]?.dataset.nodeId === node.id && (!node.literal || rows[index].getAttribute('aria-label').includes(node.literal)));
    });
    assert(await source() === expected, `${direction} restores exact source`);
    assert(selected() === id, `${direction} restores the expected selected identity`);
  };
  try {
    await until(() => document.querySelector(".recent-open") && !document.querySelector(".recent-open").disabled); document.querySelector(".recent-open").click();
    await click("Screens"); await until(() => find("New blank screen"));
    sessionId = (await call("project.current")).sessionId;
    await click("New blank screen"); await until(() => document.querySelector('[aria-label="Screen name"]'));
    input("Screen name", "travel_notes").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await until(() => document.querySelector('.screen-tree [data-node-id]'));
    identity = (await call("screens.list")).owned[0]; assert(identity?.resolved, "Created owned screen resolves");
    const fixed = await add(identity.rootId, "fixed"), frame = await add(fixed, "frame"), box = await add(frame, "vbox");
    const title = await add(box, "text", "Travel notes"), body = await add(box, "text", "Your next stop"), close = await add(box, "textbutton", "Close");
    const nested = await source();
    await history("Undo", nested.slice(0, nested.lastIndexOf('                textbutton ')), box);
    await history("Redo", nested, box);
    await checkpoint("composition-passed");

    const beforeValidation = await source();
    await click("Add element");
    const blankAddition = input("New element text", " \n ");
    await click("Add text");
    assert(document.activeElement === blankAddition && blankAddition.getAttribute("aria-invalid") === "true", "Invalid addition retains its field, text and focus");
    assert(document.getElementById(blankAddition.getAttribute("aria-describedby"))?.textContent.includes("Enter text"), "Invalid addition identifies its field error");
    assert(await source() === beforeValidation && blankAddition.value === " \n ", "Invalid addition writes nothing and retains input");
    await window.__loomlightCompositionObserve?.("invalid-addition"); await click("Cancel");
    await select(body); row(body).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await until(() => document.querySelector('textarea[aria-label="Text"]'));
    const blankText = input("Text", " \n "); await click("Apply changes");
    assert(document.activeElement === blankText && blankText.getAttribute("aria-invalid") === "true", "Invalid Apply retains the same field and focus");
    assert(document.getElementById(blankText.getAttribute("aria-describedby"))?.textContent.includes("Enter text"), "Invalid Apply identifies its field error");
    assert(await source() === beforeValidation && blankText.value === " \n ", "Invalid Apply writes nothing and retains input");
    await window.__loomlightCompositionObserve?.("invalid-text");
    await click("Cancel changes"); await click("Back to elements");
    await checkpoint("text-validation-passed");

    await select(body); row(body).dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); await until(() => document.querySelector('textarea[aria-label="Text"]'));
    const beforeText = await source(); input("Text", 'Next stop: "Harbor"\nPlatform 2'); await click("Apply changes");
    await until(() => document.querySelector(".screen-message")?.textContent.includes("Text applied"));
    const afterText = await source(); assert(afterText === beforeText.replace('"Your next stop"', '"Next stop: \\"Harbor\\"\\nPlatform 2"'), "Text Apply changes only the literal token");
    const noOp = input("Text", "temporary"); noOp.value = 'Next stop: "Harbor"\nPlatform 2'; noOp.dispatchEvent(new Event("input", { bubbles: true })); assert(find("Apply changes").disabled, "Unchanged text cannot add history");
    input("Text", "cancel this draft"); await click("Cancel changes"); assert(await source() === afterText, "Cancel leaves accepted source unchanged");
    await click("Back to elements");
    await history("Undo", beforeText, body); await history("Redo", afterText, body);
    await checkpoint("literal-history-passed");

    await select(body); row(body).focus();
    row(body).addEventListener("keydown", event => { keyObservation = {key:event.key,altKey:event.altKey,selected:selected()}; }, {once:true,capture:true});
    awaitedControl = "keyboard sibling reorder"; row(body).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true }));
    await until(() => document.querySelector(".screen-message")?.textContent.includes("Order changed"));
    const reordered = await source(); assert(reordered.indexOf('text "Next stop:') < reordered.indexOf('text "Travel notes"'), "Keyboard sibling reorder changes source order");
    assert(selected() === body && document.activeElement === row(body), "Reorder retains identity and keyboard focus");
    await history("Undo", afterText, body); await history("Redo", reordered, body);
    await checkpoint("reorder-passed");

    await select(close); row(close).focus(); const invoker = row(close), card = document.querySelector(".screen-card"), position = card.getBoundingClientRect(), scroll = card.scrollTop;
    row(close).dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
    await until(() => document.querySelector(".screen-removal-dialog[open]"));
    const dialog = document.querySelector(".screen-removal-dialog"); assert(document.activeElement.textContent === "Cancel", "Cancel starts focused");
    assert(dialog.textContent.includes("Close"), "Individual confirmation names the element");
    assert(card.scrollTop === scroll && card.getBoundingClientRect().top === position.top, "Confirmation keeps the page stationary");
    await click("Cancel"); assert(document.activeElement === invoker && card.scrollTop === scroll, "Cancel restores exact invoker and scroll"); assert(await source() === reordered, "Cancel does not write");
    await select(frame); await click("Remove element"); await until(() => dialog.open);
    for (const text of ["Vertical group", "Travel notes", 'Next stop: "Harbor"', "Close"]) assert(dialog.textContent.includes(text), "Group confirmation lists every descendant");
    await click("Cancel");
    await select(close); await click("Remove element"); await until(() => dialog.open); await click("Remove text button"); await until(() => !dialog.open);
    const removed = await source(), buttonLine = reordered.split('\n').find(line => line.includes('textbutton "Close"')) + '\n';
    assert(removed === reordered.replace(buttonLine, ""), "Removal deletes the exact element and no neighboring bytes");
    assert(selected() === title && document.activeElement === row(title), "Last-child removal selects and focuses previous sibling");
    await history("Undo", reordered, close); await history("Redo", removed, title); await history("Undo", reordered, close);
    await checkpoint("confirmed-removal-passed");

    await click("View in Source"); await until(() => document.querySelector(".screen-source-dialog[open]")); await click("Edit in Source"); await until(() => document.querySelector(".source-editor"));
    const editor = window.__loomlightProbeEditor(document.querySelector(".source-editor"));
    // Real Source reconciliation adds an opaque neighbor and shifts all byte offsets.
    const protectedSource = '# Source offset retained\n' + reordered + '        use source_only_footer()\n\nscreen source_only_footer():\n    frame:\n        xpos 860\n        ypos 620\n        text "Protected neighbor"\n';
    editor.value = protectedSource; editor.dispatchEvent(new Event("input", { bubbles: true })); await click("Save Source");
    await until(() => document.querySelector("#app-status")?.textContent === "Saved"); await click("Screens");
    await until(() => document.querySelector('.screen-tree [data-node-id^="source-"]'));
    const reconciled = nodes(await inspect()); identities = [identity.rootId, fixed, frame, box, title, body, close];
    assert(identities.every(id => reconciled.some(node => node.id === id)), "Source reconciliation retains all owned identities");
    await select(fixed); row(fixed).dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
    assert(!dialog.open && await source() === protectedSource, "Containing group removal refuses protected source");
    const opaque = reconciled.find(node => node.kind === "custom"); assert(opaque && row(opaque.id), "Opaque neighbor remains visible in hierarchy");
    await select(frame); row(frame).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true }));
    assert(await source() === protectedSource, "Reorder refuses to cross protected source");
    await click("Remove element"); await until(() => dialog.open); await click("Remove group and 4 children"); await until(() => !dialog.open);
    assert(selected() === opaque.id && document.activeElement === row(opaque.id), "Group removal selects protected next sibling without altering it");
    const groupRemoved = await source(); assert(groupRemoved.includes('        use source_only_footer()\n'), "Protected bytes survive neighboring group removal");
    await history("Undo", protectedSource, frame); await history("Redo", groupRemoved, opaque.id); await history("Undo", protectedSource, frame);
    acceptedSource = await source(); await select(body);
    await checkpoint("protected-source-passed");

    await click("Close Project"); await until(() => document.querySelector(".recent-open")); document.querySelector(".recent-open").click();
    await until(() => find("Screens")); const reopened = await call("project.current"); assert(reopened.sessionId !== sessionId, "Reopen starts a new session"); sessionId = reopened.sessionId;
    await click("Screens"); await until(() => row(body));
    assert(selected() === body, "Reopen restores selected element identity");
    assert(await source() === acceptedSource, "Reopen preserves accepted source bytes");
    const reopenedNodes = nodes(await inspect());
    assert(identities.every(id => reopenedNodes.some(node => node.id === id)), "Reopen preserves all owned identities");
    await checkpoint("reopen-passed"); await checkpoint("complete");
    await call("probe.runtimeUiReport", { scenario: "screen-composition", passed: true, stage, stages, identity, identities, acceptedSource, nativeWebView: true, sdkExecuted: false });
  } catch (error) {
    await call("probe.runtimeUiReport", { scenario: "screen-composition", passed: false, stage, stages, awaitedControl, keyObservation, feedback:document.querySelector(".screen-message")?.textContent, selectedId:selected(), error: String(error), nativeWebView: true, sdkExecuted: false });
  }
})();
