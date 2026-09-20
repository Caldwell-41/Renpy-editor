transform fixture_bob:
    subpixel True
    linear 0.20 yoffset -12
    linear 0.20 yoffset 0
    repeat 2

label media_statements:
    play music "audio/theme.ogg" fadein 1.0
    queue music "audio/loop.ogg" loop
    play sound "audio/click.ogg"
    voice "voice/line_001.ogg"
    show expression Movie(play="video/sky.webm") as sky_movie
    stop sound fadeout 0.2
    stop music fadeout 1.0
    return
