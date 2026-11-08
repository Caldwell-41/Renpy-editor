//! Explicit L20 producer. Ordinary tests never start the SDK/helper.
#[path = "fidelity_capture_tests.rs"]
mod capture;

#[test]
#[ignore = "L20 reservation required: three SDK validation/discovery starts and one hidden helper"]
fn sample_fidelity_hidden_helper_captures_exported_cases() {
    capture::capture_cases(
        "LOOMLIGHT_SAMPLE_FIDELITY",
        "L20-sample-fidelity",
        include_bytes!("sample_fidelity_tests.rs"),
        super::asset_bytes,
    );
}
