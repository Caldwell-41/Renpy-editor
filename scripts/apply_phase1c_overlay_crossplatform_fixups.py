from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/lifecycle.rs"
text = path.read_text(encoding="utf-8")

start = text.index("#[cfg(windows)]\nfn apply_overlay(\n")
end = text.index("\n#[cfg(unix)]\nfn apply_overlay(\n", start)
text = text[:start] + text[end + 1 :]

for signature in [
    "#[cfg(unix)]\nfn apply_overlay(\n",
    "#[cfg(unix)]\nfn apply_overlay_with_hook<F>(\n",
    "#[cfg(unix)]\nfn write_new_anchored(\n",
    "#[cfg(unix)]\nfn write_new_or_replace_anchored(\n",
]:
    if text.count(signature) != 1:
        raise SystemExit(f"expected one cross-platform overlay signature: {signature}")
    text = text.replace(signature, signature.removeprefix("#[cfg(unix)]\n"), 1)

path.write_text(text, encoding="utf-8")
print("Phase 1C overlay anchors enabled on both supported targets")
