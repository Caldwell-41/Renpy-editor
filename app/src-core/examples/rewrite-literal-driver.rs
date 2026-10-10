//! Emits the actual core-encoded harmless fixture for pinned SDK display assertions.
use loomlight_core::rewrite_text::{Boundary, Segment};
fn main() {
    let boundary = Boundary::parse("Old [flag] {b}friend{/b}", "synthetic-revision").unwrap();
    let mut segments = boundary.segments.clone();
    segments[0]=Segment::Literal{literal:"[1 + 2] [str(7)] {a=jump:label}link{/a} {image=fixture} brackets [x] braces {x} quotes \" slash \\ café 雪 ".into()};
    let encoded = boundary.emit(&segments).unwrap();
    println!("{}", serde_json::json!({"encoded":encoded}));
}
