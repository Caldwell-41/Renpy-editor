label ENTRY_LABEL:
    # Imported arithmetic and exact neighboring source stay intact.
    $ trust = 5  # starting observation
    $ money = 9.5
    $ trust += (bonus + 2) * 3  # imported compound
    $ money = money / 2  # imported explicit
    $ trust = max(0, trust - 1)  # protected function
    if flag:
        $ trust += 1  # nested arithmetic
    else:
        pass
    $ arith_flag = True
    $ arith_title = "retained text"
    "Arithmetic journey"
    return
