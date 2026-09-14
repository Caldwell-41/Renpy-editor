from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app/src-core/src/lifecycle.rs"
text = path.read_text(encoding="utf-8")
old = '''            let stage_parent = temp.path().join("anchored-child-test");
            fs::create_dir(&stage_parent).unwrap();
            let token = uuid::Uuid::new_v4().to_string();
'''
new = '''            let requested_stage_parent = temp.path().join("anchored-child-test");
            fs::create_dir(&requested_stage_parent).unwrap();
            let stage_parent = requested_stage_parent.canonicalize().unwrap();
            let token = uuid::Uuid::new_v4().to_string();
'''
if text.count(old) != 1:
    raise SystemExit("expected one anchored-child-test setup block")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Phase 1C target-gate path fixup applied")
