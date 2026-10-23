"""Compare admitted helper/reference captures without resizing or pixel tolerance.

Requires Pillow. Exit 1 retains a failed comparison; it never grants a tolerance.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops


def compare(helper, reference, output):
    output.mkdir(parents=True, exist_ok=False)
    result = {"passed": False, "samples": [], "errors": [], "tolerance": 0}
    try:
        h = json.loads((helper / "result.json").read_text())
        r = json.loads((reference / "result.json").read_text())
        inputs = json.loads((helper / "inputs.json").read_text())
        assert h["passed"] is True and r["passed"] is True, "Capture or cleanup failed"
        assert h["fixtureRemoved"] is True and h["driver"]["exitCode"] == 0
        assert r["criteria"] == dict(runtimeClean=True, samplesMatch=True, windowsMatch=True,
                                     contextMatches=True, geometryMatches=True, sourceClean=True)
        assert r["cleanup"] == dict(scratchRemoved=True, runtimeShutdown=True, projectClosed=True)
        assert r["sourceUnchanged"] is True
        assert set(inputs) == {"ui/help.rpy", "assets/canvas.ttf", "assets/help.png"}
        assert all(len(value) == 64 and all(c in "0123456789abcdef" for c in value) for value in inputs.values())
        assert len(h["records"]) == len(r["records"]) == 4, "Exactly four samples required"
        for width, height in [(1280, 720), (1024, 768)]:
            for state in ["normal", "hover"]:
                helpers = [f for f in h["records"] if (f["width"], f["height"], f["buttonState"]) == (width, height, state)]
                references = [f for f in r["records"] if (f["aspect"], f["state"]) == ([width, height], state)]
                assert len(helpers) == len(references) == 1, "Missing or duplicate sample"
                frame, ref = helpers[0], references[0]
                assert ref["inputs"] == inputs, "Source/font/image mismatch"
                assert frame["revision"] == inputs["ui/help.rpy"]
                assert frame["renderer"] == ref["renderer"]["renderer"]
                assert frame["renderer"] in ("gl2", "angle2")
                assert frame["diagnostics"]["physical"] == ref["physical"] == [width, height]
                assert frame["diagnostics"]["drawPerVirtual"] == ref["drawPerVirtual"] > 0
                assert ref["menu"] is False and ref["widgetSelection"] == "base"
                plan = frame["plan"]
                assert plan["available"] is True and plan["limits"] == []
                assert plan["revision"] == frame["revision"]
                assert (plan["width"], plan["height"], plan["buttonState"]) == (width, height, state)
                geometry = []
                for kind, name in [("frame", "help_panel"), ("vbox", "help_group"), ("text", "help_text"),
                                   ("image", "help_image"), ("textbutton", "help_button")]:
                    nodes = [n for n in plan["nodes"] if n["kind"] == kind]
                    assert len(nodes) == 1
                    boxes = [g for g in frame["geometry"] if g["start"] == nodes[0]["start"]]
                    assert len(boxes) == 1
                    box = boxes[0]
                    assert [box["width"], box["height"]] == ref["geometry"][name], name + " size mismatch"
                    if kind == "frame":
                        assert [box["x"], box["y"]] == [(width - 640) / 2, (height - 360) / 2]
                    geometry.append({"name": name, **box})
                prefix = f"{width}x{height}-{state}"
                assert frame["filename"] == f"helper-{prefix}.png"
                assert ref["filename"] == f"reference-{prefix}.png"
                with Image.open(helper / frame["filename"]) as source:
                    a = source.convert("RGBA")
                with Image.open(reference / ref["filename"]) as source:
                    b = source.convert("RGBA")
                assert a.size == b.size == (width, height), "Image dimensions differ"
                diff = ImageChops.difference(a, b)
                maximum = diff.getchannel("R")
                for channel in "GBA":
                    maximum = ImageChops.lighter(maximum, diff.getchannel(channel))
                count = sum(maximum.histogram()[1:])
                result["samples"].append({"aspect": [width, height], "state": state, "renderer": frame["renderer"],
                    "drawPerVirtual": ref["drawPerVirtual"], "geometry": geometry,
                    "differentRGBA": count, "maxChannelDelta": maximum.getextrema()[1], "bounds": maximum.getbbox(),
                    "helperRGBA256": hashlib.sha256(a.tobytes()).hexdigest(),
                    "referenceRGBA256": hashlib.sha256(b.tobytes()).hexdigest()})
                maximum.save(output / f"difference-{prefix}.png")
                # Original scale, opaque checker-free dark backing for visual review.
                pair = Image.new("RGBA", (width * 2, height), "#141a22")
                pair.alpha_composite(a, (0, 0))
                pair.alpha_composite(b, (width, 0))
                pair.convert("RGB").save(output / f"pair-{prefix}.png")
        for width, height in [(1280, 720), (1024, 768)]:
            samples = [sample for sample in result["samples"] if sample["aspect"] == [width, height]]
            assert samples[0]["helperRGBA256"] != samples[1]["helperRGBA256"], "Hover appearance did not change"
            assert samples[0]["referenceRGBA256"] != samples[1]["referenceRGBA256"], "Reference hover appearance did not change"
        result["inputs"] = inputs
        result["passed"] = all(s["differentRGBA"] == 0 for s in result["samples"])
    except (AssertionError, KeyError, ValueError, TypeError, OSError) as error:
        result["errors"].append(str(error) or type(error).__name__)
    (output / "comparison.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("helper", type=Path)
    parser.add_argument("reference", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    result = compare(args.helper, args.reference, args.output)
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["passed"] else 1)
