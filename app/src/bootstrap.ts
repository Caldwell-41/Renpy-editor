import "./styles.css";
import "./ui-refresh.css";
import { enableRichSourceEditor } from "./source-editor.ts";
enableRichSourceEditor();
import { loadPreferences } from "./preferences.ts";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { requestApplicationExit, startApplication } from "./main.ts";

void loadPreferences().then(() => startApplication());

const applicationWindow = getCurrentWindow();
let destroying = false;
void applicationWindow.onCloseRequested((event) => {
  if (destroying) return;
  const guarded = requestApplicationExit(async () => {
    destroying = true;
    await applicationWindow.destroy();
  });
  if (guarded) event.preventDefault();
});
