fn main() {
    println!("cargo:rerun-if-changed=src/renpy/runtime/canvas-owner.c");
    #[cfg(windows)]
    {
        let output = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
        let tool = cc::Build::new().static_crt(true).get_compiler();
        assert!(tool.is_like_msvc(), "Windows canvas owner requires MSVC");
        let status = tool.to_command()
            .args(["/nologo", "/std:c17", "/W4", "/WX", "/O2"])
            .arg("src/renpy/runtime/canvas-owner.c")
            .arg(format!("/Fo{}", output.join("canvas-owner.obj").display()))
            .arg(format!("/Fe{}", output.join("canvas-owner.exe").display()))
            .arg("user32.lib")
            .status().expect("Windows canvas owner compiler");
        assert!(status.success(), "Windows canvas owner compilation failed");
    }
}
