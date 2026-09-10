# Minimal deterministic metadata for the SDK distribution smoke test.
define config.name = "Crossroads at Sundown"
define config.version = "0.0.0"
define build.name = "crossroads-at-sundown"

init python:
    build.classify("**~", None)
    build.classify("**/#**", None)
