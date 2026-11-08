import { chromium } from "playwright";

export function launchBrowser(options) {
  if (process.platform === "darwin" && process.env.CODEX_SANDBOX === "seatbelt") {
    throw new Error(
      "Browser launch blocked before starting Chrome: the macOS agent sandbox prevents app registration. " +
      "Run this same check with scoped permission outside the agent sandbox."
    );
  }
  return chromium.launch(options);
}
