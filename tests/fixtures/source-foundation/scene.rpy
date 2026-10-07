label scene_one:
    # surrounding café 雪
    if flag:
        # true branch comment
        bec "True café 雪" # keep true suffix
    else:
        bec "False café 雪" # keep false suffix
    python:
        opaque_neighbor = "kept"
    "Foundation continuation"
    return
