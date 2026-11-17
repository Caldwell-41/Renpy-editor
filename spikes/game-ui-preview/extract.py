"""Print a compact JSON digest of one or more results.json files. Throwaway (#198)."""
import json
import statistics
import sys


def st(values):
    values = sorted(v for v in values if v is not None)
    if not values:
        return None
    p95 = values[min(len(values) - 1, int(round(0.95 * (len(values) - 1))))]
    return dict(n=len(values), med=round(statistics.median(values), 1), p95=round(p95, 1))


def path_digest(rows):
    return dict(e2e=st([r.get("e2eMs") for r in rows]), helper=st([r.get("helperMs") for r in rows]),
                firstDraw=st([r.get("firstDrawMs") for r in rows]), readback=st([r.get("readbackMs") for r in rows]),
                encode=st([r.get("encodeMs") for r in rows]), load=st([r.get("loadMs") for r in rows]),
                rebuild=st([r.get("rebuildMs") for r in rows]), allChanged=all(r.get("changed") for r in rows[1:]),
                allOk=all(r.get("ok") for r in rows))


def digest(results):
    out = dict(host=results.get("host"), commit=results.get("commit"), processes=results.get("processesUsed"),
               error=(results.get("error") or "")[-800:] or None, variants={})
    for name, v in results.get("variants", {}).items():
        d = dict(copyMs=round(v.get("copyMs", 0), 1), starts=[])
        for s in v.get("starts", []):
            f = s.get("helperFirst", {})
            row = dict(compiled=s.get("compiled"), launchToImage=round(s.get("launchToImageMs", 0)))
            if s.get("tLaunch") and f.get("tInit"):
                row.update(launchToInit=round((f["tInit"] - s["tLaunch"]) * 1000), initToCommand=round((f["tCommand"] - f["tInit"]) * 1000),
                           commandToLoop=round((f["tMain"] - f["tCommand"]) * 1000), loopToPng=round((f["tPng"] - f["tMain"]) * 1000))
            row.update(native=f.get("native"), renderer=f.get("renderer"), physical=f.get("physical"),
                       drawPerVirt=f.get("drawPerVirt"), stopExit=(s.get("stop") or {}).get("exit"),
                       killed=(s.get("stop") or {}).get("killed"))
            d["starts"].append(row)
        d["focus"] = v.get("focus")
        sess = v.get("session") or {}
        if sess.get("paths"):
            d["paths"] = {k: path_digest(rows) for k, rows in sess["paths"].items()}
        if sess.get("drafts"):
            d["drafts"] = {k: path_digest(rows) for k, rows in sess["drafts"].items()}
        if sess.get("screens"):
            d["screens"] = {}
            for k, sc in sess["screens"].items():
                verdicts = {}
                for row in sc["lines"]:
                    verdicts[row["verdict"]] = verdicts.get(row["verdict"], 0) + 1
                checks = [c for c in (sc.get("rectChecks") or []) if "bestMatch" in c]
                good = [c for c in checks if c["bestMatch"] >= 0.9]
                d["screens"][k] = dict(elements=sc["elements"], lines=verdicts,
                                       coverage={n: [c["located"], c["statements"], c["missing"]] for n, c in sc["coverage"].items()},
                                       rectChecked=len(checks), rectMatched=len(good),
                                       rectMaxOffset=max([max(abs(c["dx"]), abs(c["dy"])) for c in good], default=None),
                                       rectUnverifiable=len(sc.get("rectChecks") or []) - len(checks), showMs=round(sc.get("showMs") or 0))
        if sess.get("broken"):
            d["broken"] = [dict(case=b["case"], reported=b["error"], errorMs=round(b["errorMs"] or 0), toGood=round(b["errorToGoodImageMs"]),
                                goodOk=b.get("goodOk"), alive=b["processAlive"]) for b in sess["broken"]]
        p = sess.get("pointer")
        if p:
            d["pointer"] = dict(moves=path_digest(p["moves"]), click=None if not p.get("click") else dict(
                e2e=round(p["click"]["e2eMs"]), firstDraw=p["click"].get("firstDrawMs"), changed=p["click"].get("changed"),
                screens=[x.split(":")[-1] for x in p["click"].get("screensAfter", [])]))
        out["variants"][name] = d
    return out


for path in sys.argv[1:]:
    with open(path, encoding="utf-8") as f:
        print(json.dumps(digest(json.load(f)), indent=1))
