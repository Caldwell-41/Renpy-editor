label loomlight_scene_f430d949a634431c803871a25441d72d:
    # Imported arithmetic and exact neighboring source stay intact.
    $ trust = 5  # starting observation
    $ money = 9.5
    $ trust += (9007199254740993 // 3) % 5  # imported compound
    $ money = money % (2)  # imported explicit
    $ trust = max(0, trust - 1)  # protected function
    if flag:
        $ trust += 1  # nested arithmetic
        $ trust = (bonus + 2) * 3
    else:
        pass
    $ arith_flag = True
    $ arith_title = "retained text"
    "Arithmetic journey"
    return
# competing accepted Source
