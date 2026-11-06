//! Explicit L19 producer. Ordinary tests never start the SDK/helper.
#[path = "fidelity_capture_tests.rs"]
pub(super) mod capture;

#[test]
#[ignore = "L19 reservation required: three SDK validation/discovery starts and one hidden helper"]
fn nested_fidelity_hidden_helper_captures_exported_cases() {
    capture::capture_cases(
        "LOOMLIGHT_NESTED_FIDELITY",
        "L19-nested-fidelity",
        include_bytes!("nested_canvas_tests.rs"),
        super::fidelity_asset_bytes,
    );
}
