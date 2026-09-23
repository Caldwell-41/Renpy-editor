import "./styles.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { requestApplicationExit, startApplication } from "./main.ts";

startApplication();

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
