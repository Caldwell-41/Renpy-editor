# The separate encoded fixture covers an initial UTF-8 BOM.
define sample_text = "Unicode: café — 星"

label lexical_cases:
    "Escaped quote: \"yes\" and interpolation: [sample_text!q]"
    "Text tags: {b}bold{/b} and literal braces: {{ok}}"
    return  # inline comment must survive
