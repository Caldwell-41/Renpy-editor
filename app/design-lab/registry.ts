import type { LabScreen } from "./contracts.ts";
import { approvalRecords } from "virtual:design-lab-approvals";
import { revisionFor } from "./approval.ts";
import { definition as story } from "./screens/story/definition.ts";
import { definition as source } from "./screens/source/definition.ts";
import { definition as branches } from "./screens/branches/definition.ts";
import { definition as lorebook } from "./screens/lorebook/definition.ts";
import { definition as assets } from "./screens/assets/definition.ts";
import { definition as variables } from "./screens/variables/definition.ts";
import { definition as welcome } from "./screens/welcome/definition.ts";
import { definition as newProject } from "./screens/new-project/definition.ts";
import { definition as settings } from "./screens/settings/definition.ts";
import { definition as studioRequest } from "./screens/studio-request/definition.ts";
import { definition as runtime } from "./screens/runtime/definition.ts";
import { definition as screenDesigner } from "./screens/screens/definition.ts";

import { definition as canvasDrag } from "./screens/canvas-drag/definition.ts";

function approvalFor(screenId: string) {
  const approval = approvalRecords.find(item => item.record.screenId === screenId);
  if (!approval) throw new Error(`Missing approval record for screen: ${screenId}`);
  return approval;
}

export const screens: readonly LabScreen[] = [{
  id: "character-notes",
  title: "Character notes example",
  kind: "prototype",
  approval: approvalFor("character-notes"),
  description: "Starter example for agents. All changes use sample data and reset on reload.",
  states: [
    { id: "populated", title: "Populated" },
    { id: "empty", title: "Empty notes" },
    { id: "long", title: "Long notes" },
    { id: "save-error", title: "Simulated save failure" },
  ],
  variants: [{ id: "starter", title: "Starter", load: () => import("./screens/character-notes/index.ts") }],
  check: "./screens/character-notes/check.mjs",
}, {
  id: "characters-writing",
  title: "Characters",
  kind: "prototype",
  approval: approvalFor("characters-writing"),
  description: "Two draft layouts share fictional Writing cards and interactive Game setup. Card saves, dialogue, appearances and source reviews stay in browser memory.",
  states: [
    { id: "populated", title: "Populated" },
    { id: "empty", title: "Empty writing" },
    { id: "long", title: "Long background" },
    { id: "save-error", title: "Simulated save failure" },
    { id: "proposed", title: "Proposed card review" },
    { id: "game-linked", title: "Game setup · linked" },
    { id: "game-planning", title: "Game setup · planning only" },
  ],
  variants: [
    { id: "dossier", title: "Continuous dossier", load: () => import("./screens/characters-writing/dossier.ts") },
    { id: "board", title: "Writing board", load: () => import("./screens/characters-writing/board.ts") },
  ],
  check: "./screens/characters-writing/check.mjs",
}, ...[story, source, branches, lorebook, assets, variables, welcome, newProject, settings, runtime, studioRequest, screenDesigner, canvasDrag].map(definition => ({ ...definition, approval: approvalFor(definition.id) }))];

for (const screen of screens) {
  for (const variant of screen.variants) revisionFor(screen.approval, variant.id);
  const approved = screen.approval.record.revisions.find(item => item.id === screen.approval.record.currentApproved);
  if (approved && !screen.variants.some(item => item.id === approved.variantId)) throw new Error(`Register the current approved layout: ${screen.id}/${approved.variantId}`);
}

export const viewports = [
  { id: "wide", title: "Wide · 1100 × 720", width: 1100, height: 720 },
  { id: "compact", title: "Compact · 560 × 640", width: 560, height: 640 },
] as const;

export function selection(search: string) {
  const query = new URLSearchParams(search);
  const screenId = query.get("screen") ?? screens[0]?.id;
  const screen = screens.find(item => item.id === screenId);
  if (!screen) throw new Error(`Unknown Design Lab screen: ${screenId}`);
  const approved = screen.approval.record.revisions.find(item => item.id === screen.approval.record.currentApproved);
  const variantId = query.get("variant") ?? approved?.variantId ?? screen.variants[0]?.id;
  const variant = screen.variants.find(item => item.id === variantId);
  const stateId = query.get("state") ?? screen.states[0]?.id;
  const state = screen.states.find(item => item.id === stateId);
  const viewportId = query.get("viewport") ?? "wide";
  const viewport = viewports.find(item => item.id === viewportId);
  const theme = query.get("theme") ?? "light";
  if (!variant || !state || !viewport || (theme !== "light" && theme !== "dark")) {
    throw new Error("Unknown Design Lab variant, sample state, viewport or theme. Select a registered example.");
  }
  return { screen, variant, state, viewport, theme } as const;
}
