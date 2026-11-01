use super::*;

#[test]
fn screen_creation_returns_the_committed_catalog_when_a_later_inventory_cannot_be_read() {
    let (_temporary, mut service, root, _owner) = composition_project();
    fs::write(root.join("game/ui/saved.rpyc"), b"unresolved bytecode").unwrap();
    let before = ipc(&mut service, "screens.list", json!({}));
    assert!(before["styles"]["error"].is_string());
    let created = crate::transaction::with_durable_commit_hook(
        |root| fs::write(root.join("game/late.rpy"), vec![b'#'; 16 * 1024 * 1024 + 1]).unwrap(),
        || {
            ipc(
                &mut service,
                "screens.create",
                json!({"name":"saved",
            "expectedProjectRevision":before["projectRevision"],
            "expectedSourceMapRevision":before["sourceMapRevision"],
            "expectedInventoryRevision":before["inventoryRevision"]}),
            )
        },
    );
    assert!(root.join("game/late.rpy").exists());
    assert_eq!(created["owned"][1]["name"], "saved");
    assert_eq!(created["owned"][1]["resolved"], true);
    assert!(created["styles"]["error"].is_null());
    assert!(fs::read_to_string(root.join("game/ui/saved.rpy"))
        .unwrap()
        .ends_with("screen saved():\n    pass\n"));
    assert_eq!(
        reject(&mut service, "screens.list", json!({}))["error"]["code"],
        "SOURCE_CONFLICT"
    );
    fs::remove_file(root.join("game/late.rpy")).unwrap();
    assert_eq!(created, ipc(&mut service, "screens.list", json!({})));
    composition_history(&mut service, "undo");
    assert!(!root.join("game/ui/saved.rpy").exists());
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"],
        before["owned"]
    );
}

#[test]
fn screen_creation_preflights_projected_aggregate_source_bytes() {
    let (_temporary, mut service, root, _owner) = composition_project();
    let files = ipc(&mut service, "source.list", json!({}));
    let current_bytes = files["files"]
        .as_array()
        .unwrap()
        .iter()
        .map(|file| {
            fs::metadata(root.join(file["path"].as_str().unwrap()))
                .unwrap()
                .len() as usize
        })
        .sum::<usize>();
    // Leave 32 bytes in the accepted 64 MiB inventory, less than a marked screen.
    let mut remaining = 64 * 1024 * 1024 - 32 - current_bytes;
    for index in 0..4 {
        let size = remaining.min(16 * 1024 * 1024);
        fs::write(
            root.join(format!("game/padding-{index}.rpy")),
            vec![b'#'; size],
        )
        .unwrap();
        remaining -= size;
    }
    assert_eq!(remaining, 0);
    let catalog = ipc(&mut service, "screens.list", json!({}));
    let before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    assert_eq!(
        reject(
            &mut service,
            "screens.create",
            json!({"name":"too_large",
        "expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]})
        )["error"]["code"],
        "SCENE_INVARIANT"
    );
    assert!(!root.join("game/ui/too_large.rpy").exists());
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        before
    );
}

#[test]
fn screen_creation_reserves_entries_for_the_file_and_missing_ui_directory() {
    let temporary = tempfile::tempdir().unwrap();
    let profile = temporary.path().join("profile");
    let mut service = LifecycleService::prepare_source_foundation_probe(profile.clone()).unwrap();
    let root = profile.join("synthetic-project");
    service.open_path(&root).unwrap();
    assert!(!root.join("game/ui").exists());
    fn count_entries(directory: &std::path::Path) -> usize {
        fs::read_dir(directory)
            .unwrap()
            .map(|entry| {
                let path = entry.unwrap().path();
                1 + if path.is_dir() {
                    count_entries(&path)
                } else {
                    0
                }
            })
            .sum()
    }
    let padding = root.join("game/padding");
    fs::create_dir(&padding).unwrap();
    let first = count_entries(&root.join("game"));
    for index in first..16383 {
        fs::create_dir(padding.join(format!("empty-{index}"))).unwrap();
    }
    let create = |service: &mut LifecycleService, name: &str, accept: bool| {
        let catalog = ipc(service, "screens.list", json!({}));
        let payload = json!({"name":name,"expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],
            "expectedInventoryRevision":catalog["inventoryRevision"]});
        if accept {
            let created = ipc(service, "screens.create", payload);
            assert_eq!(created, ipc(service, "screens.list", json!({})));
        } else {
            reject(service, "screens.create", payload);
            assert_eq!(catalog, ipc(service, "screens.list", json!({})));
        }
    };
    create(&mut service, "needs_directory", false);
    assert!(!root.join("game/ui").exists());
    fs::remove_dir(padding.join(format!("empty-{first}"))).unwrap();
    create(&mut service, "fits_directory", true);
    create(&mut service, "needs_file", false);
    assert!(!root.join("game/ui/needs_file.rpy").exists());
    fs::remove_dir(padding.join(format!("empty-{}", first + 1))).unwrap();
    create(&mut service, "fits_file", true);
}

#[test]
fn python_screen_assignments_preserve_owned_resolution_and_creation() {
    let (_temporary, mut service, root, owner) = composition_project();
    fs::write(
        root.join("game/python.rpy"),
        "init python:\n    screen = None\n    if True:\n        screen = 'nested'\npython early:\n    screen = None\ninit -5 python in store:\n    screen = None\npython early hide:\n    screen = None\npython early hide in named.store:\n    screen = None\ninit 5:\n    screen taken():\n        pass\n",
    )
    .unwrap();
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(catalog["owned"][0]["resolved"], true);
    assert_eq!(catalog["owned"][0]["id"], owner["id"]);
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"more_notes","expectedProjectRevision":catalog["projectRevision"],
            "expectedSourceMapRevision":catalog["sourceMapRevision"],
            "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    assert!(created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .all(|s| s["resolved"] == true));
    // A Ren'Py block after Python still participates in collision detection.
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(
        reject(
            &mut service,
            "screens.create",
            json!({"name":"taken",
        "expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]})
        )["error"]["code"],
        "INCOMING_REFERENCE"
    );
}

#[test]
fn screen_creation_preflights_the_projected_file_limit_without_writing() {
    let (_temporary, mut service, root, owner) = composition_project();
    fn count_files(directory: &std::path::Path) -> usize {
        fs::read_dir(directory)
            .unwrap()
            .map(|entry| {
                let path = entry.unwrap().path();
                if path.is_dir() {
                    count_files(&path)
                } else {
                    1
                }
            })
            .sum()
    }
    let assets = root.join("game/assets");
    fs::create_dir_all(&assets).unwrap();
    for index in count_files(&root.join("game"))..4096 {
        fs::write(assets.join(format!("asset-{index}.png")), []).unwrap();
    }
    let catalog = ipc(&mut service, "screens.list", json!({}));
    assert_eq!(catalog["owned"][0]["id"], owner["id"]);
    let before = fs::read(root.join(".renpy-editor/source-map.json")).unwrap();
    reject(
        &mut service,
        "screens.create",
        json!({"name":"overflow",
        "expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    assert!(
        !root.join("game/ui/overflow.rpy").exists(),
        "refusal must precede durable creation"
    );
    assert_eq!(
        fs::read(root.join(".renpy-editor/source-map.json")).unwrap(),
        before
    );
    assert_eq!(
        ipc(&mut service, "screens.list", json!({}))["owned"],
        catalog["owned"]
    );
    fs::remove_file(
        fs::read_dir(&assets)
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path(),
    )
    .unwrap();
    let created = ipc(
        &mut service,
        "screens.create",
        json!({"name":"fits",
        "expectedProjectRevision":catalog["projectRevision"],
        "expectedSourceMapRevision":catalog["sourceMapRevision"],
        "expectedInventoryRevision":catalog["inventoryRevision"]}),
    );
    assert_eq!(created, ipc(&mut service, "screens.list", json!({})));
    assert!(created["owned"]
        .as_array()
        .unwrap()
        .iter()
        .all(|s| s["resolved"] == true));
}

#[test]
fn grid_add_accepts_scalar_policy_whitespace_and_refuses_ambiguous_policies() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let grid = compose_command(
        &mut service,
        &owner,
        json!({"type":"add","parentId":owner["rootId"],"kind":"grid","text":""}),
    );
    let base = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    for (policy, allowed) in [
        ("allow_underfull   True # keep policy", true),
        ("allow_underfull\tTrue", true),
        ("allow_underfull True\n        allow_underfull\tTrue", false),
        ("allow_underfull True extra", false),
        ("allow_underfull True:\n            pass", false),
        ("allow_underfull   False", false),
    ] {
        let source = base.replace("allow_underfull True", policy);
        save_composition_source(&mut service, &owner, &source);
        let doc = ipc(
            &mut service,
            "screens.inspect",
            json!({"path":owner["path"]}),
        );
        let request = json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":{"type":"add","parentId":grid["selectedId"],"kind":"text","text":"Added"}});
        if allowed {
            let added = ipc(&mut service, "screens.compose", request);
            let accepted = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
                .as_str()
                .unwrap()
                .to_owned();
            assert!(accepted.starts_with(&source));
            assert!(accepted.contains("text \"Added\""));
            let plan = ipc(
                &mut service,
                "screens.canvasPlan",
                json!({"path":owner["path"],"screenName":"notes","expectedRevision":added["document"]["revision"],"width":1280,"height":720,"drafts":[]}),
            );
            assert_eq!(plan["available"], true, "{plan}");
            composition_history(&mut service, "undo");
        } else {
            assert_eq!(
                reject(&mut service, "screens.compose", request)["error"]["code"],
                "OPAQUE_BOUNDARY"
            );
        }
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            source
        );
    }
}

#[test]
fn literal_alias_edits_preserve_parent_controlled_values_and_comments() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let base = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    for (parent, field, blocked, replacement) in [
        ("vbox", "xpos", "ypos", "xpos 0.25 # keep alias comment\n            xanchor 0.5\n            ypos 0.5\n            yanchor 0.5"),
        ("hbox", "ypos", "xpos", "xpos 0.5 # keep alias comment\n            xanchor 0.5\n            ypos 0.25\n            yanchor 0.5"),
    ] {
        let source = base.replace("    pass\n", &format!("    {parent}:\n        frame:\n            align (0.5, 0.5) # keep alias comment\n            text \"Keep\"\n"));
        save_composition_source(&mut service, &owner, &source);
        let doc = ipc(&mut service, "screens.inspect", json!({"path":owner["path"]}));
        let node = &doc["screens"][0]["nodes"][2];
        assert!(node["numericLayout"]["blocked"][field].is_null());
        assert!(node["numericLayout"]["blocked"][blocked].is_string());
        let request = json!({"path":owner["path"],"screenName":"notes","expectedRevision":doc["revision"],"nodeStart":node["span"]["start"],"values":{field:{"unit":"relative","value":0.25}}});
        let accepted = ipc(&mut service, "screens.setLayout", request.clone());
        let expected = source.replace("align (0.5, 0.5) # keep alias comment", replacement);
        assert_eq!(ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"], expected);
        let mut noop = request.clone();
        noop["expectedRevision"] = accepted["revision"].clone();
        assert_eq!(ipc(&mut service, "screens.setLayout", noop.clone())["revision"], accepted["revision"]);
        noop["values"] = json!({blocked:{"unit":"relative","value":0.25}});
        assert_eq!(reject(&mut service, "screens.setLayout", noop)["error"]["code"], "OPAQUE_BOUNDARY");
        assert_eq!(reject(&mut service, "screens.setLayout", request)["error"]["code"], "SOURCE_CONFLICT");
        composition_history(&mut service, "undo");
        assert_eq!(ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"], source);
        composition_history(&mut service, "redo");
        assert_eq!(ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"], expected);
    }
}

#[test]
fn structural_edits_preserve_ambiguous_interleaved_comments() {
    let (_temporary, mut service, _root, owner) = composition_project();
    let base = ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"]
        .as_str()
        .unwrap()
        .to_owned();
    let group = "00000000-0000-4000-8000-000000000001";
    let a = "00000000-0000-4000-8000-000000000002";
    let b = "00000000-0000-4000-8000-000000000003";
    let keep = "00000000-0000-4000-8000-000000000004";
    for indent in ["", "    ", "\t", "        "] {
        let block = format!("    vbox: # loomlight-element: {group}\n        text \"A\" # loomlight-element: {a}\n{indent}# endregion\n        text \"B\" # loomlight-element: {b}\n");
        let source = format!(
            "# region project notes\n{}",
            base.replace(
                "    pass\n",
                &format!("{block}    text \"Keep\" # loomlight-element: {keep}\n")
            )
        );
        save_composition_source(&mut service, &owner, &source);
        if indent == "        " {
            compose_command(
                &mut service,
                &owner,
                json!({"type":"remove","nodeId":group}),
            );
            assert_eq!(
                ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
                source.replace(&block, "")
            );
            composition_history(&mut service, "undo");
        } else {
            for command in [
                json!({"type":"remove","nodeId":group}),
                json!({"type":"reorder","nodeId":group,"targetId":keep,"after":true}),
            ] {
                let doc = ipc(
                    &mut service,
                    "screens.inspect",
                    json!({"path":owner["path"]}),
                );
                assert_eq!(
                    reject(
                        &mut service,
                        "screens.compose",
                        json!({"screenId":owner["id"],"expectedRevision":doc["revision"],"command":command})
                    )["error"]["code"],
                    "OPAQUE_BOUNDARY"
                );
            }
        }
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":owner["path"]}))["text"],
            source
        );
    }
}

#[test]
fn canvas_refuses_unparsed_children_but_accepts_supported_property_spans() {
    let (_temporary, mut service, root, _owner) = composition_project();
    for (source, available, node_count) in [
        ("screen help():\n  text \"Help\"\n", false, 1),
        (
            "screen help():\n    fixed:\n      text \"Help\"\n",
            false,
            2,
        ),
        ("screen help():\n    text \"Help\"\n", true, 2),
        (
            "screen help():\n    modal True\n    textbutton \"Help\":\n        action Return()\n",
            true,
            2,
        ),
    ] {
        fs::write(root.join(PATH), source).unwrap();
        let doc = ipc(&mut service, "screens.inspect", json!({"path":PATH}));
        let plan = ipc(
            &mut service,
            "screens.canvasPlan",
            json!({"path":PATH,
            "screenName":"help","expectedRevision":doc["revision"],"width":1280,"height":720,"drafts":[]}),
        );
        assert_eq!(plan["available"], available, "{source}: {plan}");
        assert_eq!(plan["nodes"].as_array().unwrap().len(), node_count);
        if !available {
            assert!(!plan["limits"].as_array().unwrap().is_empty());
        }
        assert_eq!(
            ipc(&mut service, "source.open", json!({"path":PATH}))["text"],
            source
        );
    }
}
